import { NextResponse } from 'next/server';
import { getAccessGraphSnapshot } from '@/lib/access-graph/rules.mjs';

export const dynamic = 'force-dynamic';

export async function GET() {
  const snapshot = getAccessGraphSnapshot();
  return NextResponse.json({
    dataStatus: 'versioned_public_rulepack',
    ...snapshot,
    notice: 'This is a source-linked product control, not legal advice or regulatory authorisation. Unassessed jurisdictions and incomplete evidence stay blocked.',
  }, {
    headers: { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' },
  });
}
