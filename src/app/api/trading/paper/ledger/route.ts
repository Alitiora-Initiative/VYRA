import type { NextRequest } from 'next/server';
import { getNeonServer } from '@/lib/neon/server';
import { jsonError, privateJson } from '@/lib/http';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const neon = await getNeonServer();
  if (!neon) return jsonError('Authentication database is not configured.', 503, 'AUTH_NOT_CONFIGURED');
  const { data: userData, error: authError } = await neon.auth.getUser();
  if (authError || !userData.user) return jsonError('Sign in to view the paper ledger.', 401, 'UNAUTHENTICATED');

  const accountId = request.nextUrl.searchParams.get('accountId');
  if (!accountId || !/^[0-9a-f-]{36}$/i.test(accountId)) return jsonError('A valid accountId is required.');

  const { data: account, error: accountError } = await neon
    .from('trading_accounts')
    .select('id')
    .eq('id', accountId)
    .eq('user_id', userData.user.id)
    .maybeSingle();
  if (accountError || !account) return jsonError('Paper account not found.', 404, 'ACCOUNT_NOT_FOUND');

  const { data, error } = await neon
    .from('ledger_transactions')
    .select('id,event_type,reference_id,description,created_at,ledger_entries(id,direction,amount,currency,ledger_accounts(account_code))')
    .eq('trading_account_id', accountId)
    .order('created_at', { ascending: false })
    .limit(100);
  if (error) return jsonError('Could not load the paper ledger.', 503, 'LEDGER_NOT_READY');

  return privateJson({ transactions: data ?? [], immutable: true, note: 'Paper journal only; not a client-money statement.' });
}
