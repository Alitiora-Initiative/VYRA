import { NextResponse, type NextRequest } from 'next/server';
import { getMarketSnapshot } from '@/lib/market-data';
import { getNeonServer } from '@/lib/neon/server';
import { persistMarketQuotes } from '@/lib/neon/market-writer';
import type { AssetClass } from '@/lib/market-data/types';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const runtime = 'nodejs';

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

  let persistence: 'saved' | 'not_configured' | 'not_migrated' = 'not_configured';
  let matching: 'account_scoped' | 'requires_signed_in_paper_account' | 'not_configured' | 'not_migrated' = 'not_configured';
  const neon = await getNeonServer();

  if (neon && quotes.length) {
    const { data: instruments, error: catalogError } = await neon
      .from('instrument_catalog')
      .select('id,symbol')
      .in('symbol', quotes.map((quote) => quote.symbol));

    if (catalogError) {
      persistence = 'not_migrated';
    } else {
      const bySymbol = new Map((instruments ?? []).map((row: { id: string; symbol: string }) => [row.symbol, row.id]));
      const rows = quotes.flatMap((quote) => {
        const instrumentId = bySymbol.get(quote.symbol);
        return instrumentId ? [{
          instrumentId,
          price: quote.price,
          source: quote.source,
          observedAt: quote.asOf,
        }] : [];
      });

      const saved = await persistMarketQuotes(rows);
      persistence = saved.status;
      if (saved.status === 'saved') {
        // Limit matching is run only for the signed-in user's own paper account.
        // The quote-ingestion role cannot read or modify orders or account balances.
        const { data: userData } = await neon.auth.getUser();
        if (userData.user) {
          const { data: accounts, error: accountsError } = await neon
            .from('trading_accounts')
            .select('id')
            .eq('user_id', userData.user.id)
            .eq('account_type', 'paper')
            .eq('status', 'active')
            .limit(1);

          if (accountsError) {
            matching = 'not_migrated';
          } else if (!accounts?.[0]) {
            matching = 'requires_signed_in_paper_account';
          } else {
            const instrumentsToMatch = [...new Map(rows.map((row) => [row.instrumentId, row])).values()];
            const results = await Promise.all(instrumentsToMatch.map((instrument) =>
              neon.rpc('process_my_paper_quote', {
                p_instrument_id: instrument.instrumentId,
                p_account_id: accounts[0].id,
              })
            ));
            matching = results.some((result: { error: unknown }) => result.error) ? 'not_migrated' : 'account_scoped';
          }
        } else {
          matching = 'requires_signed_in_paper_account';
        }
      }
    }
  } else if (!neon) {
    persistence = 'not_configured';
    matching = 'not_configured';
  }

  return NextResponse.json({
    ok: quotes.length > 0,
    dataStatus: quotes.length ? 'provider_quotes' : 'unavailable',
    quotes,
    unavailable: snapshot.unavailable,
    databasePersistence: persistence,
    limitOrderMatching: matching,
    fetchedAt: snapshot.fetchedAt,
  }, {
    status: quotes.length ? 200 : 503,
    headers: { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' },
  });
}
