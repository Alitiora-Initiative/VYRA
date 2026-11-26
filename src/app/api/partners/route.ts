import { NextResponse } from 'next/server';
import { listPartnerCandidates } from '@/lib/partners/registry';

export const dynamic = 'force-dynamic';

export async function GET() {
  const candidates = listPartnerCandidates();

  return NextResponse.json({
    dataStatus: 'research_only',
    customerActionsEnabled: false,
    liveExecutionEnabled: false,
    candidates: candidates.map((candidate) => ({
      ...candidate,
      canRefer: false,
      connectionStatus: 'not_connected',
    })),
    notice: 'These organisations are research candidates only. VYRA has no confirmed partnership, licence, country approval, production integration or authority to refer customers to them.',
    asOf: new Date().toISOString(),
  }, {
    headers: {
      'Cache-Control': 'no-store',
    },
  });
}
