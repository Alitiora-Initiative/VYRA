export type PaperExecutionCandidate = {
  venueId: string; source: string; approved: boolean; tradingEnabled: boolean;
  instrumentAllowed: boolean; marketOpen: boolean; quoteKind: 'indicative' | 'executable';
  bid: number; ask: number; observedAt: string; availableQuantity: number;
  latencyMs: number; feeBps: number; expectedSlippageBps: number; fillProbability: number;
};
export function rankPaperExecutionVenues(input: {
  side: 'buy' | 'sell'; quantity: number; benchmarkPrice: number;
  benchmarkSource: string; benchmarkObservedAt: string;
  candidates: PaperExecutionCandidate[];
  policy: {
    status: 'approved'; version: string; jurisdictionCode: string; clientType: string;
    evidenceUrl: string; evidenceReference: string; reviewedAt: string;
    effectiveFrom: string; effectiveUntil?: string | null;
    maxQuoteAgeMs: number; maxBenchmarkAgeMs: number; maxLatencyMs: number;
    nonFillPenaltyBps: number; latencyPenaltyBps: number;
  };
  now?: number;
}): Record<string, unknown>;
export type PaperHedgeMode = 'straight_through' | 'systematic_net_residual' | 'partial_internalisation' | 'risk_warehousing';
export function resolvePaperHedgePlan(input: {
  policy: {
    status: 'approved'; version: string; mode: PaperHedgeMode;
    jurisdictionCode: string; clientType: string;
    evidenceUrl: string; evidenceReference: string; reviewedAt: string;
    effectiveFrom: string; effectiveUntil?: string | null;
    permissions: Record<string, boolean>;
    triggerExposure?: number; hedgeRatio?: number; internalisationRatio?: number;
    maxRetainedExposure?: number;
  };
  aggregateNetExposure: number; now?: number;
}): Record<string, unknown>;
