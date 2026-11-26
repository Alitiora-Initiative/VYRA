import { NextResponse, type NextRequest } from 'next/server';
import { getNeonAuth } from '@/lib/neon/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type AuthRouteContext = {
  params: Promise<{ path: string[] }>;
};

async function handle(request: NextRequest, context: AuthRouteContext) {
  const auth = getNeonAuth();
  if (!auth) {
    return NextResponse.json({ error: 'Neon Auth is not configured.' }, { status: 503 });
  }

  const handlers = auth.handler();
  return request.method === 'GET'
    ? handlers.GET(request, context)
    : handlers.POST(request, context);
}

export const GET = handle;
export const POST = handle;
