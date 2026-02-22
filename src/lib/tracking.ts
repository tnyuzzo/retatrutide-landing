import { supabaseAdmin } from './supabase-admin';

const API_BASE = 'https://api.17track.net/track/v2.4';
const API_KEY = process.env.TRACKING_API_KEY_17TRACK;

const CARRIER_MAP: Record<string, number> = {
    BRT: 100026,
    GLS: 100024,
    SDA: 100019,
    DHL: 100001,
    UPS: 100002,
    POSTE: 9071,
    FEDEX: 100003,
};

interface TrackEvent {
    date: string | null;
    description: string;
    location: string;
}

export interface TrackInfo {
    status: string;
    statusRaw: string | null;
    subStatus: string | null;
    lastEvent: TrackEvent | null;
    events: TrackEvent[];
}

async function apiRequest(endpoint: string, body: unknown): Promise<Record<string, unknown> | null> {
    if (!API_KEY) {
        console.warn('TRACKING_API_KEY_17TRACK not configured, skipping 17track call');
        return null;
    }

    const res = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers: {
            '17token': API_KEY,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
    });

    if (!res.ok) {
        const text = await res.text();
        throw new Error(`17track API error ${res.status}: ${text}`);
    }

    return res.json();
}

export async function registerTracking(
    trackingNumber: string,
    carrier?: string
): Promise<{ success: boolean; reason?: string }> {
    const carrierCode = carrier ? CARRIER_MAP[carrier.toUpperCase()] : undefined;

    const body: Record<string, unknown>[] = [{ number: trackingNumber }];
    if (carrierCode) body[0].carrier = carrierCode;

    const result = await apiRequest('/register', body);
    if (!result) return { success: false, reason: 'no_api_key' };

    const data = result.data as Record<string, unknown[]> | undefined;
    const accepted = (data?.accepted || []) as Record<string, unknown>[];
    const rejected = (data?.rejected || []) as Record<string, unknown>[];

    const alreadyRegistered = rejected.some(
        (r) => (r.error as Record<string, unknown>)?.code === 4016
    );

    if (accepted.length > 0 || alreadyRegistered) {
        return { success: true };
    }

    const errMsg = (rejected[0]?.error as Record<string, string>)?.message || 'Unknown error';
    console.error('17track register rejected:', errMsg);
    return { success: false, reason: errMsg };
}

export async function getTrackInfo(
    trackingNumber: string,
    carrier?: string
): Promise<TrackInfo | null> {
    const body: Record<string, unknown>[] = [{ number: trackingNumber }];
    const carrierCode = carrier ? CARRIER_MAP[carrier.toUpperCase()] : undefined;
    if (carrierCode) body[0].carrier = carrierCode;

    const result = await apiRequest('/gettrackinfo', body);
    if (!result) return null;

    const data = result.data as Record<string, unknown[]> | undefined;
    const accepted = (data?.accepted || []) as Record<string, unknown>[];
    const item = accepted[0];
    if (!item) return null;

    return normalizeTrackInfo(item);
}

function normalizeTrackInfo(item: Record<string, unknown>): TrackInfo {
    const trackInfo = (item.track_info || item.track || {}) as Record<string, unknown>;
    const latestStatus = (trackInfo.latest_status || {}) as Record<string, string>;
    const latestEvent = (trackInfo.latest_event || {}) as Record<string, string>;

    const status = mapStatus(latestStatus.status);

    const events: TrackEvent[] = [];
    const tracking = (trackInfo.tracking || {}) as Record<string, unknown>;
    const providers = (tracking.providers || []) as Record<string, unknown>[];

    for (const provider of providers) {
        for (const evt of ((provider.events || []) as Record<string, string>[])) {
            events.push({
                date: evt.time_utc || evt.time || null,
                description: evt.description || '',
                location: evt.location || '',
            });
        }
    }

    if (events.length === 0 && latestEvent.description) {
        events.push({
            date: latestEvent.time_utc || latestEvent.time || null,
            description: latestEvent.description || '',
            location: latestEvent.location || '',
        });
    }

    events.sort((a, b) => (b.date || '').localeCompare(a.date || ''));

    return {
        status,
        statusRaw: latestStatus.status || null,
        subStatus: latestStatus.sub_status || null,
        lastEvent: events[0] || null,
        events,
    };
}

function mapStatus(s: string | undefined): string {
    if (!s) return 'not_found';
    const normalized = s.toLowerCase().replace(/\s+/g, '_');
    const map: Record<string, string> = {
        notfound: 'not_found',
        not_found: 'not_found',
        inforeceived: 'info_received',
        info_received: 'info_received',
        intransit: 'in_transit',
        in_transit: 'in_transit',
        expired: 'expired',
        availableforpickup: 'available_for_pickup',
        available_for_pickup: 'available_for_pickup',
        outfordelivery: 'out_for_delivery',
        out_for_delivery: 'out_for_delivery',
        deliveryfailure: 'delivery_failure',
        delivery_failure: 'delivery_failure',
        delivered: 'delivered',
        exception: 'exception',
    };
    return map[normalized] || normalized;
}

export async function saveTrackingToOrder(
    trackingNumber: string,
    trackInfo: TrackInfo
): Promise<void> {
    if (!trackInfo) return;

    const { error } = await supabaseAdmin
        .from('orders')
        .update({
            tracking_status: trackInfo.status,
            tracking_events: trackInfo.events,
            updated_at: new Date().toISOString(),
        })
        .eq('tracking_number', trackingNumber);

    if (error) {
        console.error('Failed to save tracking info:', error.message);
    }
}
