import { NextResponse } from 'next/server';
import { getNeonServer } from '@/lib/neon/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const neon = await getNeonServer();
  if (!neon) {
    return NextResponse.json({ authenticated: false, configured: false }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
  }

  const { data, error } = await neon.auth.getUser();
  if (error || !data.user) {
    return NextResponse.json({ authenticated: false, configured: true }, {
      status: 401,
      headers: { 'Cache-Control': 'private, no-store' },
    });
  }

  return NextResponse.json({
    authenticated: true,
    configured: true,
    user: { id: data.user.id, email: data.user.email },
  }, { headers: { 'Cache-Control': 'private, no-store' } });
}
