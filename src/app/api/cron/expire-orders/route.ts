import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

/**
 * Cron Job: Expire stale pending orders older than 24 hours.
 * Triggered by Vercel Cron at 3 AM UTC daily.
 * Protected by CRON_SECRET to prevent unauthorized access.
 */
export async function GET(req: Request) {
    // Verify cron secret
    const authHeader = req.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

        // Find all pending orders older than 24h
        const { data: staleOrders, error: fetchError } = await supabaseAdmin
            .from('orders')
            .select('id, reference_id, created_at')
            .eq('status', 'pending')
            .lt('created_at', twentyFourHoursAgo);

        if (fetchError) {
            console.error('Cron: Failed to fetch stale orders:', fetchError);
            return NextResponse.json({ error: fetchError.message }, { status: 500 });
        }

        if (!staleOrders || staleOrders.length === 0) {
            console.log('Cron: No stale orders to expire.');
            return NextResponse.json({ expired: 0 });
        }

        const staleIds = staleOrders.map(o => o.id);

        const { error: updateError } = await supabaseAdmin
            .from('orders')
            .update({ status: 'expired', updated_at: new Date().toISOString() })
            .in('id', staleIds);

        if (updateError) {
            console.error('Cron: Failed to expire orders:', updateError);
            return NextResponse.json({ error: updateError.message }, { status: 500 });
        }

        console.log(`Cron: Expired ${staleOrders.length} stale orders:`, staleOrders.map(o => o.reference_id));

        return NextResponse.json({
            expired: staleOrders.length,
            orders: staleOrders.map(o => o.reference_id),
        });

    } catch (error) {
        console.error('Cron error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
