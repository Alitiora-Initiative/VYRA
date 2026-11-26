export type CfdSide = 'buy' | 'sell';
export type CfdPositionSide = 'long' | 'short';
export type CfdExecutionModel = 'a_book' | 'b_book' | 'hybrid';
export interface CfdContractSpec {
  contractCode: string; contractSize: number; minLots: number; maxLots: number;
  lotStep: number; tickSize: number; maxLeverage: number; enabled: boolean;
}
export interface CfdQuote { bid: number; ask: number; source: string; observedAt: string; }
export interface CfdMarginPolicy { maxLeverage: number; marginMode?: 'isolated' | 'cross'; }
export function validateCfdContractSpec(contract: CfdContractSpec): {ok:true}|{ok:false;code:string;message:string};
export function validateCfdQuote(quote:CfdQuote,options?:{now?:number;maxAgeMs?:number;maxFutureSkewMs?:number}): {ok:true;observedAt:number}|{ok:false;code:string;message:string};
export function calculateCfdOrderRisk(input:{contract:CfdContractSpec;quote:CfdQuote;side:CfdSide;lots:number;requestedLeverage:number;policy:CfdMarginPolicy;freeMargin:number;accountCurrencyRate?:number;now?:number;maxQuoteAgeMs?:number}): Record<string,unknown>;
export function markCfdPosition(input:{side:CfdPositionSide;lots:number;contractSize:number;entryPrice:number;quote:CfdQuote;accountCurrencyRate?:number}): Record<string,unknown>;
export function calculateCfdMarginSnapshot(input:{balance:number;positions?:Array<{unrealizedPnl:number;marginRequired:number}>;closeoutLevelPct:number}): Record<string,unknown>;
export function resolvePaperExecutionModel(input:{model:CfdExecutionModel;netExposureAfterTrade:number;maxRetainedExposure?:number}): Record<string,unknown>;

export type CfdMarginTier = { minNotional: number; maxNotional?: number | null; maxLeverage: number };
export function calculateTieredCfdMargin(input: { notional: number; tiers: CfdMarginTier[]; calculationMethod: 'marginal' | string }): Record<string, unknown>;
export type CfdOperatingModel = 'technology_partner' | 'agency_routed' | 'matched_principal' | 'market_maker' | 'hybrid';
export function resolvePaperBrokerageOperatingModel(input: {
  policy: { status: 'approved'; policyId: string; policyVersion: string; jurisdictionCode: string; clientType: string; effectiveFrom: string; effectiveUntil?: string | null; operatingModel: CfdOperatingModel; maxRetainedExposure?: number; permissions: Record<string, boolean> };
  netExposureAfterTrade?: number; now?: number;
}): Record<string, unknown>;
