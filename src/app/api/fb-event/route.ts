import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { sendFacebookEvent } from '@/lib/facebook-capi';
import { v4 as uuidv4 } from 'uuid';

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
  return entry.count > 20;
}

const VALID_EVENTS = ['ViewContent', 'InitiateCheckout', 'AddPaymentInfo'] as const;

export async function POST(req: Request) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || req.headers.get('x-real-ip')
      || 'unknown';

    if (isRateLimited(ip)) {
      return NextResponse.json({ ok: false }, { status: 429 });
    }

    const body = await req.json().catch(() => ({}));
    const { event_name, event_id, visitor_id, tracking, user_data, custom_data } = body;

    if (!event_name || !VALID_EVENTS.includes(event_name)) {
      return NextResponse.json({ ok: false, error: 'Invalid event' }, { status: 400 });
    }

    const ua = req.headers.get('user-agent') || '';
    const finalEventId = event_id || uuidv4();

    // Look up visitor from DB for resilient attribution (survives cookie/localStorage deletion)
    let visitorData: Record<string, string | null> | null = null;
    if (visitor_id) {
      const { data } = await supabaseAdmin
        .from('website_visitors')
        .select('fbc, email, phone, first_name, last_name, city, postal_code, country, ip, user_agent, campaign_id, adset_id, ad_id, utm_source')
        .eq('visitor_id', visitor_id)
        .single();
      visitorData = data;
    }

    // Merge: event user_data overrides visitor DB data (more recent/complete)
    const mergedEmail = user_data?.email || visitorData?.email || undefined;
    const mergedPhone = user_data?.phone || visitorData?.phone || undefined;
    const mergedFn = user_data?.first_name || visitorData?.first_name || undefined;
    const mergedLn = user_data?.last_name || visitorData?.last_name || undefined;
    const mergedCity = user_data?.city || visitorData?.city || undefined;
    const mergedZp = user_data?.postal_code || visitorData?.postal_code || undefined;
    const mergedCountry = user_data?.country_code || visitorData?.country || undefined;
    const mergedFbc = tracking?.fbc || visitorData?.fbc || undefined;

    await sendFacebookEvent({
      event_name: event_name as 'ViewContent' | 'InitiateCheckout' | 'AddPaymentInfo',
      event_id: finalEventId,
      user_data: {
        em: mergedEmail,
        ph: mergedPhone,
        fn: mergedFn,
        ln: mergedLn,
        ct: mergedCity,
        zp: mergedZp,
        country: mergedCountry,
        fbc: mergedFbc,
        client_ip_address: visitorData?.ip || ip,
        client_user_agent: visitorData?.user_agent || ua,
      },
      custom_data: {
        ...custom_data,
        ...(visitorData?.utm_source && { utm_source: visitorData.utm_source }),
        ...(visitorData?.campaign_id && { campaign_id: visitorData.campaign_id }),
        ...(visitorData?.adset_id && { adset_id: visitorData.adset_id }),
        ...(visitorData?.ad_id && { ad_id: visitorData.ad_id }),
      },
    });

    // Record event in visitor's events_sent for dedup tracking
    if (visitor_id) {
      try {
        await supabaseAdmin
          .from('website_visitors')
          .update({ updated_at: new Date().toISOString() })
          .eq('visitor_id', visitor_id);
      } catch {
        // Non-critical, ignore
      }
    }

    return NextResponse.json({ ok: true, event_id: finalEventId });
  } catch (err) {
    console.error('[fb-event] Error:', err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
