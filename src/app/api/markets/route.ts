import { NextResponse, type NextRequest } from 'next/server';
import { getMarketSnapshot } from '@/lib/market-data';
import { getNeonAdminPool } from '@/lib/neon/admin';
import { getNeonServer } from '@/lib/neon/server';
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
  const admin = getNeonAdminPool();

  if (admin && quotes.length) {
    try {
      const catalog = await admin.query<{ id: string; symbol: string }>(
        'select id, symbol from public.instrument_catalog where symbol = any($1::text[]) and is_enabled = true',
        [quotes.map((quote) => quote.symbol)],
      );
      const ids = new Map(catalog.rows.map((row) => [row.symbol, row.id]));
      const rows = quotes.flatMap((quote) => {
        const instrumentId = ids.get(quote.symbol);
        return instrumentId ? [{
          instrumentId,
          price: quote.price,
          source: quote.source,
          observedAt: quote.asOf,
        }] : [];
      });

      if (rows.length) {
        const connection = await admin.connect();
        try {
          await connection.query('begin');
          for (const row of rows) {
            await connection.query(
              `insert into public.market_quotes (instrument_id, last_price, source, observed_at)
               values ($1, $2, $3, $4)
               on conflict (instrument_id) do update
               set last_price = excluded.last_price,
                   source = excluded.source,
                   observed_at = excluded.observed_at`,
              [row.instrumentId, row.price, row.source, row.observedAt],
            );
          }
          await connection.query('commit');
          persistence = 'saved';
        } catch (error) {
          await connection.query('rollback').catch(() => undefined);
          persistence = 'not_migrated';
          console.error('VYRA quote persistence failed:', error instanceof Error ? error.message : 'Unknown database error');
        } finally {
          connection.release();
        }

        if (persistence === 'saved') {
          // Quotes may be globally visible, but order matching is strictly scoped
          // to the current user's active paper account and enforced again in SQL.
          const userClient = await getNeonServer();
          const { data: userData } = userClient
            ? await userClient.auth.getUser()
            : { data: { user: null } };

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
              const results = await Promise.all(catalog.rows.map((instrument) =>
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
    } catch (error) {
      persistence = 'not_migrated';
      console.error('VYRA market database unavailable:', error instanceof Error ? error.message : 'Unknown database error');
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
