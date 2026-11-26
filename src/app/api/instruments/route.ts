import { NextResponse } from 'next/server';
import { getNeonServer } from '@/lib/neon/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const neon = await getNeonServer();
  if (!neon) return NextResponse.json({ ok: false, error: 'Neon Data API is not configured.' }, { status: 503 });

  const { data, error } = await neon
    .from('instrument_catalog')
    .select('id,symbol,name,asset_class,base_currency,quote_currency,is_enabled')
    .eq('is_enabled', true)
    .order('asset_class')
    .order('symbol');

  if (error) return NextResponse.json({ ok: false, error: 'VYRA instrument catalogue is unavailable.' }, { status: 503 });
  return NextResponse.json({
    ok: true,
    live: false,
    instruments: data ?? [],
    note: 'Instrument catalogue only; market prices are provided by /api/markets.',
  }, { headers: { 'Cache-Control': 'no-store' } });
}
