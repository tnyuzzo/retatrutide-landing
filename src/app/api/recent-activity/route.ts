import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

export const dynamic = 'force-dynamic';

// Cache for 5 minutes to reduce DB load
let cache: { data: ActivityItem[]; ts: number } | null = null;
const CACHE_TTL = 5 * 60 * 1000;

export interface ActivityItem {
    name: string;
    city: string;
    quantity: number;
    timeAgoKey: string; // i18n key: popup_just_now | popup_2min_ago | ...
}

function getTimeAgoKey(createdAt: string): string {
    const diffMs = Date.now() - new Date(createdAt).getTime();
    const diffMin = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours >= 1) return 'popup_1hour_ago';
    if (diffMin >= 12) return 'popup_12min_ago';
    if (diffMin >= 5) return 'popup_5min_ago';
    if (diffMin >= 2) return 'popup_2min_ago';
    return 'popup_just_now';
}

export async function GET() {
    // Return cached if fresh
    if (cache && Date.now() - cache.ts < CACHE_TTL) {
        return NextResponse.json({ activities: cache.data });
    }

    try {
        const supabase = getSupabaseAdmin();
        const { data: orders } = await supabase
            .from('orders')
            .select('shipping_address, created_at, items')
            .in('status', ['paid', 'shipped', 'delivered'])
            .order('created_at', { ascending: false })
            .limit(8);

        if (!orders || orders.length === 0) {
            return NextResponse.json({ activities: [] });
        }

        const activities: ActivityItem[] = orders
            .map((order): ActivityItem | null => {
                const shipping = order.shipping_address || {};
                const fullName: string = shipping.full_name || '';
                const parts = fullName.trim().split(' ');
                const firstName = parts[0] || '';
                const lastInitial = parts[1] ? parts[1][0] + '.' : '';
                const name = firstName ? `${firstName} ${lastInitial}`.trim() : '';
                const city: string = shipping.city || '';

                if (!name || !city) return null;

                const items = order.items || [];
                const quantity = items.reduce(
                    (sum: number, item: { quantity?: number }) => sum + (item.quantity || 1),
                    0
                );

                return {
                    name,
                    city,
                    quantity,
                    timeAgoKey: getTimeAgoKey(order.created_at),
                };
            })
            .filter((a): a is ActivityItem => a !== null);

        cache = { data: activities, ts: Date.now() };
        return NextResponse.json({ activities });
    } catch {
        // On error, return empty — do NOT show fake data
        return NextResponse.json({ activities: [] });
    }
}
