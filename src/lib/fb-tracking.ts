'use client';

export interface FbTrackingData {
  fbc: string | null;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
  campaign_id?: string;
  adset_id?: string;
  ad_id?: string;
  placement?: string;
  site_source_name?: string;
  funnel?: string;
}

export function getVisitorId(): string | null {
  try {
    return localStorage.getItem('_vid') || null;
  } catch {
    return null;
  }
}

// --- Idempotency: sessionStorage guard + deterministic event_id ---

function buildEventId(eventName: string, suffix?: string): string {
  const vid = getVisitorId() || 'anon';
  return suffix ? `${vid}_${eventName}_${suffix}` : `${vid}_${eventName}`;
}

function isEventSent(eventId: string): boolean {
  try {
    const sent = JSON.parse(sessionStorage.getItem('_fb_sent') || '{}');
    return !!sent[eventId];
  } catch {
    return false;
  }
}

function markEventSent(eventId: string): void {
  try {
    const sent = JSON.parse(sessionStorage.getItem('_fb_sent') || '{}');
    sent[eventId] = Date.now();
    sessionStorage.setItem('_fb_sent', JSON.stringify(sent));
  } catch { /* ignore */ }
}

// --- Core functions ---

export function getFbTrackingData(): FbTrackingData {
  const fbc = document.cookie
    .split('; ')
    .find(c => c.startsWith('_fbc='))
    ?.split('=')[1] || null;

  let utms: Record<string, string> = {};
  try {
    utms = JSON.parse(localStorage.getItem('_fb_utm') || '{}');
  } catch { /* ignore */ }

  return {
    fbc,
    utm_source: utms.utm_source,
    utm_medium: utms.utm_medium,
    utm_campaign: utms.utm_campaign,
    utm_content: utms.utm_content,
    utm_term: utms.utm_term,
    campaign_id: utms.campaign_id,
    adset_id: utms.adset_id,
    ad_id: utms.ad_id,
    placement: utms.placement,
    site_source_name: utms.site_source_name,
    funnel: utms.funnel,
  };
}

/**
 * Send a Facebook CAPI event via /api/fb-event.
 * Idempotent: skips if same event_id already sent this session.
 * @param eventName - Facebook standard event name
 * @param userData - PII data (email, phone, name, etc.)
 * @param customData - Event-specific data (value, currency, content_ids, etc.)
 * @param dedupSuffix - Optional suffix for deterministic event_id (e.g. page name).
 *                      If omitted, event fires once per session per eventName.
 */
export async function sendFbEvent(
  eventName: string,
  userData?: Record<string, string | undefined> | null,
  customData?: Record<string, unknown>,
  dedupSuffix?: string
): Promise<void> {
  try {
    const eventId = buildEventId(eventName, dedupSuffix);
    if (isEventSent(eventId)) return;
    markEventSent(eventId);

    const visitorId = getVisitorId();
    const tracking = getFbTrackingData();
    await fetch('/api/fb-event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event_name: eventName,
        event_id: eventId,
        visitor_id: visitorId,
        tracking,
        user_data: userData || {},
        custom_data: customData || {},
      }),
    });
  } catch {
    // Non-blocking, swallow errors
  }
}

/**
 * Send event via navigator.sendBeacon (for abandonment/tab close).
 * Uses explicit eventId for deduplication with the regular sendFbEvent.
 */
export function sendFbEventBeacon(
  eventName: string,
  eventId: string,
  userData?: Record<string, string | undefined> | null,
  customData?: Record<string, unknown>
): void {
  try {
    if (isEventSent(eventId)) return;
    markEventSent(eventId);

    const visitorId = getVisitorId();
    const tracking = getFbTrackingData();
    const payload = JSON.stringify({
      event_name: eventName,
      event_id: eventId,
      visitor_id: visitorId,
      tracking,
      user_data: userData || {},
      custom_data: customData || {},
    });
    navigator.sendBeacon('/api/fb-event', new Blob([payload], { type: 'application/json' }));
  } catch {
    // Non-blocking
  }
}

export function updateVisitor(data: Record<string, string | undefined>): void {
  try {
    const visitorId = getVisitorId();
    if (!visitorId) return;
    const filtered = Object.fromEntries(
      Object.entries(data).filter(([, v]) => v !== undefined && v !== '')
    );
    if (Object.keys(filtered).length === 0) return;
    fetch('/api/visitor', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ visitor_id: visitorId, ...filtered }),
    }).catch(() => {});
  } catch {
    // Non-blocking
  }
}
