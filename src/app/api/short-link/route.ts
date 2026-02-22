import { NextResponse, NextRequest } from 'next/server';
import { verifyAuth, requireRole, AuthError } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase-admin';

const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
const CODE_LENGTH = 7;

function generateCode(): string {
    const bytes = new Uint8Array(CODE_LENGTH);
    crypto.getRandomValues(bytes);
    let code = '';
    for (let i = 0; i < CODE_LENGTH; i++) {
        code += CHARS[bytes[i] % CHARS.length];
    }
    return code;
}

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code');

    if (!code) {
        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || '';
        return NextResponse.redirect(siteUrl || '/');
    }

    try {
        const { data, error } = await supabaseAdmin
            .from('short_links')
            .select('target_url, clicks')
            .eq('code', code)
            .single();

        if (error || !data) {
            const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || '';
            return NextResponse.redirect(siteUrl || '/');
        }

        // Increment clicks (fire and forget)
        supabaseAdmin
            .from('short_links')
            .update({ clicks: (data.clicks || 0) + 1 })
            .eq('code', code)
            .then(() => {});

        return NextResponse.redirect(data.target_url);
    } catch {
        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || '';
        return NextResponse.redirect(siteUrl || '/');
    }
}

export async function POST(req: NextRequest) {
    try {
        const { user, role } = await verifyAuth(req);
        requireRole(role, ['super_admin', 'manager', 'seller']);

        const body = await req.json();
        const { targetUrl } = body;

        if (!targetUrl) {
            return NextResponse.json({ error: 'targetUrl is required' }, { status: 400 });
        }

        // Generate unique code (retry on collision)
        for (let attempt = 0; attempt < 5; attempt++) {
            const code = generateCode();
            const { error } = await supabaseAdmin
                .from('short_links')
                .insert({ code, target_url: targetUrl, created_by: user.id });

            if (!error) {
                const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || '';
                return NextResponse.json({
                    shortUrl: `${siteUrl}/c/${code}`,
                    code,
                });
            }

            // 23505 = unique constraint violation → retry
            if (error.code === '23505') continue;
            throw error;
        }

        return NextResponse.json({ error: 'Failed to generate unique code' }, { status: 500 });
    } catch (err) {
        if (err instanceof AuthError) {
            return NextResponse.json({ error: err.message }, { status: err.statusCode });
        }
        console.error('Short link error:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
