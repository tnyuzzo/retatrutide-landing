import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { Resend } from 'resend';
import {
    orderConfirmationAdminEmail,
    orderConfirmationCustomerEmail,
} from '@/lib/email-templates';

const resend = new Resend(process.env.RESEND_API_KEY || 're_dummy_key');
const EMAIL_FROM = process.env.RESEND_FROM_EMAIL || 'Aura Peptides <onboarding@resend.dev>';
const EMAIL_REPLY_TO = 'support@aurapeptides.eu';

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);

        const order_id = searchParams.get('order_id');
        const pending = searchParams.get('pending');
        const value_forwarded_coin = searchParams.get('value_forwarded_coin');
        const secret = searchParams.get('secret');

        // CryptAPI ALWAYS requires exactly "*ok*" to acknowledge receipt
        if (!order_id) {
            return new NextResponse('*ok*', { status: 200 });
        }

        // ── Webhook Secret Verification (fail-closed) ──
        const expectedSecret = process.env.WEBHOOK_SECRET;
        if (!expectedSecret) {
            console.error('CRITICAL: WEBHOOK_SECRET is not configured. Rejecting ALL webhook calls.');
            return new NextResponse('*ok*', { status: 200 });
        }
        if (secret !== expectedSecret) {
            console.warn(`Webhook: Invalid secret for order ${order_id}. Rejecting.`);
            return new NextResponse('*ok*', { status: 200 });
        }

        if (pending === '0') {
            // 1. Fetch current order
            const { data: order, error: fetchError } = await supabaseAdmin
                .from('orders')
                .select('id, status, email, shipping_address, items, fiat_amount, crypto_currency, crypto_amount')
                .eq('reference_id', order_id)
                .single();

            if (fetchError || !order) {
                console.error("Webhook: Order not found:", fetchError);
                return new NextResponse('*ok*', { status: 200 });
            }

            // Idempotency: skip if already processed
            if (['paid', 'processing', 'shipped', 'delivered'].includes(order.status)) {
                console.log(`Webhook: Order ${order_id} already processed (status: ${order.status}).`);
                return new NextResponse('*ok*', { status: 200 });
            }

            // 2. Mark as Paid
            const updatePayload: Record<string, unknown> = {
                status: 'paid',
                updated_at: new Date().toISOString(),
            };
            if (value_forwarded_coin) {
                updatePayload.crypto_amount = parseFloat(value_forwarded_coin);
            }

            const { error: updateError } = await supabaseAdmin
                .from('orders')
                .update(updatePayload)
                .eq('reference_id', order_id);

            if (updateError) {
                console.error("Webhook: DB Update Error:", updateError);
                return new NextResponse('*ok*', { status: 200 });
            }

            console.log(`Webhook: Order ${order_id} marked as PAID!`);

            // 3. Atomic Inventory Decrement (optimistic concurrency with retry)
            try {
                let totalQuantityToDeduct = 1;
                if (order.items && Array.isArray(order.items)) {
                    totalQuantityToDeduct = order.items.reduce(
                        (sum: number, item: { quantity?: number }) => sum + (item.quantity || 1), 0
                    );
                }

                const MAX_RETRIES = 3;
                let decremented = false;

                for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
                    const { data: invData } = await supabaseAdmin
                        .from('inventory')
                        .select('quantity')
                        .eq('sku', 'RET-KIT-1')
                        .single();

                    if (!invData) break;

                    const previousQty = invData.quantity;
                    const newQty = Math.max(0, previousQty - totalQuantityToDeduct);

                    // Optimistic concurrency: only update if quantity hasn't changed
                    const { data: updated, error: updateErr } = await supabaseAdmin
                        .from('inventory')
                        .update({ quantity: newQty, updated_at: new Date().toISOString() })
                        .eq('sku', 'RET-KIT-1')
                        .eq('quantity', previousQty)
                        .select()
                        .single();

                    if (updateErr || !updated) {
                        console.warn(`Webhook: Inventory concurrent update detected (attempt ${attempt + 1}/${MAX_RETRIES})`);
                        continue;
                    }

                    // Log inventory movement
                    await supabaseAdmin
                        .from('inventory_movements')
                        .insert({
                            sku: 'RET-KIT-1',
                            type: 'remove',
                            quantity: -totalQuantityToDeduct,
                            previous_quantity: previousQty,
                            new_quantity: newQty,
                            reason: `Auto-deducted: order ${order_id}`,
                            performed_by: null,
                            performed_by_name: 'System (Webhook)',
                        });

                    console.log(`Webhook: Inventory decremented by ${totalQuantityToDeduct} → ${newQty}`);
                    decremented = true;
                    break;
                }

                if (!decremented) {
                    console.error(`Webhook: Failed to decrement inventory after ${MAX_RETRIES} attempts for order ${order_id}`);
                }
            } catch (invErr) {
                console.error("Webhook: Failed to decrement inventory:", invErr);
            }

            // 4. Send Emails via Resend
            if (process.env.RESEND_API_KEY) {
                try {
                    // Admin notification — use proper template
                    const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL;
                    if (adminEmail) {
                        const { subject, html } = orderConfirmationAdminEmail({
                            referenceId: order_id,
                            fiatAmount: order.fiat_amount || 0,
                            cryptoCurrency: order.crypto_currency || 'BTC',
                            cryptoAmount: parseFloat(value_forwarded_coin || '0') || order.crypto_amount || 0,
                            items: order.items || [],
                            shippingAddress: order.shipping_address || {},
                            email: order.email || undefined,
                        });

                        await resend.emails.send({
                            from: EMAIL_FROM,
                            replyTo: EMAIL_REPLY_TO,
                            to: adminEmail,
                            subject,
                            html,
                        });
                    }

                    // Customer confirmation — use proper template
                    if (order.email && order.email.includes('@')) {
                        const { subject, html } = orderConfirmationCustomerEmail({
                            referenceId: order_id,
                            fiatAmount: order.fiat_amount || 0,
                        });

                        await resend.emails.send({
                            from: EMAIL_FROM,
                            replyTo: EMAIL_REPLY_TO,
                            to: order.email,
                            subject,
                            html,
                        });
                    }
                } catch (emailErr) {
                    console.error("Webhook: Failed to send emails:", emailErr);
                }
            } else {
                console.log("Webhook: RESEND_API_KEY missing. Skipped emails.");
            }
        }

        return new NextResponse('*ok*', { status: 200 });

    } catch (error) {
        console.error("CryptAPI Webhook error:", error);
        return new NextResponse('*ok*', { status: 200 });
    }
}
