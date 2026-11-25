import { NextRequest } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase/server';
import { isRecord, jsonError, privateJson } from '@/lib/http';
import { validatePaperOrder } from '@/lib/trading/paper-risk.mjs';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const supabase = await getSupabaseServer();
  if (!supabase) return jsonError('Authentication database is not configured.', 503, 'AUTH_NOT_CONFIGURED');
  const { data: userData, error: authError } = await supabase.auth.getUser();
  if (authError || !userData.user) return jsonError('Sign in to view orders.', 401, 'UNAUTHENTICATED');

  const accountId = request.nextUrl.searchParams.get('accountId');
  if (!accountId || !/^[0-9a-f-]{36}$/i.test(accountId)) return jsonError('A valid accountId is required.');
  const { data, error } = await supabase
    .from('orders')
    .select('id,instrument_id,side,order_type,quantity,limit_price,status,filled_quantity,average_fill_price,rejection_reason,created_at,updated_at,instrument_catalog(symbol,name,asset_class),fills(id,quantity,price,notional,liquidity,filled_at)')
    .eq('trading_account_id', accountId)
    .order('created_at', { ascending: false })
    .limit(100);
  if (error) return jsonError('Could not load paper orders.', 503, 'DATABASE_NOT_READY');
  return privateJson({ orders: data ?? [] });
}

export async function POST(request: NextRequest) {
  const supabase = await getSupabaseServer();
  if (!supabase) return jsonError('Authentication database is not configured.', 503, 'AUTH_NOT_CONFIGURED');
  const { data: userData, error: authError } = await supabase.auth.getUser();
  if (authError || !userData.user) return jsonError('Sign in before submitting a paper order.', 401, 'UNAUTHENTICATED');

  let payload: unknown;
  try { payload = await request.json(); } catch { return jsonError('Request body must be valid JSON.'); }
  if (!isRecord(payload)) return jsonError('Order payload must be an object.');
  const accountId = payload.accountId;
  const symbol = payload.symbol;
  const side = payload.side;
  const type = payload.type;
  const quantity = payload.quantity;
  const limitPrice = payload.limitPrice;
  const clientOrderId = payload.clientOrderId;

  if (typeof accountId !== 'string' || !/^[0-9a-f-]{36}$/i.test(accountId)) return jsonError('A valid accountId is required.');
  if (typeof symbol !== 'string' || symbol.length > 24) return jsonError('A valid instrument symbol is required.');
  if (typeof side !== 'string' || typeof type !== 'string' || typeof quantity !== 'number') return jsonError('Side, order type and numeric quantity are required.');
  if (typeof clientOrderId !== 'string' || !/^[0-9a-f-]{36}$/i.test(clientOrderId)) {
    return jsonError('clientOrderId must be a UUID and must be reused for retries.', 400, 'IDEMPOTENCY_KEY_REQUIRED');
  }
  if (type === 'limit' && typeof limitPrice !== 'number') return jsonError('Limit orders require a numeric limitPrice.');

  const { data: instrument, error: instrumentError } = await supabase
    .from('instrument_catalog').select('id,symbol').eq('symbol', symbol).eq('is_enabled', true).maybeSingle();
  if (instrumentError || !instrument) return jsonError('Instrument is unavailable or not listed.', 404, 'INSTRUMENT_NOT_FOUND');

  const { data: quote } = await supabase
    .from('market_quotes').select('last_price,observed_at,source').eq('instrument_id', instrument.id).maybeSingle();
  const { data: limits } = await supabase
    .from('risk_limits').select('max_order_notional').eq('trading_account_id', accountId).maybeSingle();

  const referencePrice = quote ? Number(quote.last_price) : Number.NaN;
  const risk = validatePaperOrder({
    side, type, quantity, limitPrice,
    referencePrice,
  }, { maxOrderNotional: Number(limits?.max_order_notional) });
  if (!risk.ok) return jsonError(risk.errors.join(' '), 422, 'RISK_CHECK_FAILED');

  const { data, error } = await supabase.rpc('submit_paper_order', {
    p_account_id: accountId,
    p_instrument_id: instrument.id,
    p_side: side,
    p_order_type: type,
    p_quantity: quantity,
    p_limit_price: type === 'limit' ? limitPrice : null,
    p_client_order_id: clientOrderId,
  });
  if (error) {
    const code = error.message.includes('STALE') || error.message.includes('QUOTE') ? 'QUOTE_UNAVAILABLE'
      : error.message.includes('LIMIT') || error.message.includes('INSUFFICIENT') ? 'RISK_CHECK_FAILED'
      : error.message.includes('ACCOUNT') ? 'ACCOUNT_NOT_FOUND'
      : 'ORDER_REJECTED';
    return jsonError(error.message.replaceAll('_', ' ').toLowerCase(), 422, code);
  }
  return privateJson({ ok: true, result: data });
}
