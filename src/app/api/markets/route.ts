import { NextResponse, type NextRequest } from 'next/server';
import { getMarketSnapshot } from '@/lib/market-data';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { getSupabaseServer } from '@/lib/supabase/server';
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
  let matching: 'account_scoped' | 'requires_signed_in_paper_account' | 'not_configured' | 'not_migrated' = 'not_configured';
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
        if (!error) {
          // Public quote refreshes must never execute another user's paper orders.
          // A signed-in user can only match orders belonging to their own paper account.
          const userClient = await getSupabaseServer();
          const { data: userData } = userClient ? await userClient.auth.getUser() : { data: { user: null } };
          if (userClient && userData.user) {
            const { data: accounts, error: accountsError } = await userClient
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
              const results = await Promise.all((instruments ?? []).map((instrument) =>
                userClient.rpc('process_my_paper_quote', {
                  p_instrument_id: instrument.id,
                  p_account_id: accounts[0].id,
                })
              ));
              matching = results.some((result) => result.error) ? 'not_migrated' : 'account_scoped';
            }
          } else {
            matching = 'requires_signed_in_paper_account';
          }
        }
      }
    }
  }

  const status = quotes.length ? 200 : 503;
  return NextResponse.json({
    ok: quotes.length > 0,
    dataStatus: quotes.length ? 'provider_quotes' : 'unavailable',
    quotes,
    unavailable: snapshot.unavailable,
    databasePersistence: persistence,
    limitOrderMatching: matching,
    fetchedAt: snapshot.fetchedAt,
  }, {
    status,
    headers: { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' },
  });
}
