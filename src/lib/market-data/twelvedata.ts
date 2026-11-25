import type { AssetClass, ProviderQuote } from './types';

export type TwelveDataInstrument = {
  symbol: string;
  name: string;
  assetClass: Exclude<AssetClass, 'crypto'>;
};

const SYMBOLS: TwelveDataInstrument[] = [
  { symbol: 'AAPL', name: 'Apple', assetClass: 'equity' },
  { symbol: 'NVDA', name: 'NVIDIA', assetClass: 'equity' },
  { symbol: 'MSFT', name: 'Microsoft', assetClass: 'equity' },
  { symbol: 'EUR/USD', name: 'Euro / US Dollar', assetClass: 'forex' },
  { symbol: 'GBP/USD', name: 'Pound / US Dollar', assetClass: 'forex' },
  { symbol: 'USD/JPY', name: 'US Dollar / Japanese Yen', assetClass: 'forex' },
  { symbol: 'XAU/USD', name: 'Gold / US Dollar', assetClass: 'commodity' },
  { symbol: 'XAG/USD', name: 'Silver / US Dollar', assetClass: 'commodity' },
];

// The free Basic plan has an 800-credit daily cap. A quote costs one credit
// per symbol, so this 8-symbol batch is intentionally cached for 15 minutes
// (at most 768 symbol-credits/day for one warm app instance, excluding retries).
const CACHE_TTL_MS = 15 * 60 * 1000;
type TwelveDataQuote = {
  close?: string;
  price?: string;
  percent_change?: string;
  timestamp?: number | string;
  datetime?: string;
  status?: string;
  message?: string;
  code?: number;
};
type BatchPayload = Record<string, TwelveDataQuote | string | number | null>;

let cache: { expiresAt: number; value: { quotes: ProviderQuote[]; unavailable: Array<{ assetClass: AssetClass; reason: string; provider: string }> } } | null = null;

function parseTime(data: TwelveDataQuote): string | null {
  if (data.timestamp !== undefined) {
    const value = Number(data.timestamp);
    if (Number.isFinite(value) && value > 0) return new Date(value * 1000).toISOString();
  }
  if (typeof data.datetime === 'string') {
    const parsed = new Date(data.datetime);
    if (!Number.isNaN(parsed.getTime())) return parsed.toISOString();
  }
  return null;
}

function parseQuote(value: unknown): TwelveDataQuote | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  return value as TwelveDataQuote;
}

function mapBatchPayload(payload: BatchPayload): ProviderQuote[] {
  const quotes: ProviderQuote[] = [];

  for (const instrument of SYMBOLS) {
    const row = parseQuote(payload[instrument.symbol]);
    if (!row || row.status === 'error' || row.code || (!row.close && !row.price)) continue;

    const price = Number(row.close ?? row.price);
    const asOf = parseTime(row);
    if (!Number.isFinite(price) || price <= 0 || !asOf) continue;

    quotes.push({
      symbol: instrument.symbol,
      name: instrument.name,
      assetClass: instrument.assetClass,
      price,
      changePercent: row.percent_change !== undefined && Number.isFinite(Number(row.percent_change))
        ? Number(row.percent_change)
        : null,
      currency: instrument.assetClass === 'forex' || instrument.assetClass === 'commodity'
        ? instrument.symbol.split('/')[1]
        : 'USD',
      source: 'Twelve Data',
      asOf,
    });
  }
  return quotes;
}

export async function getTwelveDataQuotes() {
  const now = Date.now();
  if (cache && cache.expiresAt > now) return cache.value;

  const apiKey = process.env.TWELVEDATA_API_KEY;
  if (!apiKey) {
    const value = {
      quotes: [] as ProviderQuote[],
      unavailable: (['equity', 'forex', 'commodity'] as const).map((assetClass) => ({
        assetClass,
        reason: 'Configure TWELVEDATA_API_KEY to enable shares, FX and commodity quotes.',
        provider: 'Twelve Data',
      })),
    };
    cache = { expiresAt: now + CACHE_TTL_MS, value };
    return value;
  }

  const url = new URL('https://api.twelvedata.com/quote');
  url.searchParams.set('symbol', SYMBOLS.map((item) => item.symbol).join(','));
  url.searchParams.set('apikey', apiKey);

  try {
    const response = await fetch(url, { cache: 'no-store', signal: AbortSignal.timeout(12_000) });
    if (!response.ok) throw new Error(`Twelve Data returned HTTP ${response.status}`);
    const payload = await response.json() as BatchPayload;
    const quotes = mapBatchPayload(payload);
    const missingClasses = [...new Set(
      SYMBOLS.filter((item) => !quotes.some((quote) => quote.symbol === item.symbol)).map((item) => item.assetClass),
    )];
    const value = {
      quotes,
      unavailable: missingClasses.map((assetClass) => ({
        assetClass,
        provider: 'Twelve Data',
        reason: 'The provider returned no valid timestamped quote for one or more requested symbols.',
      })),
    };
    cache = { expiresAt: now + CACHE_TTL_MS, value };
    return value;
  } catch (error) {
    const value = {
      quotes: [] as ProviderQuote[],
      unavailable: (['equity', 'forex', 'commodity'] as const).map((assetClass) => ({
        assetClass,
        provider: 'Twelve Data',
        reason: error instanceof Error ? error.message : 'Market data provider failed.',
      })),
    };
    // Cache failures too, preventing a refresh storm from repeatedly consuming
    // API credits when the free provider quota is exhausted or unavailable.
    cache = { expiresAt: now + CACHE_TTL_MS, value };
    return value;
  }
}
