import { NextResponse, NextRequest } from 'next/server';
import { verifyAuth, requireRole, AuthError } from '@/lib/auth';
import { Resend } from 'resend';
import { shipmentNotificationEmail, orderConfirmationAdminEmail } from '@/lib/email-templates';

const resend = new Resend(process.env.RESEND_API_KEY || 're_dummy_key');

const STATUS_TRANSITIONS: Record<string, string[]> = {
    pending: ['paid', 'cancelled'],
    paid: ['processing', 'cancelled'],
    processing: ['shipped', 'cancelled'],
    shipped: ['delivered'],
    delivered: [],
    cancelled: [],
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

// GET: list orders or single order detail
async function handleGet(req: NextRequest) {
    const { role, supabase } = await verifyAuth(req);
    requireRole(role, ['super_admin', 'manager', 'warehouse']);

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const status = searchParams.get('status');
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')));

    // Single order detail
    if (id) {
        const { data: order, error } = await supabase
            .from('orders')
            .select('*')
            .eq('id', id)
            .single();

        if (error || !order) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        }

        return NextResponse.json({ order });
    }

    // List orders
    let query = supabase
        .from('orders')
        .select('*', { count: 'exact' });

    if (status) {
        query = query.eq('status', status);
    }

    const rangeFrom = (page - 1) * limit;
    const rangeTo = rangeFrom + limit - 1;

    const { data: orders, count, error } = await query
        .order('created_at', { ascending: false })
        .range(rangeFrom, rangeTo);

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
        orders: orders || [],
        total: count || 0,
        page,
        limit,
    });
}

// POST: update order status
async function handlePost(req: NextRequest) {
    const { role, supabase } = await verifyAuth(req);
    requireRole(role, ['super_admin', 'manager', 'warehouse']);

    const body = await req.json();
    const { action, order_id, new_status, tracking_number, carrier } = body;

    if (action !== 'update-status') {
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
    }

    // Fetch order
    const { data: order, error: fetchError } = await supabase
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
    }

    const { data: updated, error: updateError } = await supabase
        .from('orders')
        .update(updatePayload)
        .eq('id', order_id)
        .select()
        .single();

    if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // Send shipment email to customer if shipped
    if (new_status === 'shipped' && order.email && process.env.RESEND_API_KEY) {
        try {
            const trackingUrl = buildTrackingUrl(carrier, tracking_number);
            const { subject, html } = shipmentNotificationEmail({
                referenceId: order.reference_id,
                carrier,
                trackingNumber: tracking_number,
                trackingUrl,
            });

            await resend.emails.send({
                from: 'Aura Peptides <onboarding@resend.dev>',
                to: order.email,
                subject,
                html,
            });
        } catch (emailErr) {
            console.error('Failed to send shipment email:', emailErr);
        }
    }

    return NextResponse.json({ success: true, order: updated });
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
