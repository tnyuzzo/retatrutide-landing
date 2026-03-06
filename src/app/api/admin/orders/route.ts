import { NextResponse, NextRequest } from 'next/server';
import { verifyAuth, requireRole, AuthError } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { Resend } from 'resend';
import {
    shipmentNotificationEmail,
    orderConfirmationCustomerEmail,
    warehouseNewOrderEmail,
    lowStockAlertEmail,
} from '@/lib/email-templates';
import { sendSMS } from '@/lib/clicksend';
import { registerTracking } from '@/lib/tracking';

const resend = new Resend(process.env.RESEND_API_KEY || 're_dummy_key');
const EMAIL_FROM = process.env.RESEND_FROM_EMAIL || 'Aura Peptides <onboarding@resend.dev>';
const EMAIL_REPLY_TO = 'info@aurapep.eu';

const STATUS_TRANSITIONS: Record<string, string[]> = {
    pending: ['paid', 'cancelled'],
    paid: ['processing', 'cancelled'],
    underpaid: ['paid', 'cancelled'],
    processing: ['shipped', 'cancelled'],
    shipped: ['delivered'],
    delivered: [],
    cancelled: [],
    expired: ['paid', 'cancelled'],
    refunded: [],
    partially_refunded: [],
};

const CARRIER_TRACKING_URLS: Record<string, (num: string) => string> = {
    BRT: (num) => `https://vas.brt.it/vas/sped_det_show.hsm?referer=sped_numspe_search.htm&Ession_id=&ShipYear=2025&Spession_Num=${num}`,
    GLS: (num) => `https://www.gls-italy.com/?option=com_gls&view=track_e_trace&mode=search&numero_spedizione=${num}`,
    SDA: (num) => `https://www.sda.it/wps/portal/Servizi_online/dettaglio-spedizione?locale=it&tression_id=${num}`,
    DHL: (num) => `https://www.dhl.com/it-it/home/tracking/tracking-parcel.html?submit=1&tracking-id=${num}`,
    UPS: (num) => `https://www.ups.com/track?tracknum=${num}`,
    POSTE: (num) => `https://www.poste.it/cerca/index.html#/risultati-ricerca-702006/${num}`,
    FEDEX: (num) => `https://www.fedex.com/fedextrack/?trknbr=${num}`,
};

function buildTrackingUrl(carrier: string, trackingNumber: string): string | null {
    const builder = CARRIER_TRACKING_URLS[carrier.toUpperCase()];
    return builder ? builder(trackingNumber) : null;
}

// Fields to strip per role
const SELLER_HIDDEN_FIELDS = ['email', 'fiat_amount', 'crypto_amount', 'crypto_currency', 'payment_url'];
const WAREHOUSE_HIDDEN_FIELDS = ['fiat_amount', 'crypto_amount', 'crypto_currency', 'payment_url'];

function filterOrderFields(order: Record<string, unknown>, role: string): Record<string, unknown> {
    const hiddenFields = role === 'seller' ? SELLER_HIDDEN_FIELDS
        : role === 'warehouse' ? WAREHOUSE_HIDDEN_FIELDS
        : [];

    if (hiddenFields.length === 0) return order;

    const filtered = { ...order };
    for (const field of hiddenFields) {
        delete filtered[field];
    }
    return filtered;
}

// GET: list orders or single order detail
async function handleGet(req: NextRequest) {
    const { user, role } = await verifyAuth(req);
    requireRole(role, ['super_admin', 'manager', 'seller', 'warehouse']);

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const status = searchParams.get('status');
    const search = searchParams.get('search')?.trim();
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')));

    // Single order detail
    if (id) {
        const { data: order, error } = await supabaseAdmin
            .from('orders')
            .select('*')
            .eq('id', id)
            .single();

        if (error || !order) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        }

        // Seller can only see own orders
        if (role === 'seller' && order.sent_by !== user.id) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        }

        return NextResponse.json({ order: filterOrderFields(order, role) });
    }

    // Build query
    let query = supabaseAdmin
        .from('orders')
        .select('*', { count: 'exact' });

    // Role-based filtering
    if (role === 'seller') {
        // Seller: only own orders, last 14 days
        query = query.eq('sent_by', user.id);
        const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();
        query = query.gte('created_at', fourteenDaysAgo);
    } else if (role === 'warehouse') {
        // Warehouse: pending/paid/processing always visible, shipped/delivered only 7 days
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
        query = query.or(
            `status.in.(pending,paid,processing),and(status.in.(shipped,delivered),created_at.gte.${sevenDaysAgo})`
        );
    }

    if (status) {
        query = query.eq('status', status);
    }

    // Search: email, reference_id, order_number
    if (search) {
        query = query.or(
            `email.ilike.%${search}%,reference_id.ilike.%${search}%,order_number.ilike.%${search}%`
        );
    }

    // Date range filters
    const dateFrom = searchParams.get('date_from');
    const dateTo = searchParams.get('date_to');
    if (dateFrom) {
        query = query.gte('created_at', new Date(dateFrom).toISOString());
    }
    if (dateTo) {
        const endDate = new Date(dateTo);
        endDate.setDate(endDate.getDate() + 1);
        query = query.lt('created_at', endDate.toISOString());
    }

    const rangeFrom = (page - 1) * limit;
    const rangeTo = rangeFrom + limit - 1;

    const { data: orders, count, error } = await query
        .order('created_at', { ascending: false })
        .range(rangeFrom, rangeTo);

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const filteredOrders = (orders || []).map(o => filterOrderFields(o, role));

    return NextResponse.json({
        orders: filteredOrders,
        total: count || 0,
        page,
        limit,
    });
}

// POST: update order status
async function handlePost(req: NextRequest) {
    const { user, role } = await verifyAuth(req);
    requireRole(role, ['super_admin', 'manager', 'warehouse']);

    const body = await req.json();
    const { action, order_id, new_status, tracking_number, carrier, shipping_cost } = body;

    if (action !== 'update-status') {
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
    }

    // Fetch order
    const { data: order, error: fetchError } = await supabaseAdmin
        .from('orders')
        .select('*')
        .eq('id', order_id)
        .single();

    if (fetchError || !order) {
        return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Validate transition
    const allowed = STATUS_TRANSITIONS[order.status] || [];
    if (!allowed.includes(new_status)) {
        return NextResponse.json({
            error: `Cannot transition from '${order.status}' to '${new_status}'. Allowed: ${allowed.join(', ')}`
        }, { status: 400 });
    }

    // Build update payload
    const updatePayload: Record<string, unknown> = {
        status: new_status,
        updated_at: new Date().toISOString(),
    };

    if (new_status === 'shipped') {
        if (!tracking_number || !carrier) {
            return NextResponse.json({ error: 'tracking_number and carrier are required for shipping' }, { status: 400 });
        }
        updatePayload.tracking_number = tracking_number;
        updatePayload.carrier = carrier;
        updatePayload.shipped_at = new Date().toISOString();

        if (shipping_cost !== undefined && shipping_cost !== null) {
            const cost = Number(shipping_cost);
            if (isNaN(cost) || cost < 0 || cost > 10000) {
                return NextResponse.json({ error: 'Shipping cost must be between 0 and 10000' }, { status: 400 });
            }
            updatePayload.shipping_cost = Math.round(cost);
        }
    }

    const { data: updated, error: updateError } = await supabaseAdmin
        .from('orders')
        .update(updatePayload)
        .eq('id', order_id)
        .select()
        .single();

    if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // Restore inventory on cancellation of paid/processing orders
    if (new_status === 'cancelled' && ['paid', 'processing'].includes(order.status)) {
        try {
            let totalToRestore = 1;
            if (order.items && Array.isArray(order.items)) {
                totalToRestore = order.items.reduce(
                    (sum: number, item: { quantity?: number }) => sum + (item.quantity || 1), 0
                );
            }

            for (let attempt = 0; attempt < 3; attempt++) {
                const { data: inv } = await supabaseAdmin
                    .from('inventory')
                    .select('quantity')
                    .eq('sku', 'RET-KIT-1')
                    .single();

                if (!inv) break;

                const newQty = inv.quantity + totalToRestore;
                const { data: invUpdated } = await supabaseAdmin
                    .from('inventory')
                    .update({ quantity: newQty, updated_at: new Date().toISOString() })
                    .eq('sku', 'RET-KIT-1')
                    .eq('quantity', inv.quantity)
                    .select('quantity')
                    .single();

                if (invUpdated) {
                    const { data: profile } = await supabaseAdmin
                        .from('profiles').select('full_name').eq('id', user.id).single();

                    await supabaseAdmin.from('inventory_movements').insert({
                        sku: 'RET-KIT-1',
                        type: 'add',
                        quantity: totalToRestore,
                        previous_quantity: inv.quantity,
                        new_quantity: newQty,
                        reason: `Restored: order ${order.order_number || order.reference_id} cancelled`,
                        performed_by: user.id,
                        performed_by_name: profile?.full_name || 'Staff',
                        order_id: order.id,
                    });
                    break;
                }
            }
        } catch (restoreErr) {
            console.error('Failed to restore inventory on cancellation:', restoreErr);
        }
    }

    // Any status → Paid: run fulfillment side effects (inventory + notifications)
    if (new_status === 'paid' && ['pending', 'underpaid', 'expired'].includes(order.status)) {
        // Decrement inventory
        try {
            let totalQty = 1;
            if (order.items && Array.isArray(order.items)) {
                totalQty = order.items.reduce((s: number, i: { quantity?: number }) => s + (i.quantity || 1), 0);
            }
            for (let attempt = 0; attempt < 3; attempt++) {
                const { data: inv } = await supabaseAdmin.from('inventory').select('quantity').eq('sku', 'RET-KIT-1').single();
                if (!inv) break;
                const newQty = Math.max(0, inv.quantity - totalQty);
                const { data: invUpdated } = await supabaseAdmin
                    .from('inventory').update({ quantity: newQty, updated_at: new Date().toISOString() })
                    .eq('sku', 'RET-KIT-1').eq('quantity', inv.quantity).select().single();
                if (invUpdated) {
                    await supabaseAdmin.from('inventory_movements').insert({
                        sku: 'RET-KIT-1', type: 'remove', quantity: -totalQty,
                        previous_quantity: inv.quantity, new_quantity: newQty,
                        reason: `Approvazione manuale (${order.status} → paid): ${order.order_number || order.reference_id}`,
                        performed_by: user.id,
                        performed_by_name: (await supabaseAdmin.from('profiles').select('full_name').eq('id', user.id).single()).data?.full_name || 'Staff',
                    });
                    break;
                }
            }
        } catch (e) { console.error('Failed to decrement inventory on underpaid approval:', e); }

        // Fulfillment notifications
        if (process.env.RESEND_API_KEY) {
            const notifyPromises: Promise<unknown>[] = [];

            // Customer confirmation
            if (order.email?.includes('@')) {
                const { subject, html } = orderConfirmationCustomerEmail({ referenceId: order.reference_id, orderNumber: order.order_number, fiatAmount: order.fiat_amount || 0, locale: order.locale || 'en' });
                notifyPromises.push(
                    resend.emails.send({ from: EMAIL_FROM, replyTo: EMAIL_REPLY_TO, to: order.email, subject, html })
                        .catch(e => console.error('Failed to send underpaid approval customer email:', e))
                );
            }

            // Low stock alert
            const { data: currentInv } = await supabaseAdmin.from('inventory').select('quantity').eq('sku', 'RET-KIT-1').single();
            const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL;
            if (currentInv && currentInv.quantity < 20 && adminEmail) {
                const { subject, html } = lowStockAlertEmail({ sku: 'RET-KIT-1', currentQuantity: currentInv.quantity, threshold: 20 });
                notifyPromises.push(
                    resend.emails.send({ from: EMAIL_FROM, replyTo: EMAIL_REPLY_TO, to: adminEmail, subject, html })
                        .catch(e => console.error('Failed to send low stock alert:', e))
                );
            }

            // Warehouse notifications
            const { data: warehouseMembers } = await supabaseAdmin.from('profiles').select('email, full_name, phone').eq('role', 'warehouse').eq('is_active', true);
            const shippingAddress = order.shipping_address || {};
            const totalKits = order.items?.reduce((s: number, i: { quantity?: number }) => s + (i.quantity || 1), 0) || 1;
            if (warehouseMembers?.length) {
                for (const wh of warehouseMembers) {
                    if (wh.email) {
                        const { subject, html } = warehouseNewOrderEmail({
                            orderId: order.reference_id.slice(-8).toUpperCase(),
                            kitsToShip: totalKits,
                            customerName: shippingAddress.full_name || 'N/A',
                            customerPhone: shippingAddress.phone || 'N/A',
                            shippingAddress,
                        });
                        notifyPromises.push(
                            resend.emails.send({ from: EMAIL_FROM, replyTo: EMAIL_REPLY_TO, to: wh.email, subject, html })
                                .catch(e => console.error('Failed to send warehouse email:', e))
                        );
                    }
                    if (wh.phone) {
                        const shortAddr = [shippingAddress.address_line_1, shippingAddress.city, shippingAddress.postal_code, shippingAddress.country].filter(Boolean).join(', ');
                        notifyPromises.push(
                            sendSMS({ to: wh.phone, body: `NUOVO ORDINE CONFERMATO #${order.reference_id.slice(-8).toUpperCase()}\n${totalKits} kit · ${shippingAddress.full_name || 'N/A'}\n${shortAddr}` })
                                .catch(e => console.error('Failed to send warehouse SMS:', e))
                        );
                    }
                }
            }

            // Customer SMS
            if (order.shipping_address?.phone) {
                notifyPromises.push(
                    sendSMS({ to: order.shipping_address.phone, body: `Aura Peptides: il tuo pagamento è confermato! Ordine #${order.reference_id.slice(-8).toUpperCase()}. Il kit è in preparazione.` })
                        .catch(e => console.error('Failed to send customer SMS:', e))
                );
            }

            await Promise.allSettled(notifyPromises);
        }
    }

    // Notifications on ship
    if (new_status === 'shipped') {
        const notifyPromises: Promise<unknown>[] = [];
        const trackingUrl = buildTrackingUrl(carrier, tracking_number);

        // Register tracking on 17track
        registerTracking(tracking_number, carrier).catch(err =>
            console.error('Failed to register tracking:', err)
        );

        // Email to customer
        if (order.email && process.env.RESEND_API_KEY) {
            const { subject, html } = shipmentNotificationEmail({
                referenceId: order.reference_id,
                orderNumber: order.order_number,
                carrier,
                trackingNumber: tracking_number,
                trackingUrl,
                locale: order.locale || 'en',
            });

            notifyPromises.push(
                resend.emails.send({ from: EMAIL_FROM, replyTo: EMAIL_REPLY_TO, to: order.email, subject, html })
                    .catch((err) => console.error('Failed to send shipment email:', err))
            );
        }

        // SMS to customer
        const customerPhone = order.shipping_address?.phone;
        if (customerPhone) {
            const customerName = order.shipping_address?.full_name || '';
            const trackingInfo = trackingUrl
                ? `Tracking: ${trackingUrl}`
                : (tracking_number ? `Tracking: ${tracking_number}` : '');
            notifyPromises.push(
                sendSMS({
                    to: customerPhone,
                    body: `Ciao ${customerName}! Il tuo ordine Aura Peptides è stato spedito con ${carrier}. ${trackingInfo}`.trim(),
                }).catch(err => console.error('Failed to send shipping SMS:', err))
            );
        }

        await Promise.allSettled(notifyPromises);
    }

    return NextResponse.json({ success: true, order: filterOrderFields(updated, role) });
}

export async function GET(req: NextRequest) {
    try {
        return await handleGet(req);
    } catch (err) {
        if (err instanceof AuthError) {
            return NextResponse.json({ error: err.message }, { status: err.statusCode });
        }
        console.error('Orders API GET error:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        return await handlePost(req);
    } catch (err) {
        if (err instanceof AuthError) {
            return NextResponse.json({ error: err.message }, { status: err.statusCode });
        }
        console.error('Orders API POST error:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
