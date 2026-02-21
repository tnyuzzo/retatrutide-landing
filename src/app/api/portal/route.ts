import { NextResponse, NextRequest } from 'next/server';
import { supabase } from '@/lib/supabase';

// Public endpoint — no auth required. Customer can look up their order.
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const email = searchParams.get('email');
        const reference = searchParams.get('reference');

        if (!email || !reference) {
            return NextResponse.json({ error: 'email and reference are required' }, { status: 400 });
        }

        const { data: order, error } = await supabase
            .from('orders')
            .select('reference_id, status, created_at, fiat_amount, crypto_currency, crypto_amount, tracking_number, carrier, shipped_at, items')
            .eq('email', email.toLowerCase().trim())
            .eq('reference_id', reference.trim())
            .single();

        if (error || !order) {
            return NextResponse.json({ error: 'Order not found. Please verify your email and reference code.' }, { status: 404 });
        }

        return NextResponse.json({ order });
    } catch (err) {
        console.error('Portal API error:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
