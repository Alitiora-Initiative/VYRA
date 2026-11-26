const POSITIVE = (value) => Number.isFinite(value) && value > 0;

export function evaluateCfdQuote(quote, {
  now = Date.now(),
  maxAgeMs = 30000,
  maxFutureSkewMs = 30000,
} = {}) {
  if (!quote || !POSITIVE(Number(quote.bid)) || !POSITIVE(Number(quote.ask))) {
    return { available: false, reason: 'A valid positive bid and ask are required.' };
  }
  const bid = Number(quote.bid);
  const ask = Number(quote.ask);
  if (ask < bid) return { available: false, reason: 'The ask price is below the bid price.' };
  const observedAt = Date.parse(quote.observedAt);
  if (!Number.isFinite(observedAt)) return { available: false, reason: 'The quote timestamp is invalid.' };
  const ageMs = now - observedAt;
  if (ageMs < -maxFutureSkewMs) return { available: false, reason: 'The quote timestamp is ahead of the allowed clock-skew window.' };
  if (ageMs > maxAgeMs) return { available: false, reason: 'The quote is stale.' };
  const midpoint = (bid + ask) / 2;
  const spreadBps = midpoint > 0 ? ((ask - bid) / midpoint) * 10000 : null;
  return {
    available: true,
    ageMs: Math.max(0, ageMs),
    spreadBps: spreadBps === null ? null : Number(spreadBps.toFixed(4)),
  };
}
