import { NextResponse, NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

/**
 * Lightweight status-only endpoint for the CheckoutPoller.
 * Returns only the order status — no sensitive data exposed.
 * No auth required (reference_id is a UUID, hard to guess).
 */
export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const ref = searchParams.get('ref');

    if (!ref) {
        return NextResponse.json({ error: 'ref is required' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
        .from('orders')
        .select('status')
        .eq('reference_id', ref)
        .single();

    if (error || !data) {
        return NextResponse.json({ status: 'unknown' });
    }

    return NextResponse.json({ status: data.status });
}
