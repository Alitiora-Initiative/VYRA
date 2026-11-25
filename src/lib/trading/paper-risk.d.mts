export function validatePaperOrder(input: Record<string, unknown>, limits: { maxOrderNotional: number }): { ok: boolean; errors: string[] };
export function applySlippage(referencePrice: number, side: 'buy' | 'sell', basisPoints?: number): number;
