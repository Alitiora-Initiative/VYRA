import { auth, isNeonAuthConfigured } from '@/lib/auth/server';

export const runtime = 'nodejs';

const handlers = auth.handler();
const unavailable = () => Response.json(
  { error: 'Neon authentication is not configured on this deployment.' },
  { status: 503 },
);

export const GET = (request: Request) => isNeonAuthConfigured() ? handlers.GET(request) : unavailable();
export const POST = (request: Request) => isNeonAuthConfigured() ? handlers.POST(request) : unavailable();
export const PUT = (request: Request) => isNeonAuthConfigured() ? handlers.PUT(request) : unavailable();
export const PATCH = (request: Request) => isNeonAuthConfigured() ? handlers.PATCH(request) : unavailable();
export const DELETE = (request: Request) => isNeonAuthConfigured() ? handlers.DELETE(request) : unavailable();
