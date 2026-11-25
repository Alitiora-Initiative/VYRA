import { NextRequest, NextResponse } from 'next/server';
import { getMarketSnapshot } from '@/lib/market-data';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import type { AssetClass } from '@/lib/market-data/types';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const ALLOWED = new Set<AssetClass>(['crypto', 'equity', 'forex', 'commodity']);

export async function GET(request: NextRequest) {
  const requested = request.nextUrl.searchParams.get('assetClass');
  if (requested && !ALLOWED.has(requested as AssetClass)) {
    return NextResponse.json({ ok: false, error: 'Unsupported assetClass.' }, { status: 400 });
  }

  const snapshot = await getMarketSnapshot();
  const quotes = requested
    ? snapshot.quotes.filter((quote) => quote.assetClass === requested)
    : snapshot.quotes;

  // Persist quotes only when VYRA's own database has been configured and migrated.
  // Failure to persist never turns a provider failure into a fabricated quote.
  let persistence: 'saved' | 'not_configured' | 'not_migrated' = 'not_configured';
  const admin = getSupabaseAdmin();
  if (admin && quotes.length) {
    const { data: instruments, error: catalogError } = await admin
      .from('instrument_catalog')
      .select('id,symbol')
      .in('symbol', quotes.map((quote) => quote.symbol));
    if (catalogError) {
      persistence = 'not_migrated';
    } else {
      const ids = new Map((instruments ?? []).map((row) => [row.symbol, row.id]));
      const rows = quotes.flatMap((quote) => {
        const instrumentId = ids.get(quote.symbol);
        return instrumentId ? [{
          instrument_id: instrumentId,
          last_price: quote.price,
          source: quote.source,
          observed_at: quote.asOf,
        }] : [];
      });
      if (rows.length) {
        const { error } = await admin.from('market_quotes').upsert(rows, { onConflict: 'instrument_id' });
        persistence = error ? 'not_migrated' : 'saved';
      }
    }
  }

  const status = quotes.length ? 200 : 503;
  return NextResponse.json({
    ok: quotes.length > 0,
    dataStatus: quotes.length ? 'live_provider_quotes' : 'unavailable',
    quotes,
    unavailable: snapshot.unavailable,
    databasePersistence: persistence,
    fetchedAt: snapshot.fetchedAt,
  }, {
    status,
    headers: { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' },
  });
}
