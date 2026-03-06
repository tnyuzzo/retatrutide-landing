import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

const EU_COUNTRIES = new Set([
  'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR',
  'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL',
  'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE',
]);

// Rate limiting
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

function getClientIp(req: Request): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || req.headers.get('x-real-ip')
    || 'unknown';
}

function getFunnel(req: Request): string {
  const countryCode = (req.headers.get('x-vercel-ip-country') || '').toUpperCase();
  if (!countryCode) return 'unknown';
  const code = countryCode.toLowerCase();
  return EU_COUNTRIES.has(countryCode) ? `eu_${code}` : code;
}

// POST: Create/update visitor on first page load
export async function POST(req: Request) {
  try {
    const ip = getClientIp(req);
    if (isRateLimited(ip)) {
      return NextResponse.json({ ok: false }, { status: 429 });
    }

    const body = await req.json().catch(() => ({}));
    const { visitor_id, fbc, fbclid, utm_source, utm_medium, utm_campaign,
            utm_content, utm_term, campaign_id, adset_id, ad_id,
            placement, site_source_name } = body;

    if (!visitor_id || typeof visitor_id !== 'string') {
      return NextResponse.json({ ok: false, error: 'Missing visitor_id' }, { status: 400 });
    }

    const funnel = getFunnel(req);
    const ua = req.headers.get('user-agent') || '';

    const { error } = await supabaseAdmin
      .from('website_visitors')
      .upsert({
        visitor_id,
        fbc: fbc || null,
        fbclid: fbclid || null,
        utm_source: utm_source || null,
        utm_medium: utm_medium || null,
        utm_campaign: utm_campaign || null,
        utm_content: utm_content || null,
        utm_term: utm_term || null,
        campaign_id: campaign_id || null,
        adset_id: adset_id || null,
        ad_id: ad_id || null,
        placement: placement || null,
        site_source_name: site_source_name || null,
        funnel,
        ip,
        user_agent: ua,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'visitor_id' });

    if (error) {
      console.error('[Visitor] Upsert error:', error);
      return NextResponse.json({ ok: false }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[Visitor] Error:', err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}

// PATCH: Update visitor with progressive form data
export async function PATCH(req: Request) {
  try {
    const ip = getClientIp(req);
    if (isRateLimited(ip)) {
      return NextResponse.json({ ok: false }, { status: 429 });
    }

    const body = await req.json().catch(() => ({}));
    const { visitor_id, email, phone, first_name, last_name, city, postal_code, country } = body;

    if (!visitor_id || typeof visitor_id !== 'string') {
      return NextResponse.json({ ok: false, error: 'Missing visitor_id' }, { status: 400 });
    }

    const updates: Record<string, string> = { updated_at: new Date().toISOString() };
    if (email) updates.email = email;
    if (phone) updates.phone = phone;
    if (first_name) updates.first_name = first_name;
    if (last_name) updates.last_name = last_name;
    if (city) updates.city = city;
    if (postal_code) updates.postal_code = postal_code;
    if (country) updates.country = country;

    const { error } = await supabaseAdmin
      .from('website_visitors')
      .update(updates)
      .eq('visitor_id', visitor_id);

    if (error) {
      console.error('[Visitor] Update error:', error);
      return NextResponse.json({ ok: false }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[Visitor] Patch error:', err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
