import type { AssetClass } from '@/lib/market-data/types';

export type OrderIntent = {
  accountId: string;
  instrumentId: string;
  symbol: string;
  assetClass: AssetClass;
  side: 'buy' | 'sell';
  orderType: 'market' | 'limit' | 'stop' | 'stop_limit';
  quantity: string;
  limitPrice?: string;
  clientOrderId: string;
};

export type ProviderCapabilities = {
  assetClasses: AssetClass[];
  orderTypes: Array<OrderIntent['orderType']>;
  supportsFractional: boolean;
  supportsShortSelling: boolean;
  supportsPrePostMarket: boolean;
  supportsClientOrderId: boolean;
};

export type ExecutionResult =
  | { accepted: true; providerOrderId: string; status: string }
  | { accepted: false; code: string; reason: string };

export interface ExecutionProvider {
  readonly id: string;
  readonly capabilities: ProviderCapabilities;
  submit(intent: OrderIntent): Promise<ExecutionResult>;
  cancel(providerOrderId: string): Promise<ExecutionResult>;
}
