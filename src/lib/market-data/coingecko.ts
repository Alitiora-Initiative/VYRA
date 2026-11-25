import type { LiveQuote } from './types';

const CACHE_TTL_MS = 60_000;\nlet cache: { expiresAt: number; quotes: LiveQuote[] } | null = null;\n\nconst COINS = [
  { id: 'bitcoin', symbol: 'BTC-USD', name: 'Bitcoin' },
  { id: 'ethereum', symbol: 'ETH-USD', name: 'Ethereum' },
  { id: 'solana', symbol: 'SOL-USD', name: 'Solana' },
] as const;

type CoinGeckoPayload = Record<string, { usd?: number; usd_24h_change?: number }>;

export async function getCryptoQuotes(): Promise<LiveQuote[]> {
  const ids = COINS.map((coin) => coin.id).join(',');
  const headers: Record<string, string> = { accept: 'application/json' };
  if (process.env.COINGECKO_DEMO_API_KEY) {
    headers['x-cg-demo-api-key'] = process.env.COINGECKO_DEMO_API_KEY;
  }

  const response = await fetch(
    `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`,
    { headers, cache: 'no-store', signal: AbortSignal.timeout(8_000) },
  );
  if (!response.ok) {
    throw new Error(`CoinGecko returned HTTP ${response.status}`);
  }

  const payload = await response.json() as CoinGeckoPayload;
  const asOf = new Date().toISOString();
  const quotes = COINS.flatMap((coin) => {
    const row = payload[coin.id];
    if (!row || typeof row.usd !== 'number' || !Number.isFinite(row.usd) || row.usd <= 0) return [];
    return [{
      symbol: coin.symbol,
      name: coin.name,
      assetClass: 'crypto' as const,
      price: row.usd,
      changePercent: typeof row.usd_24h_change === 'number' ? row.usd_24h_change : null,
      currency: 'USD',
      source: 'CoinGecko',
      asOf,
      live: true as const,
    }];
  });
}
