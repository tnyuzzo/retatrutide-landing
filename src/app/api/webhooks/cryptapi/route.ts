import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { Resend } from 'resend';
import crypto from 'crypto';
import {
    orderConfirmationAdminEmail,
    orderConfirmationCustomerEmail,
    warehouseNewOrderEmail,
    lowStockAlertEmail,
    underpaidAlertEmail,
} from '@/lib/email-templates';
import { sendSMS } from '@/lib/clicksend';

const resend = new Resend(process.env.RESEND_API_KEY || 're_dummy_key');
const EMAIL_FROM = process.env.RESEND_FROM_EMAIL || 'Aura Peptides <onboarding@resend.dev>';
const EMAIL_REPLY_TO = 'support@aurapeptides.eu';

/** Constant-time string comparison to prevent timing attacks */
function safeCompare(a: string, b: string): boolean {
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(Buffer.from(a, 'utf-8'), Buffer.from(b, 'utf-8'));
}

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

        // ── Webhook Secret Verification (fail-closed, timing-safe) ──
        const expectedSecret = process.env.WEBHOOK_SECRET;
        if (!expectedSecret) {
            console.error('CRITICAL: WEBHOOK_SECRET is not configured. Rejecting ALL webhook calls.');
            return new NextResponse('*ok*', { status: 200 });
        }
        if (!secret || !safeCompare(secret, expectedSecret)) {
            console.warn(`Webhook: Invalid secret for order ${order_id}. Rejecting.`);
            return new NextResponse('*ok*', { status: 200 });
        }

        if (pending === '0') {
            // 1. Atomic status update: only transition pending → paid/underpaid
            //    This prevents race conditions if CryptAPI fires webhook twice
            const received = value_forwarded_coin ? parseFloat(value_forwarded_coin) : null;

            // First, read order to get expected amount and details
            const { data: order, error: fetchError } = await supabaseAdmin
                .from('orders')
                .select('id, status, email, shipping_address, items, fiat_amount, crypto_currency, crypto_amount, order_number, locale')
                .eq('reference_id', order_id)
                .single();

            if (fetchError || !order) {
                console.error("Webhook: Order not found:", fetchError);
                return new NextResponse('*ok*', { status: 200 });
            }

            // Idempotency: skip if already processed
            if (['paid', 'processing', 'shipped', 'delivered', 'underpaid'].includes(order.status)) {
                console.log(`Webhook: Order ${order_id} already processed (status: ${order.status}).`);
                return new NextResponse('*ok*', { status: 200 });
            }

            // 2. Underpayment check
            // CryptAPI's value_forwarded_coin is AFTER deducting:
            //   a) CryptAPI's 1% service fee (percentage)
            //   b) Blockchain forwarding fee (fixed, ~$4-20 depending on network)
            // With min order €197, total CryptAPI deduction is 3-8%.
            // 85% threshold catches genuine underpayments while tolerating fees.
            const expectedAmount = order.crypto_amount ? parseFloat(String(order.crypto_amount)) : 0;
            const UNDERPAYMENT_THRESHOLD = 0.85;
            const isUnderpaid = received !== null && expectedAmount > 0 && received < expectedAmount * UNDERPAYMENT_THRESHOLD;

            // 3. Atomic update: only update if status is still 'pending' (prevents double-processing)
            const updatePayload: Record<string, unknown> = {
                status: isUnderpaid ? 'underpaid' : 'paid',
                updated_at: new Date().toISOString(),
            };
            if (received !== null) {
                // Always save the actual amount CryptAPI forwarded to our wallet
                updatePayload.crypto_amount_received = received;

                if (isUnderpaid) {
                    updatePayload.notes = JSON.stringify({ underpaid_received: received, underpaid_expected: expectedAmount });
                }
                // Note: we no longer overwrite crypto_amount — it stays as the originally requested amount.
                // crypto_amount_received tracks what actually arrived after CryptAPI's 1% + blockchain fee.

                // Calculate gateway fee in EUR (CryptAPI 1% service + blockchain forwarding fee)
                if (expectedAmount > 0) {
                    const feeRatio = Math.max(0, 1 - (received / expectedAmount));
                    updatePayload.gateway_fee_eur = Math.round((order.fiat_amount || 0) * feeRatio * 100) / 100;
                }
            }

            // Atomic update: accept payments on pending OR expired orders
            // (expired = 72h timeout, but late payment should still be honoured)
            const { data: updatedOrder, error: updateError } = await supabaseAdmin
                .from('orders')
                .update(updatePayload)
                .eq('reference_id', order_id)
                .in('status', ['pending', 'expired'])
                .select('id')
                .single();

            if (updateError || !updatedOrder) {
                // Another webhook call already processed this order — safe to ignore
                console.log(`Webhook: Order ${order_id} was already transitioned (race condition avoided).`);
                return new NextResponse('*ok*', { status: 200 });
            }

            if (isUnderpaid) {
                console.log(`Webhook: Order ${order_id} marked as UNDERPAID (received: ${received}, expected: ${expectedAmount})`);
                // Send admin underpayment alert only
                const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL;
                if (adminEmail && process.env.RESEND_API_KEY) {
                    const { subject, html } = underpaidAlertEmail({
                        referenceId: order_id,
                        orderNumber: order.order_number,
                        fiatAmount: order.fiat_amount || 0,
                        cryptoCurrency: order.crypto_currency || '',
                        expectedCryptoAmount: expectedAmount,
                        receivedCryptoAmount: received || 0,
                        email: order.email,
                        shippingAddress: order.shipping_address || {},
                    });
                    await resend.emails.send({ from: EMAIL_FROM, replyTo: EMAIL_REPLY_TO, to: adminEmail, subject, html })
                        .catch(e => console.error('Webhook: Failed to send underpaid alert:', e));
                }
                return new NextResponse('*ok*', { status: 200 });
            }

            console.log(`Webhook: Order ${order_id} marked as PAID!`);

            // 4. Atomic Inventory Decrement (optimistic concurrency with retry)
            let inventoryDecrementFailed = false;
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
                    inventoryDecrementFailed = true;
                    console.error(`Webhook: CRITICAL — Failed to decrement inventory after ${MAX_RETRIES} attempts for order ${order_id}`);
                }
            } catch (invErr) {
                inventoryDecrementFailed = true;
                console.error("Webhook: CRITICAL — Failed to decrement inventory:", invErr);
            }

            // 5. Customer upsert
            try {
                if (order.email) {
                    const normalizedEmail = order.email.toLowerCase().trim();
                    const customerName = order.shipping_address?.full_name || '';
                    const customerPhone = order.shipping_address?.phone || null;

                    const { data: existingCustomer } = await supabaseAdmin
                        .from('customers')
                        .select('id')
                        .eq('email', normalizedEmail)
                        .maybeSingle();

                    if (existingCustomer) {
                        const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
                        if (customerName) updates.full_name = customerName;
                        if (customerPhone) updates.phone = customerPhone;
                        await supabaseAdmin.from('customers').update(updates).eq('id', existingCustomer.id);
                    } else {
                        await supabaseAdmin.from('customers').insert({
                            email: normalizedEmail,
                            full_name: customerName,
                            phone: customerPhone,
                        });
                    }

                    // Mark lead as converted (non-critical, ignore errors)
                    try {
                        await supabaseAdmin
                            .from('leads')
                            .update({ converted: true, updated_at: new Date().toISOString() })
                            .eq('email', normalizedEmail);
                    } catch { /* lead table may not exist yet */ }
                }
            } catch (custErr) {
                console.error("Webhook: Failed to upsert customer:", custErr);
            }

            // 6. Send Emails via Resend
            const notificationPromises: Promise<unknown>[] = [];

            if (process.env.RESEND_API_KEY) {
                try {
                    const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL;

                    // Admin notification
                    if (adminEmail) {
                        const { subject, html } = orderConfirmationAdminEmail({
                            referenceId: order_id,
                            orderNumber: order.order_number,
                            fiatAmount: order.fiat_amount || 0,
                            cryptoCurrency: order.crypto_currency || 'BTC',
                            cryptoAmount: parseFloat(value_forwarded_coin || '0') || order.crypto_amount || 0,
                            items: order.items || [],
                            shippingAddress: order.shipping_address || {},
                            email: order.email || undefined,
                        });

                        notificationPromises.push(
                            resend.emails.send({ from: EMAIL_FROM, replyTo: EMAIL_REPLY_TO, to: adminEmail, subject, html })
                                .catch((err) => console.error('Webhook: Failed to send admin email:', err))
                        );
                    }

                    // Admin alert if inventory decrement failed
                    if (inventoryDecrementFailed && adminEmail) {
                        notificationPromises.push(
                            resend.emails.send({
                                from: EMAIL_FROM,
                                replyTo: EMAIL_REPLY_TO,
                                to: adminEmail,
                                subject: `🚨 INVENTARIO: Decremento fallito per ordine ${order_id.slice(-8).toUpperCase()}`,
                                html: `<p>L'ordine ${order_id} è stato marcato come PAID ma il decremento inventario è fallito dopo 3 tentativi. Verificare manualmente lo stock di RET-KIT-1.</p>`,
                            }).catch((err) => console.error('Webhook: Failed to send inventory alert:', err))
                        );
                    }

                    // Customer confirmation email
                    if (order.email && order.email.includes('@')) {
                        const { subject, html } = orderConfirmationCustomerEmail({
                            referenceId: order_id,
                            orderNumber: order.order_number,
                            fiatAmount: order.fiat_amount || 0,
                            locale: order.locale || 'en',
                        });

                        notificationPromises.push(
                            resend.emails.send({ from: EMAIL_FROM, replyTo: EMAIL_REPLY_TO, to: order.email, subject, html })
                                .catch((err) => console.error('Webhook: Failed to send customer email:', err))
                        );
                    }

                    // Low stock alert
                    const { data: currentInv } = await supabaseAdmin
                        .from('inventory').select('quantity').eq('sku', 'RET-KIT-1').single();
                    if (currentInv && currentInv.quantity < 20 && adminEmail) {
                        const { subject, html } = lowStockAlertEmail({
                            sku: 'RET-KIT-1',
                            currentQuantity: currentInv.quantity,
                            threshold: 20,
                        });
                        notificationPromises.push(
                            resend.emails.send({ from: EMAIL_FROM, replyTo: EMAIL_REPLY_TO, to: adminEmail, subject, html })
                                .catch((err) => console.error('Webhook: Failed to send low stock alert:', err))
                        );
                    }

                    // Warehouse email + SMS notifications
                    const { data: warehouseMembers } = await supabaseAdmin
                        .from('profiles')
                        .select('email, full_name, phone')
                        .eq('role', 'warehouse')
                        .eq('is_active', true);

                    const shippingAddress = order.shipping_address || {};
                    const totalKits = order.items?.reduce((s: number, i: { quantity?: number }) => s + (i.quantity || 1), 0) || 1;

                    if (warehouseMembers?.length) {
                        for (const wh of warehouseMembers) {
                            if (wh.email) {
                                const { subject, html } = warehouseNewOrderEmail({
                                    orderId: order_id.slice(-8).toUpperCase(),
                                    kitsToShip: totalKits,
                                    customerName: shippingAddress.full_name || 'N/A',
                                    customerPhone: shippingAddress.phone || 'N/A',
                                    shippingAddress,
                                });
                                notificationPromises.push(
                                    resend.emails.send({ from: EMAIL_FROM, replyTo: EMAIL_REPLY_TO, to: wh.email, subject, html })
                                        .catch((err) => console.error(`Webhook: Failed to send warehouse email to ${wh.email}:`, err))
                                );
                            }
                            if (wh.phone) {
                                const shortAddr = [shippingAddress.address_line_1, shippingAddress.city, shippingAddress.postal_code, shippingAddress.country].filter(Boolean).join(', ');
                                notificationPromises.push(
                                    sendSMS({
                                        to: wh.phone,
                                        body: `NUOVO ORDINE CRYPTO #${order_id.slice(-8).toUpperCase()}\n${totalKits} kit da spedire\nCliente: ${shippingAddress.full_name || 'N/A'}\nTel: ${shippingAddress.phone || 'N/A'}\nIndirizzo: ${shortAddr}`,
                                    }).catch((err) => console.error(`Webhook: Failed to send warehouse SMS to ${wh.phone}:`, err))
                                );
                            }
                        }
                    }
                } catch (emailErr) {
                    console.error("Webhook: Failed to send emails:", emailErr);
                }
            } else {
                console.log("Webhook: RESEND_API_KEY missing. Skipped emails.");
            }

            // 7. Customer SMS confirmation
            if (order.shipping_address?.phone) {
                notificationPromises.push(
                    sendSMS({
                        to: order.shipping_address.phone,
                        body: `Aura Peptides: il tuo pagamento è confermato! Ordine #${order_id.slice(-8).toUpperCase()}. Il kit è in preparazione.`,
                    }).catch((err) => console.error('Webhook: Failed to send customer SMS:', err))
                );
            }

            await Promise.allSettled(notificationPromises);
        }

        return new NextResponse('*ok*', { status: 200 });

    } catch (error) {
        console.error("CryptAPI Webhook error:", error);
        return new NextResponse('*ok*', { status: 200 });
    }
}
