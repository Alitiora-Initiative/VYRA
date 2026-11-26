import { NextResponse } from 'next/server';
import { getNeonAuth } from '@/lib/neon/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type AuthRouteContext = {
  params: Promise<{ path: string[] }>;
};

async function handle(request: Request, context: AuthRouteContext): Promise<Response> {
  const auth = getNeonAuth();
  if (!auth) {
    return NextResponse.json({ error: 'Neon Auth is not configured.' }, { status: 503 });
  }

  const handlers = auth.handler();
  switch (request.method) {
    case 'GET':
      return handlers.GET(request, context);
    case 'POST':
      return handlers.POST(request, context);
    case 'PUT':
      return handlers.PUT(request, context);
    case 'PATCH':
      return handlers.PATCH(request, context);
    case 'DELETE':
      return handlers.DELETE(request, context);
    default:
      return NextResponse.json({ error: 'Method not allowed.' }, {
        status: 405,
        headers: { Allow: 'GET, POST, PUT, PATCH, DELETE' },
      });
  }
}

export const GET = handle;
export const POST = handle;
export const PUT = handle;
export const PATCH = handle;
export const DELETE = handle;
