import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function GET() {
  const authConfigured = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  );
  const serviceKeyConfigured = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);
  const twelveDataConfigured = Boolean(process.env.TWELVEDATA_API_KEY);
  const admin = getSupabaseAdmin();
  let database = 'not_configured';
  if (admin) {
    const { error } = await admin.from('instrument_catalog').select('id', { head: true, count: 'exact' }).limit(1);
    database = !error ? 'connected' : error.code === 'PGRST106' ? 'public_schema_not_exposed' : 'migration_or_api_not_ready';
  }
  const paperReady = authConfigured && serviceKeyConfigured && database === 'connected';
  return NextResponse.json({
    service: 'vyra-api',
    status: 'ok',
    mode: 'paper-first',
    authentication: authConfigured ? 'env_configured' : 'not_configured',
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
