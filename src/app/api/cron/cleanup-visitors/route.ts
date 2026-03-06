import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const secret = searchParams.get('secret');

  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { error, count } = await supabaseAdmin
      .from('website_visitors')
      .delete({ count: 'exact' })
      .lt('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

    if (error) {
      console.error('[Cleanup] Error:', error);
      return NextResponse.json({ error: 'Failed to cleanup' }, { status: 500 });
    }

    console.log(`[Cleanup] Deleted ${count || 0} visitors older than 30 days`);
    return NextResponse.json({ ok: true, deleted: count || 0 });
  } catch (err) {
    console.error('[Cleanup] Error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
