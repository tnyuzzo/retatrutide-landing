import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { Resend } from 'resend';
import { cartRecoveryEmail } from '@/lib/email-templates';

/**
 * Cron Job: Send cart recovery emails to pending orders.
 * Schedule: Every hour (Vercel Cron).
 *
 * Email cadence per order:
 *   - Email 1: after 1 hour
 *   - Email 2: after 12 hours
 *   - Email 3: after 48 hours
 *
 * Protected by CRON_SECRET.
 */

const EMAIL_SCHEDULE = [
    { emailNumber: 1 as const, minAgeMs: 1 * 60 * 60 * 1000 },       // 1h
    { emailNumber: 2 as const, minAgeMs: 12 * 60 * 60 * 1000 },      // 12h
    { emailNumber: 3 as const, minAgeMs: 48 * 60 * 60 * 1000 },      // 48h
];

export async function GET(req: Request) {
    const authHeader = req.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
        console.error('CRITICAL: CRON_SECRET is not configured.');
        return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 });
    }
    if (authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!process.env.RESEND_API_KEY) {
        console.error('Cart recovery: RESEND_API_KEY not configured.');
        return NextResponse.json({ error: 'Email not configured' }, { status: 500 });
    }

    try {
        const resend = new Resend(process.env.RESEND_API_KEY);
        const fromEmail = process.env.RESEND_FROM_EMAIL || 'Aura Peptides <noreply@aurapep.eu>';
        const now = Date.now();
        let totalSent = 0;

        // Find all pending orders that haven't received all 3 recovery emails
        const { data: pendingOrders, error: fetchError } = await supabaseAdmin
            .from('orders')
            .select('id, reference_id, order_number, email, fiat_amount, crypto_currency, crypto_amount, payment_url, created_at, recovery_emails_sent, last_recovery_email_at, locale')
            .eq('status', 'pending')
            .lt('recovery_emails_sent', 3)
            .order('created_at', { ascending: true });

        if (fetchError) {
            console.error('Cart recovery: Failed to fetch orders:', fetchError);
            return NextResponse.json({ error: fetchError.message }, { status: 500 });
        }

        if (!pendingOrders || pendingOrders.length === 0) {
            return NextResponse.json({ sent: 0, message: 'No orders need recovery emails' });
        }

        for (const order of pendingOrders) {
            if (!order.email?.includes('@')) continue;

            const orderAgeMs = now - new Date(order.created_at).getTime();
            const emailsSent = order.recovery_emails_sent || 0;

            // Find the next email to send
            const nextEmail = EMAIL_SCHEDULE[emailsSent];
            if (!nextEmail) continue;

            // Check if enough time has passed for this email
            if (orderAgeMs < nextEmail.minAgeMs) continue;

            // Avoid sending two emails too close together (min 30 min gap)
            if (order.last_recovery_email_at) {
                const timeSinceLastEmail = now - new Date(order.last_recovery_email_at).getTime();
                if (timeSinceLastEmail < 30 * 60 * 1000) continue;
            }

            try {
                const { subject, html } = cartRecoveryEmail({
                    referenceId: order.reference_id,
                    orderNumber: order.order_number,
                    fiatAmount: order.fiat_amount || 0,
                    cryptoCurrency: order.crypto_currency || '',
                    cryptoAmount: parseFloat(String(order.crypto_amount)) || 0,
                    paymentUrl: order.payment_url || '',
                    emailNumber: nextEmail.emailNumber,
                    locale: order.locale || 'en',
                });

                await resend.emails.send({
                    from: fromEmail,
                    replyTo: 'support@aurapeptides.eu',
                    to: order.email,
                    subject,
                    html,
                });

                // Update order tracking
                await supabaseAdmin
                    .from('orders')
                    .update({
                        recovery_emails_sent: emailsSent + 1,
                        last_recovery_email_at: new Date().toISOString(),
                    })
                    .eq('id', order.id);

                totalSent++;
                console.log(`Cart recovery: Sent email #${nextEmail.emailNumber} for order ${order.reference_id}`);
            } catch (emailErr) {
                console.error(`Cart recovery: Failed to send email for ${order.reference_id}:`, emailErr);
            }
        }

        console.log(`Cart recovery: Sent ${totalSent} recovery emails.`);
        return NextResponse.json({ sent: totalSent });

    } catch (error) {
        console.error('Cart recovery error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
