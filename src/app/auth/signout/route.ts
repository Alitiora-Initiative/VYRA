import { NextResponse, type NextRequest } from 'next/server';
import { getNeonAuth } from '@/lib/neon/auth';
import { isSameOriginRequest } from '@/lib/http';

export async function POST(request: NextRequest) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.redirect(new URL('/auth/sign-in?error=origin_rejected', request.url), { status: 303 });
  }

  const auth = getNeonAuth();
  if (auth) await auth.signOut();
  return NextResponse.redirect(new URL('/auth/sign-in', request.url), { status: 303 });
}
