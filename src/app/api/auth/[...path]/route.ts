import { NextResponse, type NextRequest } from 'next/server';
import { getNeonAuth } from '@/lib/neon/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function handle(request: NextRequest) {
  const auth = getNeonAuth();
  if (!auth) {
    return NextResponse.json({ error: 'Neon Auth is not configured.' }, { status: 503 });
  }

  const handlers = auth.handler();
  return request.method === 'GET'
    ? handlers.GET(request)
    : handlers.POST(request);
}

export const GET = handle;
export const POST = handle;
