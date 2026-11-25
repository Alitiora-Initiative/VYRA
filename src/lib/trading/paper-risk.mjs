export function validatePaperOrder(input, limits) {
  const errors = [];
  if (!input || typeof input !== 'object') return { ok: false, errors: ['Order payload is required.'] };
  if (!['buy', 'sell'].includes(input.side)) errors.push('Side must be buy or sell.');
  if (!['market', 'limit'].includes(input.type)) errors.push('Order type must be market or limit.');
  if (typeof input.quantity !== 'number' || !Number.isFinite(input.quantity) || input.quantity <= 0) {
    errors.push('Quantity must be a positive finite number.');
  }
  if (typeof input.referencePrice !== 'number' || !Number.isFinite(input.referencePrice) || input.referencePrice <= 0) {
    errors.push('A fresh positive reference price is required.');
  }
  if (input.quantity > 10000000) errors.push('Quantity exceeds the platform maximum.');
  if (input.type === 'limit' && (typeof input.limitPrice !== 'number' || !Number.isFinite(input.limitPrice) || input.limitPrice <= 0)) {
    errors.push('A limit order requires a positive limit price.');
  }
  if (input.type === 'market' && input.limitPrice !== undefined && input.limitPrice !== null) {
    errors.push('Market orders cannot include a limit price.');
  }
  if (typeof limits?.maxOrderNotional !== 'number' || !Number.isFinite(limits.maxOrderNotional) || limits.maxOrderNotional <= 0) {
    errors.push('Risk limits are unavailable.');
  }
  if (Number.isFinite(input.quantity) && Number.isFinite(input.referencePrice)) {
    if (input.quantity * input.referencePrice > limits.maxOrderNotional) errors.push('Order exceeds the maximum notional limit.');
  }
  return { ok: errors.length === 0, errors };
}

export function applySlippage(referencePrice, side, basisPoints = 5) {
  if (!Number.isFinite(referencePrice) || referencePrice <= 0) throw new RangeError('Reference price must be positive.');
  if (!['buy', 'sell'].includes(side)) throw new TypeError('Side must be buy or sell.');
  if (!Number.isFinite(basisPoints) || basisPoints < 0 || basisPoints > 1000) throw new RangeError('Slippage basis points are invalid.');
  const factor = basisPoints / 10000;
  return side === 'buy' ? referencePrice * (1 + factor) : referencePrice * (1 - factor);
}
