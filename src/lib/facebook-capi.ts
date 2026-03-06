import crypto from 'crypto';

const FB_PIXEL_ID = process.env.FB_PIXEL_ID;
const FB_ACCESS_TOKEN = process.env.FB_ACCESS_TOKEN;
const FB_API_VERSION = 'v21.0';

interface FacebookUserData {
  em?: string;
  ph?: string;
  fn?: string;
  ln?: string;
  ct?: string;
  zp?: string;
  country?: string;
  fbc?: string;
  client_ip_address?: string;
  client_user_agent?: string;
}

interface FacebookEventParams {
  event_name: 'ViewContent' | 'InitiateCheckout' | 'AddPaymentInfo' | 'Purchase';
  event_id: string;
  event_time?: number;
  user_data: FacebookUserData;
  custom_data?: Record<string, unknown>;
}

function sha256(value: string): string {
  return crypto.createHash('sha256').update(value.trim().toLowerCase()).digest('hex');
}

function hashUserData(data: FacebookUserData): Record<string, unknown> {
  const hashed: Record<string, unknown> = {};

  if (data.em) hashed.em = [sha256(data.em)];
  if (data.ph) hashed.ph = [sha256(data.ph.replace(/\D/g, ''))];
  if (data.fn) hashed.fn = [sha256(data.fn)];
  if (data.ln) hashed.ln = [sha256(data.ln)];
  if (data.ct) hashed.ct = [sha256(data.ct)];
  if (data.zp) hashed.zp = [sha256(data.zp)];
  if (data.country) hashed.country = [sha256(data.country.toLowerCase())];

  // These are NOT hashed per Facebook spec
  if (data.fbc) hashed.fbc = data.fbc;
  if (data.client_ip_address) hashed.client_ip_address = data.client_ip_address;
  if (data.client_user_agent) hashed.client_user_agent = data.client_user_agent;

  return hashed;
}

export async function sendFacebookEvent(params: FacebookEventParams): Promise<boolean> {
  if (!FB_PIXEL_ID || !FB_ACCESS_TOKEN) {
    console.warn('[FB CAPI] Missing FB_PIXEL_ID or FB_ACCESS_TOKEN, skipping event');
    return false;
  }

  const payload = {
    data: [{
      event_name: params.event_name,
      event_time: params.event_time || Math.floor(Date.now() / 1000),
      event_id: params.event_id,
      action_source: 'system_generated',
      // NO event_source_url (incompatible with system_generated)
      user_data: hashUserData(params.user_data),
      custom_data: params.custom_data || {},
    }],
  };

  try {
    const url = `https://graph.facebook.com/${FB_API_VERSION}/${FB_PIXEL_ID}/events?access_token=${FB_ACCESS_TOKEN}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const result = await res.json();

    if (!res.ok || result.error) {
      console.error('[FB CAPI] Error:', JSON.stringify(result));
      return false;
    }

    console.log(`[FB CAPI] ${params.event_name} sent (event_id: ${params.event_id}, events_received: ${result.events_received})`);
    return true;
  } catch (err) {
    console.error('[FB CAPI] Fetch error:', err);
    return false;
  }
}
