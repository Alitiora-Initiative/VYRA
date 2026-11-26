import { NextResponse } from 'next/server';
import { getNeonServer } from '@/lib/neon/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const runtime = 'nodejs';

const responseHeaders = {
  'Cache-Control': 'no-store, max-age=0',
  'X-Content-Type-Options': 'nosniff',
};

export async function GET() {
  const neon = await getNeonServer();
  if (!neon) {
    return NextResponse.json({
      ok: false,
      status: 'not_configured',
      error: 'The CFD market-data database is not configured.',
      contracts: [],
    }, { status: 503, headers: responseHeaders });
  }

  const { data: contracts, error: contractError } = await neon
    .from('cfd_contracts')
    .select('id,contract_code,display_name,underlying_symbol,asset_class,contract_size,min_lots,max_lots,lot_step,tick_size,tick_value,quote_currency,margin_currency,provider_symbol,provider_name,contract_source_url')
    .eq('is_enabled', true)
    .order('asset_class', { ascending: true })
    .order('contract_code', { ascending: true });

  if (contractError) {
    return NextResponse.json({
      ok: false,
      status: 'schema_not_ready',
      error: 'The CFD contract registry is unavailable. Apply the approved CFD reference-data migration before using this room.',
      contracts: [],
    }, { status: 503, headers: responseHeaders });
  }

  const enabledContracts = contracts ?? [];
  if (enabledContracts.length === 0) {
    return NextResponse.json({
      ok: true,
      status: 'empty',
      contracts: [],
      quotePolicy: 'Only enabled provider-sourced contracts and database-authorised fresh quotes are displayed.',
      fetchedAt: new Date().toISOString(),
    }, { status: 200, headers: responseHeaders });
  }

  const contractIds = enabledContracts.map((contract: { id: string }) => contract.id);
  const { data: quotes, error: quoteError } = await neon
    .from('cfd_quotes')
    .select('contract_id,bid,ask,source_provider,quote_kind,observed_at')
    .in('contract_id', contractIds);

  if (quoteError) {
    return NextResponse.json({
      ok: false,
      status: 'quote_store_not_ready',
      error: 'The CFD quote store is unavailable. No market prices have been substituted.',
      contracts: [],
    }, { status: 503, headers: responseHeaders });
  }

  const quotesByContract = new Map(
    (quotes ?? []).map((quote: {
      contract_id: string;
      bid: number | string;
      ask: number | string;
      source_provider: string;
      quote_kind: string;
      observed_at: string;
    }) => [quote.contract_id, {
      bid: quote.bid,
      ask: quote.ask,
      source: quote.source_provider,
      quoteKind: quote.quote_kind,
      observedAt: quote.observed_at,
    }])
  );

  const result = enabledContracts.map((contract: {
    id: string;
    [key: string]: unknown;
  }) => ({
    ...contract,
    quote: quotesByContract.get(contract.id) ?? null,
  }));

  return NextResponse.json({
    ok: true,
    status: 'ready',
    contracts: result,
    quotePolicy: 'Only enabled provider-sourced contracts and fresh database-authorised quotes are displayed.',
    fetchedAt: new Date().toISOString(),
  }, { status: 200, headers: responseHeaders });
}
