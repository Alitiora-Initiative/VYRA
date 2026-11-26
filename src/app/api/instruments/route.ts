import { NextResponse } from 'next/server';
import { getNeonAdminPool } from '@/lib/neon/admin';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  const admin = getNeonAdminPool();
  if (!admin) return NextResponse.json({ ok: false, error: 'Database is not configured.' }, { status: 503 });
  try {
    const { rows } = await admin.query(
      `select id, symbol, name, asset_class, base_currency, quote_currency, is_enabled
       from public.instrument_catalog
       where is_enabled = true
       order by asset_class, symbol`,
    );
    return NextResponse.json({
      ok: true,
      live: false,
      instruments: rows,
      note: 'Instrument catalogue only; price data is served by /api/markets.',
    }, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return NextResponse.json({ ok: false, error: 'VYRA instrument catalogue is not migrated.' }, { status: 503 });
  }
}
