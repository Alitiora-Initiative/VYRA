export type CfdQuoteInput = {
  bid: number | string;
  ask: number | string;
  observedAt: string;
};

export type CfdQuoteEvaluation =
  | { available: false; reason: string }
  | { available: true; ageMs: number; spreadBps: number | null };

export function evaluateCfdQuote(
  quote: CfdQuoteInput | null | undefined,
  options?: { now?: number; maxAgeMs?: number; maxFutureSkewMs?: number }
): CfdQuoteEvaluation;
