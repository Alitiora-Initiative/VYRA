import { NextResponse } from 'next/server';
import { getNeonAdminPool } from '@/lib/neon/admin';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  const authConfigured = Boolean(
    process.env.NEON_AUTH_BASE_URL && process.env.NEON_AUTH_COOKIE_SECRET,
  );
  const dataApiConfigured = Boolean(process.env.NEON_DATA_API_URL);
  const twelveDataConfigured = Boolean(process.env.TWELVEDATA_API_KEY);
  const admin = getNeonAdminPool();

  let database = 'not_configured';
  if (admin) {
    try {
      await admin.query('select 1 from public.instrument_catalog limit 1');
      database = 'connected';
    } catch {
      database = 'migration_or_connection_not_ready';
    }
  }

  const paperReady = authConfigured && dataApiConfigured && database === 'connected';
  return NextResponse.json({
    service: 'vyra-api',
    status: 'ok',
    mode: 'paper-first',
    authentication: authConfigured ? 'env_configured' : 'not_configured',
    dataApi: dataApiConfigured ? 'env_configured' : 'not_configured',
    database,
    marketData: {
      crypto: 'coingecko_adapter_enabled',
      equitiesForexCommodities: twelveDataConfigured ? 'twelvedata_key_configured' : 'requires_twelvedata_key',
    },
    paperTrading: paperReady ? 'database_connected' : 'waiting_for_configuration',
    liveExecution: {
      enabled: false,
      reason: 'Broker onboarding, compliance approval, custody controls and production risk certification are not complete.',
    },
    timestamp: new Date().toISOString(),
  }, { headers: { 'Cache-Control': 'no-store' } });
}
