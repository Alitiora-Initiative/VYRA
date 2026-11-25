export type AssetClass = 'crypto' | 'equity' | 'forex' | 'commodity';

export type ProviderQuote = {
  symbol: string;
  name: string;
  assetClass: AssetClass;
  price: number;
  changePercent: number | null;
  currency: string;
  source: string;
  asOf: string;
  live: true;
};

export type MarketUnavailable = {
  assetClass: AssetClass;
  reason: string;
  provider: string;
};

export type MarketSnapshot = {
  quotes: ProviderQuote[];
  unavailable: MarketUnavailable[];
  fetchedAt: string;
};
