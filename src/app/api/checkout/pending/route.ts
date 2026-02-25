import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email');

    if (!email || !email.includes('@')) {
        return NextResponse.json({ order: null });
    }

    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const { data: order } = await supabaseAdmin
        .from('orders')
        .select('reference_id, order_number, crypto_currency, fiat_amount, created_at')
        .eq('email', email.toLowerCase().trim())
        .eq('status', 'pending')
        .gt('created_at', cutoff)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

    return NextResponse.json({ order: order ?? null });
}
