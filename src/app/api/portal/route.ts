import { NextResponse, NextRequest } from 'next/server';
import { supabase } from '@/lib/supabase';

// Rate limiting: 10 req/min per IP
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(ip: string): boolean {
    const now = Date.now();
    const entry = rateLimitMap.get(ip);
    if (!entry || now > entry.resetAt) {
        rateLimitMap.set(ip, { count: 1, resetAt: now + 60_000 });
        return false;
    }
    entry.count++;
    return entry.count > 10;
}

// Public endpoint — no auth required. Customer can look up their order.
export async function GET(req: NextRequest) {
    try {
        const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
            || req.headers.get('x-real-ip') || 'unknown';
        if (isRateLimited(ip)) {
            return NextResponse.json({ error: 'Too many requests. Please wait.' }, { status: 429 });
        }

        const { searchParams } = new URL(req.url);
        const email = searchParams.get('email');
        const reference = searchParams.get('reference');

        if (!email || !reference) {
            return NextResponse.json({ error: 'email and reference are required' }, { status: 400 });
        }

        // Basic email validation
        if (!email.includes('@') || email.length > 255) {
            return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
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
