import { NextResponse } from 'next/server';
import { getNeonServer } from '@/lib/neon/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  const authConfigured = Boolean(
    process.env.NEON_AUTH_BASE_URL &&
    process.env.NEON_AUTH_COOKIE_SECRET &&
    process.env.NEON_AUTH_COOKIE_SECRET.length >= 32
  );
  const dataApiConfigured = Boolean(process.env.NEON_DATA_API_URL);
  const quoteWriterConfigured = Boolean(process.env.NEON_MARKET_DATA_DATABASE_URL);
  const twelveDataConfigured = Boolean(process.env.TWELVEDATA_API_KEY);

  const neon = await getNeonServer();
  let database: 'not_configured' | 'connected' | 'unavailable' = 'not_configured';
  if (neon) {
    try {
      const { error } = await neon.from('instrument_catalog').select('id', { head: true, count: 'exact' }).limit(1);
      database = error ? 'unavailable' : 'connected';
    } catch {
      database = 'unavailable';
    }
  }

  const paperReady = authConfigured && dataApiConfigured && database === 'connected';
  return NextResponse.json({
    service: 'vyra-api',
    status: 'ok',
    mode: 'paper-first',
    authentication: authConfigured ? 'configured' : 'not_configured',
    database: dataApiConfigured ? database : 'not_configured',
    marketData: {
      crypto: 'coingecko_adapter_enabled',
      equitiesForexCommodities: twelveDataConfigured ? 'twelvedata_key_configured' : 'requires_twelvedata_key',
    },
    quotePersistence: quoteWriterConfigured ? 'writer_configured' : 'requires_NEON_MARKET_DATA_DATABASE_URL',
    paperTrading: paperReady ? 'database_connected' : 'waiting_for_configuration',
    liveExecution: {
      enabled: false,
      reason: 'Broker onboarding, compliance approval, custody controls and production risk certification are not complete.',
    },
    timestamp: new Date().toISOString(),
  }, { headers: { 'Cache-Control': 'no-store' } });
}
