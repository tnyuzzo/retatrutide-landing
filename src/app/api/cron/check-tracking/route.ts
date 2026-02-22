import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getTrackInfo } from '@/lib/tracking';

export async function GET(req: Request) {
    // Verify cron secret (fail-closed)
    const authHeader = req.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
        console.error('CRITICAL: CRON_SECRET is not configured. Rejecting ALL cron calls.');
        return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 });
    }
    if (authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        // Fetch all shipped orders with tracking numbers
        const { data: shippedOrders, error: fetchError } = await supabaseAdmin
            .from('orders')
            .select('id, reference_id, order_number, tracking_number, carrier, status')
            .eq('status', 'shipped')
            .not('tracking_number', 'is', null);

        if (fetchError) {
            console.error('Check-tracking cron: Failed to fetch shipped orders:', fetchError);
            return NextResponse.json({ error: fetchError.message }, { status: 500 });
        }

        if (!shippedOrders || shippedOrders.length === 0) {
            console.log('Check-tracking cron: No shipped orders to check.');
            return NextResponse.json({ checked: 0, delivered: 0 });
        }

        let deliveredCount = 0;
        let checkedCount = 0;
        const errors: string[] = [];

        for (const order of shippedOrders) {
            try {
                const trackInfo = await getTrackInfo(order.tracking_number, order.carrier || undefined);
                checkedCount++;

                if (!trackInfo) continue;

                // Update tracking info on order
                const updatePayload: Record<string, unknown> = {
                    tracking_status: trackInfo.status,
                    tracking_events: trackInfo.events,
                    updated_at: new Date().toISOString(),
                };

                // If delivered, update order status
                if (trackInfo.status === 'delivered') {
                    updatePayload.status = 'delivered';
                    deliveredCount++;
                    console.log(`Check-tracking cron: Order ${order.order_number || order.reference_id} delivered`);
                }

                await supabaseAdmin
                    .from('orders')
                    .update(updatePayload)
                    .eq('id', order.id);
            } catch (err) {
                const msg = `Failed to check tracking for order ${order.order_number || order.reference_id}: ${err}`;
                console.error(msg);
                errors.push(msg);
            }
        }

        console.log(`Check-tracking cron: Checked ${checkedCount}/${shippedOrders.length}, ${deliveredCount} delivered`);

        return NextResponse.json({
            checked: checkedCount,
            total: shippedOrders.length,
            delivered: deliveredCount,
            errors: errors.length > 0 ? errors : undefined,
        });
    } catch (error) {
        console.error('Check-tracking cron error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
