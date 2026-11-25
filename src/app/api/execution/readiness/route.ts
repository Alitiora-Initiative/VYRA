import { NextResponse } from 'next/server';
import { getExecutionReadiness } from '@/lib/execution/registry';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({
    mode: 'paper-first',
    liveExecutionEnabled: false,
    providers: getExecutionReadiness(),
    notes: [
      'Provider slots are not connected broker accounts.',
      'No live credentials or live order routes are installed.',
      'Each market requires a contracted, jurisdiction-approved execution provider and independent conformance tests.',
    ],
  }, { headers: { 'Cache-Control': 'no-store' } });
}
