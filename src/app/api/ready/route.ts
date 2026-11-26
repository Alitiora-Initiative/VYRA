import { NextResponse } from 'next/server';
import { getNeonServer } from '@/lib/neon/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

type DatabaseState = 'not_configured' | 'connected' | 'unavailable';

export async function GET() {
  const authConfigured = Boolean(
    process.env.NEON_AUTH_BASE_URL &&
    process.env.NEON_AUTH_COOKIE_SECRET &&
    process.env.NEON_AUTH_COOKIE_SECRET.length >= 32
  );
  const dataApiConfigured = Boolean(process.env.NEON_DATA_API_URL);
  const quoteWriterConfigured = Boolean(process.env.NEON_MARKET_DATA_DATABASE_URL);

  let database: DatabaseState = dataApiConfigured ? 'unavailable' : 'not_configured';
  if (authConfigured && dataApiConfigured) {
    try {
      const neon = await getNeonServer();
      if (neon) {
        const { error } = await neon
          .from('instrument_catalog')
          .select('id', { head: true, count: 'exact' })
          .limit(1);
        database = error ? 'unavailable' : 'connected';
      }
    } catch {
      database = 'unavailable';
    }
  }

  const applicationReady = authConfigured && dataApiConfigured && database === 'connected';
  const paperTradingReady = applicationReady && quoteWriterConfigured;

  return NextResponse.json({
    service: 'vyra-api',
    status: applicationReady ? 'ready' : 'not_ready',
    checks: {
      authentication: authConfigured ? 'configured' : 'not_configured',
      dataApi: dataApiConfigured ? 'configured' : 'not_configured',
      database,
      quoteWriter: quoteWriterConfigured ? 'configured' : 'not_configured',
    },
    capabilities: {
      paperTrading: paperTradingReady ? 'ready' : 'waiting_for_configuration',
      liveExecution: {
        enabled: false,
        reason: 'Live execution remains disabled pending regulated-provider appointment, legal approval, custody and funding controls, and production certification.',
      },
    },
    timestamp: new Date().toISOString(),
  }, {
    status: applicationReady ? 200 : 503,
    headers: {
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
