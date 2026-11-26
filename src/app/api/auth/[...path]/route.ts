import { auth, isNeonAuthConfigured } from '@/lib/auth/server';

export const runtime = 'nodejs';

const handlers = auth.handler();
const unavailable = () => Response.json(
  { error: 'Neon authentication is not configured on this deployment.' },
  { status: 503 },
);

export const GET = (...args: Parameters<typeof handlers.GET>) =>
  isNeonAuthConfigured() ? handlers.GET(...args) : unavailable();
export const POST = (...args: Parameters<typeof handlers.POST>) =>
  isNeonAuthConfigured() ? handlers.POST(...args) : unavailable();
export const PUT = (...args: Parameters<typeof handlers.PUT>) =>
  isNeonAuthConfigured() ? handlers.PUT(...args) : unavailable();
export const PATCH = (...args: Parameters<typeof handlers.PATCH>) =>
  isNeonAuthConfigured() ? handlers.PATCH(...args) : unavailable();
export const DELETE = (...args: Parameters<typeof handlers.DELETE>) =>
  isNeonAuthConfigured() ? handlers.DELETE(...args) : unavailable();
