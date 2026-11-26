import { NextResponse } from 'next/server';
import { getProviderGraphSnapshot } from '@/lib/provider-graph/capabilities.mjs';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({
    dataStatus: 'research_only_unconnected',
    ...getProviderGraphSnapshot(),
    notice: 'This is a VYRA provider-evidence register. A research candidate is not a connected or approved provider.',
  }, {
    headers: { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' },
  });
}
