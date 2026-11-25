import { NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase/server';
import { jsonError, privateJson } from '@/lib/http';

export const dynamic = 'force-dynamic';

export async function GET() {
  const supabase = await getSupabaseServer();
  if (!supabase) return jsonError('Authentication database is not configured.', 503, 'AUTH_NOT_CONFIGURED');
  const { data: userData, error: authError } = await supabase.auth.getUser();
  if (authError || !userData.user) return jsonError('Sign in to access your paper account.', 401, 'UNAUTHENTICATED');

  const { data: accounts, error } = await supabase
    .from('trading_accounts')
    .select('id,account_type,status,currency,created_at')
    .eq('user_id', userData.user.id)
    .eq('account_type', 'paper')
    .order('created_at', { ascending: false });
  if (error) return jsonError('Could not load paper accounts. Apply the VYRA database migration first.', 503, 'DATABASE_NOT_READY');

  const snapshots = [];
  for (const account of accounts ?? []) {
    const { data: ledgerAccounts } = await supabase
      .from('ledger_accounts').select('id,account_code').eq('trading_account_id', account.id);
    const cashAccount = ledgerAccounts?.find((row) => row.account_code === 'cash');
    let cashBalance = 0;
    if (cashAccount) {
      const { data: entries } = await supabase
        .from('ledger_entries').select('direction,amount').eq('ledger_account_id', cashAccount.id);
      cashBalance = (entries ?? []).reduce((total, entry) =>
        total + (entry.direction === 'debit' ? Number(entry.amount) : -Number(entry.amount)), 0);
    }
    const { data: positions } = await supabase
      .from('positions')
      .select('instrument_id,quantity,average_cost,instrument_catalog(symbol,name,asset_class)')
      .eq('trading_account_id', account.id)
      .gt('quantity', 0);
    snapshots.push({ ...account, cashBalance, positions: positions ?? [] });
  }

  return privateJson({ accounts: snapshots, source: 'database_ledger' });
}

export async function POST() {
  const supabase = await getSupabaseServer();
  if (!supabase) return jsonError('Authentication database is not configured.', 503, 'AUTH_NOT_CONFIGURED');
  const { data: userData, error: authError } = await supabase.auth.getUser();
  if (authError || !userData.user) return jsonError('Sign in before opening a paper account.', 401, 'UNAUTHENTICATED');

  const { data, error } = await supabase.rpc('open_paper_account');
  if (error) return jsonError('Paper account creation failed. Check that the VYRA migration was applied.', 503, 'PAPER_ACCOUNT_UNAVAILABLE');
  return privateJson({ ok: true, account: data });
}
