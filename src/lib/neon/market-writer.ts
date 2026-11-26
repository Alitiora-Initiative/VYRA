import 'server-only';

import { Pool } from '@neondatabase/serverless';

export type MarketQuoteWrite = {
  instrumentId: string;
  price: number;
  source: string;
  observedAt: string;
};

let pool: Pool | null = null;

function getPool() {
  const connectionString = process.env.NEON_MARKET_DATA_DATABASE_URL;
  if (!connectionString) return null;

  if (!pool) {
    pool = new Pool({
      connectionString,
      max: 2,
      idleTimeoutMillis: 10_000,
      connectionTimeoutMillis: 5_000,
      allowExitOnIdle: true,
    });
  }

  return pool;
}

/**
 * Provider quote ingestion uses a dedicated Postgres role with SELECT/INSERT/
 * UPDATE rights on market_quotes only. It cannot access orders, customer
 * accounts, balances, ledger entries or auth records.
 */
export async function persistMarketQuotes(rows: MarketQuoteWrite[]) {
  if (!rows.length) return { status: 'not_configured' as const };
  const db = getPool();
  if (!db) return { status: 'not_configured' as const };

  const client = await db.connect();
  try {
    await client.query('begin');
    for (const row of rows) {
      if (
        !Number.isFinite(row.price) ||
        row.price <= 0 ||
        !Number.isFinite(Date.parse(row.observedAt)) ||
        !row.instrumentId ||
        !row.source
      ) {
        throw new Error('Invalid provider quote payload.');
      }

      await client.query(
        `insert into public.market_quotes
          (instrument_id, last_price, source, observed_at, updated_at)
         values ($1, $2, $3, $4, now())
         on conflict (instrument_id) do update
         set last_price = excluded.last_price,
             source = excluded.source,
             observed_at = excluded.observed_at,
             updated_at = now()
         where public.market_quotes.observed_at <= excluded.observed_at`,
        [row.instrumentId, row.price, row.source, row.observedAt],
      );
    }
    await client.query('commit');
    return { status: 'saved' as const };
  } catch (error) {
    await client.query('rollback').catch(() => undefined);
    console.error('[VYRA] Market quote persistence failed:', error instanceof Error ? error.message : 'unknown error');
    return { status: 'not_migrated' as const };
  } finally {
    client.release();
  }
}
