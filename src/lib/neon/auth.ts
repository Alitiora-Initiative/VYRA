import 'server-only';

import { createNeonAuth } from '@neondatabase/auth/next/server';

export function getNeonAuth() {
  const baseUrl = process.env.NEON_AUTH_BASE_URL;
  const cookieSecret = process.env.NEON_AUTH_COOKIE_SECRET;

  if (!baseUrl || !cookieSecret || cookieSecret.length < 32) {
    return null;
  }

  return createNeonAuth({
    baseUrl,
    cookies: {
      secret: cookieSecret,
      sessionDataTtl: 300,
      sameSite: 'lax',
    },
    logLevel: process.env.NODE_ENV === 'production' ? 'warn' : 'debug',
  });
}
