import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { Resend } from 'resend';

// Helper function to safely send emails without blocking the webhook response
const resend = new Resend(process.env.RESEND_API_KEY || 're_dummy_key');

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);

        const order_id = searchParams.get('order_id');
        const pending = searchParams.get('pending');
        const value_forwarded_coin = searchParams.get('value_forwarded_coin');
        // const coin = searchParams.get('coin'); // CryptAPI sends this too

        // CryptAPI ALWAYS requires exactly "*ok*" to acknowledge receipt and stop retrying
        if (!order_id) {
            return new NextResponse('*ok*', { status: 200 });
        }

        if (pending === '0') {
            // 1. Fetch current order to check if it was already processed
            const { data: order, error: fetchError } = await supabase
                .from('orders')
                .select('id, status, email, shipping_address, items')
                .eq('reference_id', order_id)
                .single();

            if (fetchError || !order) {
                console.error("Webhook: Order not found or error:", fetchError);
                return new NextResponse('*ok*', { status: 200 });
            }

            if (order.status === 'paid' || order.status === 'shipped') {
                console.log(`Webhook: Order ${order_id} already processed.`);
                return new NextResponse('*ok*', { status: 200 });
            }

            // 2. Mark as Paid
            const { error: updateError } = await supabase
                .from('orders')
                .update({
                    status: 'paid',
                    crypto_amount: value_forwarded_coin ? parseFloat(value_forwarded_coin) : undefined,
                    updated_at: new Date().toISOString()
                })
                .eq('reference_id', order_id);

            if (updateError) {
                console.error("Webhook: DB Update Error (Paid Status):", updateError);
                return new NextResponse('*ok*', { status: 200 });
            }

            console.log(`Webhook: Order ${order_id} marked as PAID!`);

            // --- DEFER BACKGROUND TASKS ---
            // In a real serverless env (Vercel), you'd normally use something like Inngest, Upstash QStash, 
            // or Vercel Functions timing to allow background work to finish. Next.js App Router API 
            // naturally allows execution to continue after response, though Vercel might kill it.
            // For now, we await them to ensure they run, since CryptAPI has a long timeout.

            // 3. Decrement Inventory
            try {
                // Assuming items array exists, sum up the quantities. Otherwise default to 1 kit.
                let totalQuantityToDeduct = 1;
                if (order.items && Array.isArray(order.items)) {
                    totalQuantityToDeduct = order.items.reduce((sum: number, item: any) => sum + (item.quantity || 1), 0);
                }

                // Call Supabase RPC (Server Action) or do it directly if RLS allows Service Role
                // We'll read the current quantity first (Careful of race conditions in high volume, 
                // ideally use a Postgres Function for atomic decrement)
                const { data: invData } = await supabase
                    .from('inventory')
                    .select('quantity')
                    .eq('sku', 'RET-KIT-1')
                    .single();

                if (invData) {
                    const newQty = Math.max(0, invData.quantity - totalQuantityToDeduct);
                    await supabase
                        .from('inventory')
                        .update({ quantity: newQty, updated_at: new Date().toISOString() })
                        .eq('sku', 'RET-KIT-1');

                    console.log(`Webhook: Inventory decremented to ${newQty}`);
                }
            } catch (invErr) {
                console.error("Webhook: Failed to decrement inventory:", invErr);
            }

            // 4. Send Emails via Resend
            if (process.env.RESEND_API_KEY) {
                try {
                    // Send to Warehouse/Admin
                    const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL || 'admin@example.com';
                    await resend.emails.send({
                        from: 'Retatrutide Orders <onboarding@resend.dev>',
                        to: adminEmail,
                        subject: `🚨 NUOVO ORDINE PAGATO IN CRYPTO: ${order_id.slice(-8)}`,
                        html: `
                            <h2>Nuovo Ordine Da Evadere</h2>
                            <p>L'ordine <strong>${order_id}</strong> e' appena stato confermato sulla blockchain.</p>
                            <p><strong>Spedizione:</strong><br/>
                            <pre>${JSON.stringify(order.shipping_address, null, 2)}</pre></p>
                            <p>Accedi alla <a href="${process.env.NEXT_PUBLIC_SITE_URL}/admin">Dashboard</a> per loggare la spedizione.</p>
                        `
                    });

                    // Send to Customer
                    if (order.email && order.email.includes('@')) {
                        await resend.emails.send({
                            from: 'Retatrutide Support <onboarding@resend.dev>',
                            to: order.email,
                            subject: 'Conferma Ricezione Pagamento Crypto - Ordine in Preparazione',
                            html: `
                                <h2>Pagamento Ricevuto!</h2>
                                <p>Ciao! Il tuo deposito crypto per l'ordine <strong>${order_id.slice(-8)}</strong> è stato confermato.</p>
                                <p>Il tuo kit è in preparazione logistica. Riceverai un'ulteriore mail con il tracking number non appena il pacco verra' affidato al corriere espresso.</p>
                                <p>Grazie per aver scelto la nostra ricerca.</p>
                            `
                        });
                    }
                } catch (emailErr) {
                    console.error("Webhook: Failed to send emails:", emailErr);
                }
            } else {
                console.log("Webhook: RESEND_API_KEY missing. Skipped sending emails.");
            }
        }

        // Must always return *ok* to stop CryptAPI from pinging
        return new NextResponse('*ok*', { status: 200 });

    } catch (error) {
        console.error("CryptAPI Webhook error:", error);
        return new NextResponse('*ok*', { status: 200 });
    }
}
