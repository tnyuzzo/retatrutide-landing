import { NextResponse, NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET(
    _req: NextRequest,
    { params }: { params: Promise<{ code: string }> }
) {
    const { code } = await params;
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || '';

    if (!code) {
        return NextResponse.redirect(siteUrl || '/');
    }

    try {
        const { data, error } = await supabaseAdmin
            .from('short_links')
            .select('target_url, clicks')
            .eq('code', code)
            .single();

        if (error || !data) {
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
        return NextResponse.redirect(siteUrl || '/');
    }
}
