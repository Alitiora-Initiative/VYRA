import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const authConfigured = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  );
  const databaseAdminConfigured = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);
  const twelveDataConfigured = Boolean(process.env.TWELVEDATA_API_KEY);
  return NextResponse.json({
    service: 'vyra-api',
    status: 'ok',
    mode: 'paper-first',
    authentication: authConfigured ? 'configured' : 'not_configured',
    marketData: {
      crypto: 'public_coingecko_adapter',
      equitiesForexCommodities: twelveDataConfigured ? 'twelvedata_configured' : 'requires_twelvedata_key',
    },
    databaseAdmin: databaseAdminConfigured ? 'configured' : 'not_configured',
    paperTrading: authConfigured && databaseAdminConfigured ? 'waiting_for_schema_and_seed' : 'waiting_for_configuration',
    liveExecution: { enabled: false, reason: 'broker onboarding, compliance approval and production risk certification are not complete' },
    timestamp: new Date().toISOString(),
  }, { headers: { 'Cache-Control': 'no-store' } });
}
