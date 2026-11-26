import { createNeonAuth } from '@neon/auth/next/server';

const fallbackSecret = 'NEON_AUTH_COOKIE_SECRET_NOT_CONFIGURED_BUILD_ONLY';

export const isNeonAuthConfigured = () =>
  Boolean(process.env.NEON_AUTH_BASE_URL && process.env.NEON_AUTH_COOKIE_SECRET);

export const auth = createNeonAuth({
  baseUrl: process.env.NEON_AUTH_BASE_URL ?? 'https://unconfigured.neon.invalid/vyra/auth',
  cookies: {
    secret: process.env.NEON_AUTH_COOKIE_SECRET ?? fallbackSecret,
  },
});
