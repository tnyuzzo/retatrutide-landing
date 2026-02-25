import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

// Rate limiting: 20 req/min per IP (generous for progressive capture)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(ip: string): boolean {
    const now = Date.now();
    const entry = rateLimitMap.get(ip);
    if (!entry || now > entry.resetAt) {
        rateLimitMap.set(ip, { count: 1, resetAt: now + 60_000 });
        return false;
    }
    entry.count++;
    return entry.count > 20;
}

export async function POST(req: Request) {
    try {
        const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
            || req.headers.get('x-real-ip') || 'unknown';
        if (isRateLimited(ip)) {
            return NextResponse.json({ ok: false }, { status: 429 });
        }

        const body = await req.json();
        const email = typeof body.email === 'string' ? body.email.toLowerCase().trim() : '';

        if (!email || !email.includes('@') || email.length > 255) {
            return NextResponse.json({ ok: false }, { status: 400 });
        }

        // Build upsert payload — only include non-empty fields
        const payload: Record<string, unknown> = {
            email,
            updated_at: new Date().toISOString(),
        };

        if (body.firstName && typeof body.firstName === 'string') {
            payload.first_name = body.firstName.trim().slice(0, 100);
        }
        if (body.lastName && typeof body.lastName === 'string') {
            payload.last_name = body.lastName.trim().slice(0, 100);
        }
        if (body.phone && typeof body.phone === 'string') {
            payload.phone = body.phone.trim().slice(0, 30);
        }
        if (body.country && typeof body.country === 'string') {
            payload.country = body.country.trim().slice(0, 5);
        }
        if (body.city && typeof body.city === 'string') {
            payload.city = body.city.trim().slice(0, 100);
        }
        if (body.locale && typeof body.locale === 'string') {
            payload.locale = body.locale.trim().slice(0, 5);
        }

        const supabase = getSupabaseAdmin();
        await supabase
            .from('leads')
            .upsert(payload, { onConflict: 'email' });

        return NextResponse.json({ ok: true });
    } catch {
        return NextResponse.json({ ok: false }, { status: 500 });
    }
}
