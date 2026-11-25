import { NextRequest } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase/server';
import { isRecord, jsonError, privateJson } from '@/lib/http';

export const dynamic = 'force-dynamic';

export async function GET() {
  const supabase = await getSupabaseServer();
  if (!supabase) return jsonError('Authentication is not configured.', 503, 'AUTH_NOT_CONFIGURED');
  const { data: auth, error: authError } = await supabase.auth.getUser();
  if (authError || !auth.user) return jsonError('Sign in to view account settings.', 401, 'UNAUTHENTICATED');

  const { data, error } = await supabase
    .from('profiles')
    .select('id,display_name,created_at,updated_at')
    .eq('id', auth.user.id)
    .maybeSingle();
  if (error) return jsonError('Could not load account profile.', 503, 'PROFILE_NOT_READY');
  return privateJson({
    profile: data ?? { id: auth.user.id, display_name: auth.user.user_metadata?.name ?? '' },
    email: auth.user.email,
  });
}

export async function PATCH(request: NextRequest) {
  const supabase = await getSupabaseServer();
  if (!supabase) return jsonError('Authentication is not configured.', 503, 'AUTH_NOT_CONFIGURED');
  const { data: auth, error: authError } = await supabase.auth.getUser();
  if (authError || !auth.user) return jsonError('Sign in to update account settings.', 401, 'UNAUTHENTICATED');

  let payload: unknown;
  try { payload = await request.json(); } catch { return jsonError('Request body must be valid JSON.'); }
  if (!isRecord(payload) || typeof payload.displayName !== 'string') return jsonError('displayName is required.');
  const displayName = payload.displayName.trim();
  if (displayName.length < 2 || displayName.length > 60) return jsonError('Display name must be between 2 and 60 characters.');

  const { data, error } = await supabase
    .from('profiles')
    .update({ display_name: displayName, updated_at: new Date().toISOString() })
    .eq('id', auth.user.id)
    .select('id,display_name,updated_at')
    .maybeSingle();
  if (error || !data) return jsonError('Profile update failed. Apply the VYRA database migration and sign in again.', 503, 'PROFILE_UPDATE_FAILED');
  return privateJson({ ok: true, profile: data });
}
