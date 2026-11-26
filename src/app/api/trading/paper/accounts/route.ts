import type { NextRequest } from 'next/server';
import { getNeonServer } from '@/lib/neon/server';
import { isSameOriginRequest, jsonError, privateJson } from '@/lib/http';

export const dynamic = 'force-dynamic';

export async function GET() {
  const supabase = await getNeonServer();
  if (!supabase) return jsonError('Authentication database is not configured.', 503, 'AUTH_NOT_CONFIGURED');
  const { data: userData, error: authError } = await supabase.auth.getUser();
  if (authError || !userData.user) return jsonError('Sign in to access your paper account.', 401, 'UNAUTHENTICATED');

  const { data: accounts, error } = await supabase
    .from('trading_accounts')
    .select('id')
    .eq('user_id', userData.user.id)
    .eq('account_type', 'paper')
    .order('created_at', { ascending: false });
  if (error) return jsonError('Could not load paper accounts.', 503, 'DATABASE_NOT_READY');

  const snapshots = [];
  for (const account of accounts ?? []) {
    const { data, error: snapshotError } = await supabase.rpc('get_paper_account_snapshot', {
      p_account_id: account.id,
    });
    if (snapshotError) return jsonError('Could not calculate paper account balances.', 503, 'ACCOUNT_SNAPSHOT_NOT_READY');
    if (data) snapshots.push(data);
  }

  return privateJson({ accounts: snapshots, source: 'database_ledger_aggregate' });
}

export async function POST(request: NextRequest) {
  if (!isSameOriginRequest(request)) return jsonError('Cross-origin mutation rejected.', 403, 'ORIGIN_REJECTED');
  const supabase = await getNeonServer();
  if (!supabase) return jsonError('Authentication database is not configured.', 503, 'AUTH_NOT_CONFIGURED');
  const { data: userData, error: authError } = await supabase.auth.getUser();
  if (authError || !userData.user) return jsonError('Sign in before opening a paper account.', 401, 'UNAUTHENTICATED');

  const { data, error } = await supabase.rpc('open_paper_account');
  if (error) return jsonError('Paper account creation failed. Check that the VYRA migration was applied.', 503, 'PAPER_ACCOUNT_UNAVAILABLE');
  return privateJson({ ok: true, account: data });
}
