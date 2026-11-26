import type { NextRequest } from 'next/server';
import { getNeonServer } from '@/lib/neon/server';
import { isSameOriginRequest, jsonError, privateJson } from '@/lib/http';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest, context: { params: Promise<{ orderId: string }> }) {
  if (!isSameOriginRequest(request)) return jsonError('Cross-origin mutation rejected.', 403, 'ORIGIN_REJECTED');
  const neon = await getNeonServer();
  if (!neon) return jsonError('Authentication database is not configured.', 503, 'AUTH_NOT_CONFIGURED');
  const { data: userData, error: authError } = await neon.auth.getUser();
  if (authError || !userData.user) return jsonError('Sign in to cancel orders.', 401, 'UNAUTHENTICATED');

  const { orderId } = await context.params;
  if (!/^[0-9a-f-]{36}$/i.test(orderId)) return jsonError('Invalid order ID.');
  const { data, error } = await neon.rpc('cancel_paper_order', { p_order_id: orderId });
  if (error) return jsonError(error.message.replaceAll('_', ' ').toLowerCase(), 422, 'CANCEL_REJECTED');
  return privateJson({ ok: true, result: data });
}
