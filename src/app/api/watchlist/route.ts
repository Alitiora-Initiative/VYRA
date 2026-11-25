import type { NextRequest } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase/server';
import { isRecord, isSameOriginRequest, jsonError, privateJson } from '@/lib/http';

export const dynamic = 'force-dynamic';

export async function GET() {
  const supabase = await getSupabaseServer();
  if (!supabase) return jsonError('Authentication is not configured.', 503, 'AUTH_NOT_CONFIGURED');
  const { data: auth, error: authError } = await supabase.auth.getUser();
  if (authError || !auth.user) return jsonError('Sign in to read your watchlist.', 401, 'UNAUTHENTICATED');

  const { data, error } = await supabase
    .from('user_watchlist')
    .select('id,instrument_id,created_at,instrument_catalog(symbol,name,asset_class)')
    .eq('user_id', auth.user.id)
    .order('created_at', { ascending: false });
  if (error) return jsonError('Could not load your watchlist.', 503, 'WATCHLIST_NOT_READY');
  return privateJson({ items: data ?? [] });
}

export async function POST(request: NextRequest) {
  if (!isSameOriginRequest(request)) return jsonError('Cross-origin mutation rejected.', 403, 'ORIGIN_REJECTED');
  const supabase = await getSupabaseServer();
  if (!supabase) return jsonError('Authentication is not configured.', 503, 'AUTH_NOT_CONFIGURED');
  const { data: auth, error: authError } = await supabase.auth.getUser();
  if (authError || !auth.user) return jsonError('Sign in to update your watchlist.', 401, 'UNAUTHENTICATED');

  let payload: unknown;
  try { payload = await request.json(); } catch { return jsonError('Request body must be valid JSON.'); }
  if (!isRecord(payload) || typeof payload.symbol !== 'string' || payload.symbol.length > 24) {
    return jsonError('A valid instrument symbol is required.');
  }

  const { data: instrument, error: instrumentError } = await supabase
    .from('instrument_catalog')
    .select('id')
    .eq('symbol', payload.symbol)
    .eq('is_enabled', true)
    .maybeSingle();
  if (instrumentError || !instrument) return jsonError('Instrument is unavailable.', 404, 'INSTRUMENT_NOT_FOUND');

  const { error } = await supabase
    .from('user_watchlist')
    .upsert({ user_id: auth.user.id, instrument_id: instrument.id }, {
      onConflict: 'user_id,instrument_id',
      ignoreDuplicates: true,
    });
  if (error) return jsonError('Could not save this watchlist item.', 503, 'WATCHLIST_SAVE_FAILED');
  return privateJson({ ok: true, symbol: payload.symbol, saved: true });
}

export async function DELETE(request: NextRequest) {
  if (!isSameOriginRequest(request)) return jsonError('Cross-origin mutation rejected.', 403, 'ORIGIN_REJECTED');
  const supabase = await getSupabaseServer();
  if (!supabase) return jsonError('Authentication is not configured.', 503, 'AUTH_NOT_CONFIGURED');
  const { data: auth, error: authError } = await supabase.auth.getUser();
  if (authError || !auth.user) return jsonError('Sign in to update your watchlist.', 401, 'UNAUTHENTICATED');

  let payload: unknown;
  try { payload = await request.json(); } catch { return jsonError('Request body must be valid JSON.'); }
  if (!isRecord(payload) || typeof payload.symbol !== 'string' || payload.symbol.length > 24) {
    return jsonError('A valid instrument symbol is required.');
  }

  const { data: instrument } = await supabase
    .from('instrument_catalog')
    .select('id')
    .eq('symbol', payload.symbol)
    .maybeSingle();
  if (!instrument) return privateJson({ ok: true, symbol: payload.symbol, saved: false });

  const { error } = await supabase
    .from('user_watchlist')
    .delete()
    .eq('user_id', auth.user.id)
    .eq('instrument_id', instrument.id);
  if (error) return jsonError('Could not remove this watchlist item.', 503, 'WATCHLIST_REMOVE_FAILED');
  return privateJson({ ok: true, symbol: payload.symbol, saved: false });
}
