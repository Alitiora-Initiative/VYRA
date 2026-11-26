import { NextResponse, type NextRequest } from 'next/server';
import { getNeonAuth } from '@/lib/neon/auth';
import { isSameOriginRequest } from '@/lib/http';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.redirect(new URL('/auth/sign-in?error=origin_rejected', request.url), { status: 303 });
  }

  const auth = getNeonAuth();
  if (!auth) {
    return NextResponse.redirect(new URL('/auth/sign-in?error=auth_not_configured', request.url), { status: 303 });
  }

  await auth.signOut();
  return NextResponse.redirect(new URL('/auth/sign-in', request.url), { status: 303 });
}
