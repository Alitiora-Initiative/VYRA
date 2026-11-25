import { getCryptoQuotes } from './coingecko';
import { getTwelveDataQuotes } from './twelvedata';
import type { MarketSnapshot } from './types';

export async function getMarketSnapshot(): Promise<MarketSnapshot> {
  const [crypto, other] = await Promise.allSettled([getCryptoQuotes(), getTwelveDataQuotes()]);
  const quotes = crypto.status === 'fulfilled' ? crypto.value : [];
  const unavailable = other.status === 'fulfilled' ? other.value.unavailable : [];
  if (crypto.status === 'rejected') {
    unavailable.push({
      assetClass: 'crypto',
      provider: 'CoinGecko',
      reason: crypto.reason instanceof Error ? crypto.reason.message : 'Crypto data provider failed.',
    });
  }
  if (other.status === 'fulfilled') quotes.push(...other.value.quotes);
  else {
    unavailable.push({
      assetClass: 'equity',
      provider: 'Twelve Data',
      reason: other.reason instanceof Error ? other.reason.message : 'Market data provider failed.',
    });
  }

  return { quotes, unavailable, fetchedAt: new Date().toISOString() };
}
