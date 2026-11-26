import { NextResponse } from 'next/server';
import { evaluateMarketAccessRoute } from '@/lib/access-graph/route-gate.mjs';

export const dynamic = 'force-dynamic';

function isBoundedText(value: unknown, maxLength = 80): value is string {
  return typeof value === 'string' && value.trim().length > 0 && value.trim().length <= maxLength;
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return NextResponse.json({ error: 'A JSON route object is required.' }, { status: 400 });
  }

  const country = typeof body.country === 'string' ? body.country.trim().toUpperCase() : '';
  const customerType = body.customerType;
  const product = body.product;
  const activity = body.activity;
  const providerId = body.providerId;

  if (
    country.length < 2 ||
    country.length > 3 ||
    !country.split('').every((character) => character >= 'A' && character <= 'Z') ||
    !isBoundedText(customerType) ||
    !isBoundedText(product) ||
    !isBoundedText(activity) ||
    !isBoundedText(providerId)
  ) {
    return NextResponse.json({
      error: 'country, customerType, product, activity and providerId must be non-empty, bounded route identifiers.',
    }, { status: 400 });
  }

  // Explicitly whitelist route dimensions. Caller-supplied approval gates are never accepted.
  const decision = evaluateMarketAccessRoute({
    country,
    customerType: customerType.trim(),
    product: product.trim(),
    activity: activity.trim(),
    providerId: providerId.trim(),
  });

  return NextResponse.json({
    dataStatus: 'composite_fail_closed_decision',
    ...decision,
  }, {
    headers: {
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
