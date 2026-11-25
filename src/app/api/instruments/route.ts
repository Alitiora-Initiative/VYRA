import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function GET() {
  const admin = getSupabaseAdmin();
  if (!admin) return NextResponse.json({ ok: false, error: 'Database is not configured.' }, { status: 503 });
  const { data, error } = await admin
    .from('instrument_catalog')
    .select('id,symbol,name,asset_class,base_currency,quote_currency,is_enabled')
    .eq('is_enabled', true)
    .order('asset_class')
    .order('symbol');
  if (error) return NextResponse.json({ ok: false, error: 'VYRA instrument catalogue is not migrated.' }, { status: 503 });
  return NextResponse.json({ ok: true, live: false, instruments: data ?? [], note: 'Instrument catalogue only; price data is served by /api/markets.' }, { headers: { 'Cache-Control': 'no-store' } });
}
