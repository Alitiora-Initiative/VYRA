import type { CfdContractSpec, CfdMarginPolicy } from './engine.mjs';

export type PaperCfdEvent = {
  eventId: string; accountId: string; orderId: string | null; sequence: number;
  eventType: string; occurredAt: string; payload: Record<string, unknown>;
  previousHash: string; eventHash: string;
};

export type PaperCfdOrder = {
  orderId: string; accountId: string; contractCode: string; side: 'buy' | 'sell';
  orderType: 'market' | 'limit'; limitPrice: number | null; lots: number;
  filledLots: number; remainingLots: number;
  status: 'accepted' | 'partially_filled' | 'filled' | 'cancelled' | 'expired' | 'rejected';
  referencePrice: number; marginRequired: number; marginRemaining: number;
  estimatedFeeRemaining: number; reservedAmountRemaining: number;
  maxExecutionDeviationBps: number; maxQuoteAgeMs: number;
  createdAt: string; updatedAt: string; paperOnly: true;
  [key: string]: unknown;
};

export type PaperCfdPosition = {
  positionId: string; accountId: string; orderId: string; fillId: string;
  contractCode: string; contractSize: number; side: 'long' | 'short';
  lots: number; remainingLots: number; closedLots: number;
  lotStep: number; minLots: number; tickSize: number;
  accountCurrencyRate: number; maxExecutionDeviationBps: number; maxQuoteAgeMs: number;
  entryPrice: number; marginRequired: number; marginReleased: number;
  unrealizedPnl: number; status: 'open' | 'closed'; openedAt: string; paperOnly: true;
};

export type PaperCfdAccountState = {
  account: {
    accountId: string; mode: 'paper'; status: 'active' | 'suspended' | 'closed';
    currency: string; closeoutLevelPct: number; createdAt: string;
  };
  orders: PaperCfdOrder[];
  positions: PaperCfdPosition[];
  positionCloses: Array<Record<string, unknown> & { closeId: string; positionId: string; lots: number; realisedPnl: number }>;
  reservations: Array<Record<string, unknown> & {
    orderId: string; remainingAmount: number; status: 'active' | 'released' | 'consumed';
  }>;
  journals: Array<Record<string, unknown>>;
  ledgerEntries: Array<Record<string, unknown> & {
    journalId: string; accountCode: string; debit: number; credit: number; currency: string;
  }>;
  events: PaperCfdEvent[];
  idempotency: Array<Record<string, unknown>>;
};

export function createPaperCfdAccountState(input: {
  account: {
    accountId: string; mode: 'paper'; status?: 'active' | 'suspended' | 'closed';
    currency: string; closeoutLevelPct: number;
  };
  openingBalance: number; openingJournalId: string; now?: number;
}): { ok: true; state: PaperCfdAccountState; snapshot: Record<string, unknown>; paperOnly: true } | Record<string, unknown>;

export function getPaperCfdAccountSnapshot(state: PaperCfdAccountState): Record<string, unknown>;

export function submitPaperCfdOrder(input: {
  state: PaperCfdAccountState;
  request: {
    orderId: string; eventId: string; idempotencyKey: string;
    side: 'buy' | 'sell'; orderType: 'market' | 'limit'; lots: number;
    requestedLeverage: number; limitPrice?: number; estimatedFeeAmount?: number;
    accountCurrencyRate?: number; expiresAt?: string; clientOrderId?: string;
  };
  contract: CfdContractSpec;
  quote: { bid: number; ask: number; source: string; observedAt: string };
  policy: CfdMarginPolicy & {
    policyId?: string; policyVersion?: string;
    maxExecutionDeviationBps: number; maxQuoteAgeMs: number;
  };
  now?: number;
}): Record<string, unknown> & { state?: PaperCfdAccountState; order?: PaperCfdOrder };

export function fillPaperCfdOrder(input: {
  state: PaperCfdAccountState; orderId: string; fillId: string; eventId: string;
  idempotencyKey: string; lots: number; positionId: string; feeJournalId?: string;
  execution: {
    price: number; source: string; observedAt: string;
    quote: { bid: number; ask: number; source: string; observedAt: string };
    feeAmount?: number; externalExecutionId?: string; venueId?: string;
  };
  now?: number;
}): Record<string, unknown> & { state?: PaperCfdAccountState; order?: PaperCfdOrder; position?: PaperCfdPosition };

export function cancelPaperCfdOrder(input: {
  state: PaperCfdAccountState; orderId: string; eventId: string; idempotencyKey: string;
  reason?: string; now?: number;
}): Record<string, unknown> & { state?: PaperCfdAccountState; order?: PaperCfdOrder };

export function expirePaperCfdOrder(input: {
  state: PaperCfdAccountState; orderId: string; eventId: string; idempotencyKey: string;
  now?: number;
}): Record<string, unknown> & { state?: PaperCfdAccountState; order?: PaperCfdOrder };

export function rejectPaperCfdOrder(input: {
  state: PaperCfdAccountState; orderId: string; eventId: string; idempotencyKey: string;
  reason: string; now?: number;
}): Record<string, unknown> & { state?: PaperCfdAccountState; order?: PaperCfdOrder };

export function verifyPaperCfdEventChain(events?: PaperCfdEvent[]): Record<string, unknown>;
export function verifyPaperCfdJournals(state: PaperCfdAccountState): Record<string, unknown>;
export function reconcilePaperCfdState(state: PaperCfdAccountState): Record<string, unknown>;


export function closePaperCfdPosition(input: {
  state: PaperCfdAccountState; positionId: string; closeId: string;
  eventId: string; idempotencyKey: string; lots: number;
  pnlJournalId?: string; feeJournalId?: string;
  execution: {
    price: number; source: string; observedAt: string;
    quote: { bid: number; ask: number; source: string; observedAt: string };
    feeAmount?: number; externalExecutionId?: string; venueId?: string;
  };
  now?: number;
}): Record<string, unknown> & {
  state?: PaperCfdAccountState; position?: PaperCfdPosition;
  positionClose?: Record<string, unknown>;
};
