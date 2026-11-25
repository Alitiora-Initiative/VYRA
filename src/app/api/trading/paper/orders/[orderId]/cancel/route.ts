import { NextRequest } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase/server';
import { isSameOriginRequest, jsonError, privateJson } from '@/lib/http';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest, context: { params: Promise<{ orderId: string }> }) {
  if (!isSameOriginRequest(request)) return jsonError('Cross-origin mutation rejected.', 403, 'ORIGIN_REJECTED');
  const supabase = await getSupabaseServer();
  if (!supabase) return jsonError('Authentication database is not configured.', 503, 'AUTH_NOT_CONFIGURED');
  const { data: userData, error: authError } = await supabase.auth.getUser();
  if (authError || !userData.user) return jsonError('Sign in to cancel orders.', 401, 'UNAUTHENTICATED');

  const { orderId } = await context.params;
  if (!/^[0-9a-f-]{36}$/i.test(orderId)) return jsonError('Invalid order ID.');
  const { data, error } = await supabase.rpc('cancel_paper_order', { p_order_id: orderId });
  if (error) return jsonError(error.message.replaceAll('_', ' ').toLowerCase(), 422, 'CANCEL_REJECTED');
  return privateJson({ ok: true, result: data });
}
