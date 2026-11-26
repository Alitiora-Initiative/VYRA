import { NextResponse, type NextRequest } from 'next/server';
import { getNeonAuth } from '@/lib/neon/auth';

export async function proxy(request: NextRequest) {
  const auth = getNeonAuth();
  if (!auth) {
    return NextResponse.redirect(new URL('/auth/sign-in?error=auth_not_configured', request.url));
  }

  return auth.middleware({ loginUrl: '/auth/sign-in' })(request);
}

export const config = {
  matcher: ['/settings/:path*'],
};
