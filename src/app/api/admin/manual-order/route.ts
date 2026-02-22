import { NextResponse, NextRequest } from 'next/server';
import { verifyAuth, requireRole, AuthError } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { generateOrderNumber } from '@/lib/order-number';
import { sendSMS } from '@/lib/clicksend';
import { Resend } from 'resend';
import { warehouseNewOrderEmail, lowStockAlertEmail } from '@/lib/email-templates';
import { v4 as uuidv4 } from 'uuid';

const resend = new Resend(process.env.RESEND_API_KEY || 're_dummy_key');
const EMAIL_FROM = process.env.RESEND_FROM_EMAIL || 'Aura Peptides <onboarding@resend.dev>';
const EMAIL_REPLY_TO = 'support@aurapeptides.eu';

const BASE_PRICE = 12; // TODO: restore to 197 after testing
const DISCOUNT_TIERS = [
    { min: 30, discount: 50 },
    { min: 20, discount: 35 },
    { min: 10, discount: 25 },
    { min: 5, discount: 15 },
    { min: 3, discount: 10 },
    { min: 1, discount: 0 },
];

function getDiscount(qty: number): number {
    for (const tier of DISCOUNT_TIERS) {
        if (qty >= tier.min) return tier.discount;
    }
    return 0;
}

export async function POST(req: NextRequest) {
    try {
        const { user, role } = await verifyAuth(req);
        requireRole(role, ['super_admin', 'manager', 'seller']);

        const body = await req.json();
        const { email, full_name, phone, shipping_address, quantity = 1, notes, fiat_amount } = body;

        if (!email || !full_name) {
            return NextResponse.json({ error: 'email and full_name are required' }, { status: 400 });
        }
        if (!shipping_address || !shipping_address.address_line_1 || !shipping_address.city || !shipping_address.country) {
            return NextResponse.json({ error: 'Shipping address is incomplete' }, { status: 400 });
        }

        // Calculate price if not provided
        const discountPercent = getDiscount(quantity);
        const unitPrice = Math.round(BASE_PRICE * (1 - discountPercent / 100));
        const calculatedAmount = fiat_amount || unitPrice * quantity;

        // 1. Customer upsert
        const normalizedEmail = email.toLowerCase().trim();
        const { data: existingCustomer } = await supabaseAdmin
            .from('customers')
            .select('id')
            .eq('email', normalizedEmail)
            .maybeSingle();

        if (existingCustomer) {
            const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
            if (full_name) updates.full_name = full_name;
            if (phone) updates.phone = phone;
            await supabaseAdmin.from('customers').update(updates).eq('id', existingCustomer.id);
        } else {
            await supabaseAdmin.from('customers').insert({
                email: normalizedEmail,
                full_name,
                phone: phone || null,
            });
        }

        // 2. Generate order number
        const orderNumber = await generateOrderNumber(supabaseAdmin);
        const referenceId = uuidv4();

        // 3. Create order
        const items = [{ sku: 'RET-KIT-1', name: 'Retatrutide 10mg', quantity, price: calculatedAmount }];
        const { data: order, error: orderError } = await supabaseAdmin
            .from('orders')
            .insert({
                reference_id: referenceId,
                order_number: orderNumber,
                status: 'paid',
                fiat_amount: calculatedAmount,
                crypto_currency: 'MANUAL',
                crypto_amount: 0,
                email: normalizedEmail,
                shipping_address,
                items,
                sent_by: user.id,
                notes: notes || null,
            })
            .select('id, order_number, reference_id, created_at')
            .single();

        if (orderError) {
            console.error('Failed to insert manual order:', orderError);
            return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
        }

        console.log(`Manual order #${orderNumber} created by ${user.id} (${role})`);

        // 4. Decrement inventory with optimistic lock
        let newQuantity: number | undefined;
        for (let attempt = 0; attempt < 3; attempt++) {
            const { data: inv } = await supabaseAdmin
                .from('inventory')
                .select('quantity')
                .eq('sku', 'RET-KIT-1')
                .single();

            if (!inv) break;

            const targetQty = Math.max(0, inv.quantity - quantity);
            const { data: updated } = await supabaseAdmin
                .from('inventory')
                .update({ quantity: targetQty, updated_at: new Date().toISOString() })
                .eq('sku', 'RET-KIT-1')
                .eq('quantity', inv.quantity)
                .select('quantity')
                .single();

            if (updated) {
                newQuantity = updated.quantity;

                // Log movement
                const { data: profile } = await supabaseAdmin
                    .from('profiles').select('full_name').eq('id', user.id).single();

                await supabaseAdmin.from('inventory_movements').insert({
                    sku: 'RET-KIT-1',
                    type: 'sale',
                    quantity,
                    previous_quantity: inv.quantity,
                    new_quantity: targetQty,
                    reason: `Manual order #${orderNumber}`,
                    performed_by: user.id,
                    performed_by_name: profile?.full_name || 'Staff',
                    order_id: order.id,
                });
                break;
            }
        }

        // 5. Notifications (await all before responding)
        const notificationPromises: Promise<unknown>[] = [];

        // Low stock alert
        if (newQuantity !== undefined && newQuantity < 20) {
            const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL;
            if (adminEmail && process.env.RESEND_API_KEY) {
                const { subject, html } = lowStockAlertEmail({
                    sku: 'RET-KIT-1',
                    currentQuantity: newQuantity,
                    threshold: 20,
                });
                notificationPromises.push(
                    resend.emails.send({ from: EMAIL_FROM, to: adminEmail, replyTo: EMAIL_REPLY_TO, subject, html })
                        .catch((err) => console.error('Failed to send low stock alert:', err))
                );
            }
        }

        // Warehouse notifications
        try {
            const { data: warehouseMembers } = await supabaseAdmin
                .from('profiles')
                .select('email, full_name, phone')
                .eq('role', 'warehouse')
                .eq('is_active', true);

            if (warehouseMembers?.length) {
                for (const wh of warehouseMembers) {
                    if (wh.email && process.env.RESEND_API_KEY) {
                        const { subject, html } = warehouseNewOrderEmail({
                            orderId: orderNumber,
                            kitsToShip: quantity,
                            customerName: full_name,
                            customerPhone: phone || 'N/A',
                            shippingAddress: shipping_address,
                        });
                        notificationPromises.push(
                            resend.emails.send({ from: EMAIL_FROM, to: wh.email, replyTo: EMAIL_REPLY_TO, subject, html })
                                .catch((err) => console.error(`Failed to send warehouse email to ${wh.email}:`, err))
                        );
                    }
                    if (wh.phone) {
                        const shortAddr = [shipping_address.address_line_1, shipping_address.city, shipping_address.postal_code, shipping_address.country].filter(Boolean).join(', ');
                        notificationPromises.push(
                            sendSMS({
                                to: wh.phone,
                                body: `NUOVO ORDINE MANUALE #${orderNumber}\n${quantity} kit da spedire\nCliente: ${full_name}\nTel: ${phone || 'N/A'}\nIndirizzo: ${shortAddr}`,
                            }).catch((err) => console.error(`Failed to send warehouse SMS to ${wh.phone}:`, err))
                        );
                    }
                }
            }
        } catch (err) {
            console.error('Error sending warehouse notifications:', err);
        }

        await Promise.allSettled(notificationPromises);

        return NextResponse.json({
            success: true,
            orderId: order.id,
            orderNumber,
            referenceId: order.reference_id,
            order: {
                id: order.id,
                order_number: orderNumber,
                reference_id: order.reference_id,
                created_at: order.created_at,
                customer_name: full_name,
                fiat_amount: calculatedAmount,
                status: 'paid',
            },
        });
    } catch (err) {
        if (err instanceof AuthError) {
            return NextResponse.json({ error: err.message }, { status: err.statusCode });
        }
        console.error('Manual order API error:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
