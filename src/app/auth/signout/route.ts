import { NextResponse, type NextRequest } from 'next/server';
import { auth, isNeonAuthConfigured } from '@/lib/auth/server';
import { isSameOriginRequest } from '@/lib/http';

export async function POST(request: NextRequest) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.redirect(new URL('/login?error=origin_rejected', request.url), { status: 303 });
  }
  if (isNeonAuthConfigured()) await auth.signOut();
  return NextResponse.redirect(new URL('/login', request.url), { status: 303 });
}
