import type { AssetClass, LiveQuote } from './types';

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

async function fetchOne(instrument: TwelveDataInstrument, apiKey: string): Promise<LiveQuote | null> {
  const url = new URL('https://api.twelvedata.com/quote');
  url.searchParams.set('symbol', instrument.symbol);
  url.searchParams.set('apikey', apiKey);
  const response = await fetch(url, { cache: 'no-store', signal: AbortSignal.timeout(8_000) });
  if (!response.ok) throw new Error(`Twelve Data returned HTTP ${response.status} for ${instrument.symbol}`);
  const data = await response.json() as TwelveDataQuote;
  if (data.status === 'error' || data.code || !data.close) {
    throw new Error(data.message || `No quote returned for ${instrument.symbol}`);
  }

  const price = Number(data.close || data.price);
  const asOf = parseTime(data);
  if (!Number.isFinite(price) || price <= 0 || !asOf) {
    throw new Error(`Twelve Data returned an invalid or undated quote for ${instrument.symbol}`);
  }

  return {
    symbol: instrument.symbol,
    name: instrument.name,
    assetClass: instrument.assetClass,
    price,
    changePercent: data.percent_change !== undefined && Number.isFinite(Number(data.percent_change))
      ? Number(data.percent_change)
      : null,
    currency: instrument.assetClass === 'forex' ? instrument.symbol.split('/')[1] : 'USD',
    source: 'Twelve Data',
    asOf,
    live: true,
  };
}

export async function getTwelveDataQuotes() {
  const apiKey = process.env.TWELVEDATA_API_KEY;
  if (!apiKey) {
    return {
      quotes: [] as LiveQuote[],
      unavailable: [{
        assetClass: 'equity' as const,
        reason: 'Configure TWELVEDATA_API_KEY to enable equity, FX and commodity quotes.',
        provider: 'Twelve Data',
      }, {
        assetClass: 'forex' as const,
        reason: 'Configure TWELVEDATA_API_KEY to enable FX quotes.',
        provider: 'Twelve Data',
      }, {
        assetClass: 'commodity' as const,
        reason: 'Configure TWELVEDATA_API_KEY to enable commodity quotes.',
        provider: 'Twelve Data',
      }],
    };
  }

  const results = await Promise.allSettled(SYMBOLS.map((symbol) => fetchOne(symbol, apiKey)));
  const quotes: LiveQuote[] = [];
  const failed = new Set<AssetClass>();
  results.forEach((result, index) => {
    if (result.status === 'fulfilled' && result.value) quotes.push(result.value);
    else failed.add(SYMBOLS[index].assetClass);
  });

  return {
    quotes,
    unavailable: [...failed].map((assetClass) => ({
      assetClass,
      provider: 'Twelve Data',
      reason: 'The provider did not return a valid, timestamped quote for every requested instrument.',
    })),
  };
}
