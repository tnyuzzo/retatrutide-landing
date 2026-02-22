import { NextResponse, NextRequest } from 'next/server';
import { verifyAuth, requireRole, AuthError } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase-admin';

async function getAllSettings(): Promise<Record<string, unknown>> {
    const { data, error } = await supabaseAdmin
        .from('store_settings')
        .select('key, value');

    if (error) throw new Error(`Failed to fetch settings: ${error.message}`);

    const settings: Record<string, unknown> = {};
    for (const row of data || []) {
        try {
            settings[row.key] = typeof row.value === 'string' ? JSON.parse(row.value) : row.value;
        } catch {
            settings[row.key] = row.value;
        }
    }
    return settings;
}

export async function GET(req: NextRequest) {
    try {
        const { role } = await verifyAuth(req);
        requireRole(role, ['super_admin', 'manager']);

        const settings = await getAllSettings();
        return NextResponse.json({ settings });
    } catch (err) {
        if (err instanceof AuthError) {
            return NextResponse.json({ error: err.message }, { status: err.statusCode });
        }
        console.error('Settings API GET error:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const { user, role } = await verifyAuth(req);
        requireRole(role, ['super_admin']);

        const body = await req.json();
        const { settings } = body || {};

        if (!settings || typeof settings !== 'object' || Array.isArray(settings) || Object.keys(settings).length === 0) {
            return NextResponse.json({ error: 'settings must be a non-empty object' }, { status: 400 });
        }

        for (const [key, value] of Object.entries(settings)) {
            const { error } = await supabaseAdmin
                .from('store_settings')
                .upsert({
                    key,
                    value: JSON.stringify(value),
                    updated_at: new Date().toISOString(),
                    updated_by: user.id,
                }, { onConflict: 'key' });

            if (error) {
                return NextResponse.json({ error: `Failed to update setting "${key}": ${error.message}` }, { status: 500 });
            }
        }

        const updated = await getAllSettings();
        return NextResponse.json({ success: true, settings: updated });
    } catch (err) {
        if (err instanceof AuthError) {
            return NextResponse.json({ error: err.message }, { status: err.statusCode });
        }
        console.error('Settings API POST error:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
