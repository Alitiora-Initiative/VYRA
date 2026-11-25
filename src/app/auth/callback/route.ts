import { NextResponse, type NextRequest } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code');
  const next = request.nextUrl.searchParams.get('next');
  const safeNext = next?.startsWith('/') && !next.startsWith('//') ? next : '/';

  if (code) {
    const supabase = await getSupabaseServer();
    if (!supabase) return NextResponse.redirect(new URL('/login?error=auth_not_configured', request.url));
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(safeNext, request.url));
  }

  return NextResponse.redirect(new URL('/login?error=callback_failed', request.url));
}
