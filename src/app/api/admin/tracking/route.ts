import { NextResponse, NextRequest } from 'next/server';
import { verifyAuth, requireRole, AuthError } from '@/lib/auth';
import { getTrackInfo, saveTrackingToOrder } from '@/lib/tracking';

export async function GET(req: NextRequest) {
    try {
        const { role } = await verifyAuth(req);
        requireRole(role, ['super_admin', 'manager', 'warehouse']);

        const { searchParams } = new URL(req.url);
        const trackingNumber = searchParams.get('tracking_number');
        const carrier = searchParams.get('carrier') || undefined;

        if (!trackingNumber) {
            return NextResponse.json({ error: 'tracking_number is required' }, { status: 400 });
        }

        const trackInfo = await getTrackInfo(trackingNumber, carrier);

        if (!trackInfo) {
            return NextResponse.json({ error: 'Unable to fetch tracking info' }, { status: 404 });
        }

        // Save to order in background
        saveTrackingToOrder(trackingNumber, trackInfo).catch((err) =>
            console.error('Failed to save tracking to order:', err)
        );

        return NextResponse.json({ tracking: trackInfo });
    } catch (err) {
        if (err instanceof AuthError) {
            return NextResponse.json({ error: err.message }, { status: err.statusCode });
        }
        console.error('Tracking API error:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
