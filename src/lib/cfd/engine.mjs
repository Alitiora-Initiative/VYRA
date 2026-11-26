const POSITIVE = (value) => Number.isFinite(value) && value > 0;

function fail(code, message) {
  return { ok: false, code, message };
}

export function validateCfdContractSpec(contract) {
  if (!contract || typeof contract !== 'object') return fail('CONTRACT_MISSING', 'A CFD contract specification is required.');
  const required = ['contractSize','minLots','maxLots','lotStep','tickSize','maxLeverage'];
  for (const field of required) {
    if (!POSITIVE(contract[field])) return fail('CONTRACT_SPEC_INVALID', field + ' must be a positive finite number.');
  }
  if (contract.minLots > contract.maxLots) return fail('CONTRACT_VOLUME_RANGE_INVALID', 'Minimum lots cannot exceed maximum lots.');
  if (contract.lotStep > contract.maxLots) return fail('CONTRACT_VOLUME_STEP_INVALID', 'Lot step cannot exceed the maximum volume.');
  if (!contract.contractCode || typeof contract.contractCode !== 'string') return fail('CONTRACT_CODE_MISSING', 'Contract code is required.');
  if (contract.enabled !== true) return fail('CONTRACT_DISABLED', 'This CFD contract is not enabled by an approved instrument and market-data process.');
  return { ok: true };
}

export function validateCfdQuote(quote, {
  now = Date.now(),
  maxAgeMs = 5000,
  maxFutureSkewMs = 30000,
} = {}) {
  if (!quote || !POSITIVE(quote.bid) || !POSITIVE(quote.ask) || quote.ask < quote.bid) {
    return fail('QUOTE_INVALID', 'CFD bid and ask prices must be positive and ask must not be below bid.');
  }
  if (!quote.source || typeof quote.source !== 'string') {
    return fail('QUOTE_SOURCE_MISSING', 'A named market-data source is required.');
  }
  const observedAt = Date.parse(quote.observedAt);
  if (!Number.isFinite(observedAt)) return fail('QUOTE_TIMESTAMP_INVALID', 'Quote timestamp is invalid.');
  if (observedAt > now + maxFutureSkewMs) return fail('QUOTE_FROM_FUTURE', 'Quote timestamp is ahead of the allowed clock-skew window.');
  if (now - observedAt > maxAgeMs) return fail('QUOTE_STALE', 'CFD quote is stale; the order is blocked.');
  return { ok: true, observedAt };
}

function volumeIsOnStep(lots, minLots, step) {
  const steps = (lots - minLots) / step;
  return Math.abs(steps - Math.round(steps)) <= 1e-8;
}

export function calculateCfdOrderRisk({
  contract,
  quote,
  side,
  lots,
  requestedLeverage,
  policy,
  freeMargin,
  accountCurrencyRate = 1,
  now = Date.now(),
  maxQuoteAgeMs = 5000,
}) {
  const spec = validateCfdContractSpec(contract);
  if (!spec.ok) return spec;
  const fresh = validateCfdQuote(quote, { now, maxAgeMs: maxQuoteAgeMs });
  if (!fresh.ok) return fresh;

  if (!['buy','sell'].includes(side)) return fail('SIDE_INVALID', 'Side must be buy or sell.');
  if (!POSITIVE(lots) || lots < contract.minLots || lots > contract.maxLots || !volumeIsOnStep(lots, contract.minLots, contract.lotStep)) {
    return fail('VOLUME_INVALID', 'Order volume is outside the contract limits or lot step.');
  }
  if (!policy || !POSITIVE(policy.maxLeverage)) {
    return fail('MARGIN_POLICY_MISSING', 'No approved country and client-type margin policy is available.');
  }
  if (!POSITIVE(requestedLeverage) || requestedLeverage > Math.min(contract.maxLeverage, policy.maxLeverage)) {
    return fail('LEVERAGE_NOT_PERMITTED', 'Requested leverage exceeds the contract or approved jurisdiction/client policy.');
  }
  if (!Number.isFinite(freeMargin) || freeMargin < 0) {
    return fail('FREE_MARGIN_INVALID', 'Available margin is invalid.');
  }
  if (!POSITIVE(accountCurrencyRate)) {
    return fail('FX_CONVERSION_MISSING', 'A current positive conversion rate into account currency is required.');
  }

  const executionPrice = side === 'buy' ? quote.ask : quote.bid;
  const notional = lots * contract.contractSize * executionPrice * accountCurrencyRate;
  const requiredMargin = notional / requestedLeverage;
  if (!Number.isFinite(requiredMargin) || requiredMargin <= 0) return fail('MARGIN_CALCULATION_FAILED', 'Required margin could not be calculated.');
  if (requiredMargin > freeMargin) return fail('INSUFFICIENT_FREE_MARGIN', 'Order would exceed available margin.');

  return {
    ok: true,
    paperOnly: true,
    contractCode: contract.contractCode,
    side,
    lots,
    executionPrice,
    priceSide: side === 'buy' ? 'ask' : 'bid',
    notional: Number(notional.toFixed(8)),
    leverage: requestedLeverage,
    requiredMargin: Number(requiredMargin.toFixed(8)),
    freeMarginAfter: Number((freeMargin - requiredMargin).toFixed(8)),
    quoteSource: quote.source,
    quoteObservedAt: quote.observedAt,
    marginMode: policy.marginMode === 'cross' ? 'cross' : 'isolated',
  };
}

export function markCfdPosition({
  side,
  lots,
  contractSize,
  entryPrice,
  quote,
  accountCurrencyRate = 1,
}) {
  if (!['long','short'].includes(side)) return fail('POSITION_SIDE_INVALID', 'Position side must be long or short.');
  if (![lots,contractSize,entryPrice,accountCurrencyRate].every(POSITIVE)) {
    return fail('POSITION_INPUT_INVALID', 'Lots, contract size, entry price and conversion rate must be positive.');
  }
  if (!quote || !POSITIVE(quote.bid) || !POSITIVE(quote.ask) || quote.ask < quote.bid) {
    return fail('QUOTE_INVALID', 'A valid bid/ask quote is required to mark the CFD position.');
  }

  // A long is marked at the bid it would receive to close; a short is marked at the ask it would pay to close.
  const closePrice = side === 'long' ? quote.bid : quote.ask;
  const priceDifference = side === 'long' ? closePrice - entryPrice : entryPrice - closePrice;
  const unrealizedPnl = priceDifference * lots * contractSize * accountCurrencyRate;
  return {
    ok: true,
    side,
    closePrice,
    closePriceSide: side === 'long' ? 'bid' : 'ask',
    unrealizedPnl: Number(unrealizedPnl.toFixed(8)),
  };
}

export function calculateCfdMarginSnapshot({
  balance,
  positions = [],
  closeoutLevelPct,
}) {
  if (!Number.isFinite(balance)) return fail('BALANCE_INVALID', 'Account balance must be finite.');
  if (!Number.isFinite(closeoutLevelPct) || closeoutLevelPct < 0) {
    return fail('CLOSEOUT_POLICY_MISSING', 'An approved margin close-out threshold is required.');
  }

  let unrealizedPnl = 0;
  let usedMargin = 0;
  for (const position of positions) {
    if (!Number.isFinite(position.unrealizedPnl) || !Number.isFinite(position.marginRequired) || position.marginRequired < 0) {
      return fail('POSITION_MARGIN_INVALID', 'Every position must supply finite P&L and non-negative required margin.');
    }
    unrealizedPnl += position.unrealizedPnl;
    usedMargin += position.marginRequired;
  }
  const equity = balance + unrealizedPnl;
  const freeMargin = equity - usedMargin;
  const marginLevelPct = usedMargin === 0 ? null : (equity / usedMargin) * 100;
  return {
    ok: true,
    balance,
    unrealizedPnl: Number(unrealizedPnl.toFixed(8)),
    equity: Number(equity.toFixed(8)),
    usedMargin: Number(usedMargin.toFixed(8)),
    freeMargin: Number(freeMargin.toFixed(8)),
    marginLevelPct: marginLevelPct === null ? null : Number(marginLevelPct.toFixed(8)),
    closeoutLevelPct,
    closeoutRequired: marginLevelPct !== null && marginLevelPct <= closeoutLevelPct,
    paperOnly: true,
  };
}

export function resolvePaperExecutionModel({
  model,
  netExposureAfterTrade,
  maxRetainedExposure,
}) {
  if (!['a_book','b_book','hybrid'].includes(model)) return fail('EXECUTION_MODEL_INVALID', 'Execution model must be a_book, b_book or hybrid.');
  if (!Number.isFinite(netExposureAfterTrade)) return fail('EXPOSURE_INVALID', 'Net exposure must be finite.');
  if (model === 'a_book') return { ok: true, route: 'paper_external_hedge', model, paperOnly: true };
  if (model === 'b_book') return { ok: true, route: 'paper_internal_principal', model, paperOnly: true };
  if (!POSITIVE(maxRetainedExposure)) return fail('HYBRID_LIMIT_MISSING', 'Hybrid model requires an explicit retained-exposure limit.');
  return {
    ok: true,
    route: Math.abs(netExposureAfterTrade) > maxRetainedExposure ? 'paper_external_hedge' : 'paper_internal_principal',
    model,
    rule: 'aggregate_symbol_exposure_limit',
    paperOnly: true,
  };
}
