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


function validateApprovedExecutionPolicy(policy, now = Date.now()) {
  if (!policy || typeof policy !== 'object' || policy.status !== 'approved' ||
      typeof policy.policyId !== 'string' || !policy.policyId.trim() ||
      typeof policy.policyVersion !== 'string' || !policy.policyVersion.trim() ||
      typeof policy.jurisdictionCode !== 'string' || !/^[A-Z]{2}$/.test(policy.jurisdictionCode) ||
      !policy.clientType || typeof policy.clientType !== 'string') {
    return fail('EXECUTION_POLICY_MISSING', 'An approved, versioned country and client-type execution policy is required.');
  }
  const effectiveFrom = Date.parse(policy.effectiveFrom);
  const effectiveUntil = policy.effectiveUntil ? Date.parse(policy.effectiveUntil) : Number.POSITIVE_INFINITY;
  if (!Number.isFinite(effectiveFrom) || !Number.isFinite(effectiveUntil) ||
      effectiveFrom > now || effectiveUntil <= now) {
    return fail('EXECUTION_POLICY_OUT_OF_DATE', 'The execution policy is not within its approved effective period.');
  }
  return { ok: true };
}

/**
 * Calculates progressive/marginal margin across explicit notional bands.
 * The caller must choose this method in the signed-off provider policy.
 * No leverage or tier is inferred when a band is missing.
 */
export function calculateTieredCfdMargin({ notional, tiers, calculationMethod }) {
  if (!POSITIVE(notional)) return fail('NOTIONAL_INVALID', 'Notional must be a positive finite amount.');
  if (calculationMethod !== 'marginal') {
    return fail('MARGIN_TIER_METHOD_MISSING', 'The approved margin policy must explicitly select the marginal tier method.');
  }
  if (!Array.isArray(tiers) || tiers.length === 0) {
    return fail('MARGIN_TIERS_MISSING', 'At least one approved notional tier is required.');
  }

  const ordered = [...tiers].sort((a, b) => Number(a.minNotional) - Number(b.minNotional));
  if (Number(ordered[0].minNotional) !== 0) {
    return fail('MARGIN_TIER_GAP', 'The first margin tier must begin at zero notional.');
  }

  let previousMax = 0;
  let requiredMargin = 0;
  const appliedTiers = [];
  for (const tier of ordered) {
    const min = Number(tier.minNotional);
    const max = tier.maxNotional === null || tier.maxNotional === undefined
      ? Number.POSITIVE_INFINITY : Number(tier.maxNotional);
    const leverage = Number(tier.maxLeverage);
    if (!Number.isFinite(min) || min < 0 || !(max > min) || !POSITIVE(leverage)) {
      return fail('MARGIN_TIER_INVALID', 'Each margin tier needs a valid range and positive approved leverage.');
    }
    if (Math.abs(min - previousMax) > 1e-8) {
      return fail('MARGIN_TIER_GAP', 'Margin tiers must be contiguous and non-overlapping.');
    }

    const sliceNotional = Math.max(0, Math.min(notional, max) - min);
    if (sliceNotional > 0) {
      const sliceMargin = sliceNotional / leverage;
      requiredMargin += sliceMargin;
      appliedTiers.push({
        minNotional: min, maxNotional: Number.isFinite(max) ? max : null,
        appliedNotional: Number(sliceNotional.toFixed(8)),
        maxLeverage: leverage, requiredMargin: Number(sliceMargin.toFixed(8)),
      });
    }
    previousMax = max;
    if (Math.min(notional, max) >= notional) break;
  }

  if (!appliedTiers.length || previousMax < notional) {
    return fail('MARGIN_TIER_COVERAGE_MISSING', 'Approved margin tiers do not cover the complete account notional.');
  }
  return {
    ok: true, paperOnly: true, calculationMethod: 'marginal', notional,
    requiredMargin: Number(requiredMargin.toFixed(8)),
    effectiveLeverage: Number((notional / requiredMargin).toFixed(8)),
    appliedTiers,
  };
}

/**
 * Resolves a paper-only operating model. The policy is an evidence gate,
 * not a legal opinion. Matched-principal and internalised routes are marked
 * as principal activity rather than disguised as agency routing.
 */
export function resolvePaperBrokerageOperatingModel({ policy, netExposureAfterTrade, now = Date.now() }) {
  const approved = validateApprovedExecutionPolicy(policy, now);
  if (!approved.ok) return approved;
  const permissions = policy.permissions ?? {};
  const model = policy.operatingModel;

  if (model === 'technology_partner') {
    return {
      ok: true, paperOnly: true, operatingModel: model,
      route: 'no_execution_partner_handoff', acceptsClientOrders: false,
      isPrincipal: false, requiresRegulatedPrincipalHandoff: true,
    };
  }
  if (model === 'agency_routed') {
    if (permissions.agencyRouted !== true || permissions.externalVenueApproved !== true) {
      return fail('AGENCY_PERMISSION_MISSING', 'Agency routing requires explicit jurisdiction permission and an approved external venue.');
    }
    return {
      ok: true, paperOnly: true, operatingModel: model,
      route: 'paper_external_agency_route', acceptsClientOrders: true,
      isPrincipal: false, clientCounterpartyMustBeVerified: true,
    };
  }
  if (model === 'matched_principal') {
    if (permissions.principal !== true || permissions.matchedPrincipal !== true ||
        permissions.bestExecution !== true || permissions.conflictsControls !== true) {
      return fail('MATCHED_PRINCIPAL_CONTROLS_MISSING', 'Matched-principal flow requires approved principal permissions, best-execution and conflicts controls.');
    }
    return {
      ok: true, paperOnly: true, operatingModel: model,
      route: 'paper_back_to_back_principal', acceptsClientOrders: true,
      isPrincipal: true, bestExecutionEvidenceRequired: true,
    };
  }
  if (model === 'market_maker') {
    if (permissions.principal !== true || permissions.dealing !== true ||
        permissions.conflictsControls !== true) {
      return fail('DEALING_PERMISSION_MISSING', 'Market-making requires explicit dealing/principal permission and approved conflicts controls.');
    }
    return {
      ok: true, paperOnly: true, operatingModel: model,
      route: 'paper_internalised_principal', acceptsClientOrders: true,
      isPrincipal: true, dealingDeskSegregationRequired: true,
    };
  }
  if (model === 'hybrid') {
    if (permissions.principal !== true || permissions.dealing !== true ||
        permissions.agencyRouted !== true || permissions.externalVenueApproved !== true ||
        permissions.bestExecution !== true || permissions.conflictsControls !== true) {
      return fail('HYBRID_PERMISSIONS_MISSING', 'Hybrid risk transfer requires approved principal, dealing, external-hedging, best-execution and conflicts controls.');
    }
    if (!Number.isFinite(netExposureAfterTrade)) {
      return fail('EXPOSURE_INVALID', 'Hybrid routing requires aggregate symbol exposure after the proposed trade.');
    }
    const maxRetainedExposure = Number(policy.maxRetainedExposure);
    if (!POSITIVE(maxRetainedExposure)) {
      return fail('HYBRID_LIMIT_MISSING', 'Hybrid routing requires an approved positive retained-exposure limit.');
    }
    const retainedExposure = Math.min(Math.abs(netExposureAfterTrade), maxRetainedExposure);
    const externalHedgeExposure = Math.max(0, Math.abs(netExposureAfterTrade) - maxRetainedExposure);
    return {
      ok: true, paperOnly: true, operatingModel: model,
      route: externalHedgeExposure > 0 ? 'paper_internal_plus_external_hedge' : 'paper_internal_principal',
      rule: 'aggregate_symbol_exposure_limit', netExposureAfterTrade,
      retainedExposure: Number(retainedExposure.toFixed(8)),
      externalHedgeExposure: Number(externalHedgeExposure.toFixed(8)),
      acceptsClientOrders: true, isPrincipal: true,
      neverUsesClientProfitability: true,
    };
  }
  return fail('OPERATING_MODEL_UNSUPPORTED', 'The approved operating model is not supported by the VYRA paper engine.');
}
