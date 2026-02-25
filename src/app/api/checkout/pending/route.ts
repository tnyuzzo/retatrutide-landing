import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

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

export async function GET(req: Request) {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
        || req.headers.get('x-real-ip') || 'unknown';
    if (isRateLimited(ip)) {
        return NextResponse.json({ order: null }, { status: 429 });
    }

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
