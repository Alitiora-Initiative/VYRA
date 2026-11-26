import type { NextRequest } from 'next/server';
import { getNeonServer } from '@/lib/neon/server';
import { isRecord, isSameOriginRequest, jsonError, privateJson } from '@/lib/http';

export const dynamic = 'force-dynamic';

export async function GET() {
  const neon = await getNeonServer();
  if (!neon) return jsonError('Authentication is not configured.', 503, 'AUTH_NOT_CONFIGURED');
  const { data: auth, error: authError } = await neon.auth.getUser();
  if (authError || !auth.user) return jsonError('Sign in to view account settings.', 401, 'UNAUTHENTICATED');

  const { data: existing, error: readError } = await neon
    .from('profiles')
    .select('id,display_name,created_at,updated_at')
    .eq('id', auth.user.id)
    .maybeSingle();
  if (readError) return jsonError('Could not load account profile.', 503, 'PROFILE_NOT_READY');

  if (existing) return privateJson({ profile: existing, email: auth.user.email });

  const { data: created, error: createError } = await neon
    .from('profiles')
    .insert({ id: auth.user.id, display_name: auth.user.user_metadata?.name ?? auth.user.email ?? '' })
    .select('id,display_name,created_at,updated_at')
    .maybeSingle();
  if (createError || !created) return jsonError('Could not provision account profile.', 503, 'PROFILE_NOT_READY');
  return privateJson({ profile: created, email: auth.user.email });
}

export async function PATCH(request: NextRequest) {
  if (!isSameOriginRequest(request)) return jsonError('Cross-origin mutation rejected.', 403, 'ORIGIN_REJECTED');
  const neon = await getNeonServer();
  if (!neon) return jsonError('Authentication is not configured.', 503, 'AUTH_NOT_CONFIGURED');
  const { data: auth, error: authError } = await neon.auth.getUser();
  if (authError || !auth.user) return jsonError('Sign in to update account settings.', 401, 'UNAUTHENTICATED');

  let payload: unknown;
  try { payload = await request.json(); } catch { return jsonError('Request body must be valid JSON.'); }
  if (!isRecord(payload) || typeof payload.displayName !== 'string') return jsonError('displayName is required.');
  const displayName = payload.displayName.trim();
  if (displayName.length < 2 || displayName.length > 60) return jsonError('Display name must be between 2 and 60 characters.');

  const { data, error } = await neon
    .from('profiles')
    .upsert({ id: auth.user.id, display_name: displayName, updated_at: new Date().toISOString() }, { onConflict: 'id' })
    .eq('id', auth.user.id)
    .select('id,display_name,updated_at')
    .maybeSingle();
  if (error || !data) return jsonError('Profile update failed. Apply the VYRA database migration and sign in again.', 503, 'PROFILE_UPDATE_FAILED');
  return privateJson({ ok: true, profile: data });
}
