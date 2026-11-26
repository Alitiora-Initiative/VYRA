const POSITIVE = (value) => Number.isFinite(value) && value > 0;

function fail(code, message, extra = {}) {
  return { ok: false, code, message, ...extra };
}

function timestampWithin(value, now, maxAgeMs, maxFutureSkewMs) {
  const time = Date.parse(value);
  if (!Number.isFinite(time)) return { ok: false, reason: 'Timestamp is invalid.' };
  if (time > now + maxFutureSkewMs) return { ok: false, reason: 'Timestamp is ahead of the allowed clock-skew window.' };
  if (now - time > maxAgeMs) return { ok: false, reason: 'Quote is stale.' };
  return { ok: true, ageMs: Math.max(0, now - time) };
}

/**
 * Deterministic paper venue ranking using total expected consideration.
 * It is a test harness only and does not send or certify real orders.
 */
export function rankPaperExecutionVenues({
  side,
  quantity,
  benchmarkPrice,
  benchmarkSource,
  benchmarkObservedAt,
  candidates,
  policy,
  now = Date.now(),
}) {
  if (!['buy', 'sell'].includes(side)) return fail('SIDE_INVALID', 'Side must be buy or sell.');
  if (!POSITIVE(quantity) || !POSITIVE(benchmarkPrice)) {
    return fail('BENCHMARK_INPUT_INVALID', 'A positive order quantity and independent benchmark price are required.');
  }
  if (!policy || policy.status !== 'approved' || !policy.version ||
      typeof policy.jurisdictionCode !== 'string' || !/^[A-Z]{2}$/.test(policy.jurisdictionCode) ||
      typeof policy.clientType !== 'string' || !policy.clientType.trim() ||
      typeof policy.evidenceUrl !== 'string' || !policy.evidenceUrl.startsWith('https://') ||
      typeof policy.evidenceReference !== 'string' || policy.evidenceReference.trim().length < 2 ||
      !POSITIVE(policy.maxQuoteAgeMs) || !POSITIVE(policy.maxBenchmarkAgeMs) ||
      !POSITIVE(policy.maxLatencyMs) ||
      !Number.isFinite(policy.nonFillPenaltyBps) || policy.nonFillPenaltyBps < 0 ||
      !Number.isFinite(policy.latencyPenaltyBps) || policy.latencyPenaltyBps < 0) {
    return fail('BEST_EXECUTION_POLICY_MISSING', 'A versioned, approved and evidence-backed country/client best-execution policy is required.');
  }
  const reviewedAt = Date.parse(policy.reviewedAt);
  if (!Number.isFinite(reviewedAt) || reviewedAt > now) {
    return fail('BEST_EXECUTION_POLICY_EVIDENCE_INVALID', 'Best-execution policy review timestamp is invalid or in the future.');
  }
  const policyStart = Date.parse(policy.effectiveFrom);
  const hasPolicyEnd = policy.effectiveUntil !== undefined && policy.effectiveUntil !== null;
  const policyEnd = hasPolicyEnd ? Date.parse(policy.effectiveUntil) : Number.POSITIVE_INFINITY;
  if (!Number.isFinite(policyStart) || (hasPolicyEnd && !Number.isFinite(policyEnd)) ||
      policyStart > now || policyEnd <= now) {
    return fail('BEST_EXECUTION_POLICY_OUT_OF_DATE', 'Best-execution policy is outside its effective period.');
  }
  if (!benchmarkSource || typeof benchmarkSource !== 'string') {
    return fail('BENCHMARK_SOURCE_MISSING', 'An independent benchmark source is required.');
  }
  const benchmarkFresh = timestampWithin(benchmarkObservedAt, now, policy.maxBenchmarkAgeMs, 5000);
  if (!benchmarkFresh.ok) return fail('BENCHMARK_UNAVAILABLE', benchmarkFresh.reason);
  if (!Array.isArray(candidates) || candidates.length === 0) {
    return fail('NO_EXECUTION_CANDIDATES', 'No venue candidates were supplied.');
  }

  const ranked = [];
  const rejected = [];
  for (const candidate of candidates) {
    const venue = candidate?.venueId || 'unknown';
    const reject = (reason) => rejected.push({ venueId: venue, reason });
    if (candidate?.approved !== true || candidate?.tradingEnabled !== true ||
        candidate?.instrumentAllowed !== true || candidate?.marketOpen !== true) {
      reject('Venue, instrument or session is not explicitly approved.');
      continue;
    }
    if (!candidate.venueId || !candidate.source || candidate.quoteKind !== 'executable') {
      reject('A named approved venue and provider-labelled executable quote are required.');
      continue;
    }
    const bid = Number(candidate.bid);
    const ask = Number(candidate.ask);
    if (!POSITIVE(bid) || !POSITIVE(ask) || ask < bid) {
      reject('Bid/ask quote is invalid or crossed.');
      continue;
    }
    const freshness = timestampWithin(candidate.observedAt, now, policy.maxQuoteAgeMs, 5000);
    if (!freshness.ok) {
      reject(freshness.reason);
      continue;
    }
    const availableQuantity = Number(candidate.availableQuantity);
    const latencyMs = Number(candidate.latencyMs);
    const feeBps = Number(candidate.feeBps);
    const expectedSlippageBps = Number(candidate.expectedSlippageBps);
    const fillProbability = Number(candidate.fillProbability);
    if (!Number.isFinite(availableQuantity) || availableQuantity < quantity) {
      reject('Available executable depth is below the requested quantity.');
      continue;
    }
    if (!Number.isFinite(latencyMs) || latencyMs < 0 || latencyMs > policy.maxLatencyMs) {
      reject('Venue latency is invalid or exceeds the approved limit.');
      continue;
    }
    if (!Number.isFinite(feeBps) || feeBps < 0 ||
        !Number.isFinite(expectedSlippageBps) || expectedSlippageBps < 0 ||
        !Number.isFinite(fillProbability) || fillProbability < 0 || fillProbability > 1) {
      reject('Fee, slippage or fill-probability evidence is missing or invalid.');
      continue;
    }

    const executionPrice = side === 'buy' ? ask : bid;
    const priceImpactBps = side === 'buy'
      ? ((executionPrice - benchmarkPrice) / benchmarkPrice) * 10000
      : ((benchmarkPrice - executionPrice) / benchmarkPrice) * 10000;
    const nonFillPenalty = (1 - fillProbability) * policy.nonFillPenaltyBps;
    const latencyPenalty = (latencyMs / policy.maxLatencyMs) * policy.latencyPenaltyBps;
    const totalExpectedCostBps = priceImpactBps + feeBps + expectedSlippageBps + nonFillPenalty + latencyPenalty;

    ranked.push({
      venueId: candidate.venueId,
      source: candidate.source,
      executionPrice,
      priceImpactBps: Number(priceImpactBps.toFixed(6)),
      feeBps,
      expectedSlippageBps,
      nonFillPenaltyBps: Number(nonFillPenalty.toFixed(6)),
      latencyPenaltyBps: Number(latencyPenalty.toFixed(6)),
      totalExpectedCostBps: Number(totalExpectedCostBps.toFixed(6)),
      availableQuantity,
      latencyMs,
      fillProbability,
      quoteAgeMs: freshness.ageMs,
    });
  }

  ranked.sort((a, b) => a.totalExpectedCostBps - b.totalExpectedCostBps);
  if (ranked.length === 0) {
    return fail('NO_ELIGIBLE_VENUE', 'Every execution venue failed the approved eligibility and quality checks.', {
      rejected,
      paperOnly: true,
    });
  }
  return {
    ok: true,
    paperOnly: true,
    policyVersion: policy.version,
    side,
    quantity,
    benchmarkSource,
    benchmarkPrice,
    selected: ranked[0],
    ranked,
    rejected,
    selectionBasis: 'Lowest estimated total consideration using benchmark price impact, explicit fees, adverse slippage, non-fill risk and latency penalty.',
    liveExecutionCertified: false,
  };
}

/**
 * Paper simulation of common hedge orchestration modes.
 * It uses aggregate symbol exposure only; no client P&L or win-rate input exists.
 */
export function resolvePaperHedgePlan({
  policy,
  aggregateNetExposure,
  now = Date.now(),
}) {
  if (!policy || policy.status !== 'approved' || !policy.version ||
      !policy.mode || !policy.permissions || typeof policy.permissions !== 'object' ||
      typeof policy.jurisdictionCode !== 'string' || !/^[A-Z]{2}$/.test(policy.jurisdictionCode) ||
      typeof policy.clientType !== 'string' || !policy.clientType.trim() ||
      typeof policy.evidenceUrl !== 'string' || !policy.evidenceUrl.startsWith('https://') ||
      typeof policy.evidenceReference !== 'string' || policy.evidenceReference.trim().length < 2) {
    return fail('HEDGE_POLICY_MISSING', 'An approved, versioned country/client hedge policy with source evidence is required.');
  }
  const reviewedAt = Date.parse(policy.reviewedAt);
  if (!Number.isFinite(reviewedAt) || reviewedAt > now) {
    return fail('HEDGE_POLICY_EVIDENCE_INVALID', 'Hedge policy review timestamp is invalid or in the future.');
  }
  const starts = Date.parse(policy.effectiveFrom);
  const hasEffectiveUntil = policy.effectiveUntil !== undefined && policy.effectiveUntil !== null;
  const ends = hasEffectiveUntil ? Date.parse(policy.effectiveUntil) : Number.POSITIVE_INFINITY;
  if (!Number.isFinite(starts) || (hasEffectiveUntil && !Number.isFinite(ends)) || starts > now || ends <= now) {
    return fail('HEDGE_POLICY_OUT_OF_DATE', 'The hedge policy is outside its effective period.');
  }
  if (!Number.isFinite(aggregateNetExposure)) {
    return fail('AGGREGATE_EXPOSURE_INVALID', 'A finite aggregate symbol exposure is required.');
  }
  const exposure = Math.abs(aggregateNetExposure);
  const permissions = policy.permissions;

  if (policy.mode === 'straight_through') {
    if (permissions.externalRouting !== true || permissions.bestExecution !== true ||
        permissions.conflictsControls !== true) {
      return fail('EXTERNAL_ROUTING_NOT_APPROVED', 'Straight-through routing requires an approved external route, best-execution and conflicts controls.');
    }
    return {
      ok: true, paperOnly: true, mode: policy.mode,
      externalHedgeExposure: exposure, retainedExposure: 0,
      route: 'paper_external_full_flow',
    };
  }

  if (policy.mode === 'systematic_net_residual') {
    if (permissions.dealingPrincipal !== true || permissions.externalHedging !== true ||
        permissions.bestExecution !== true || permissions.conflictsControls !== true) {
      return fail('SYSTEMATIC_HEDGE_PERMISSION_MISSING', 'Systematic residual hedging requires principal-risk, external-hedging, best-execution and conflicts controls.');
    }
    const triggerExposure = Number(policy.triggerExposure);
    const hedgeRatio = Number(policy.hedgeRatio);
    const maxRetainedExposure = Number(policy.maxRetainedExposure);
    if (!POSITIVE(triggerExposure) || !Number.isFinite(hedgeRatio) || hedgeRatio <= 0 || hedgeRatio > 1 ||
        !POSITIVE(maxRetainedExposure)) {
      return fail('SYSTEMATIC_HEDGE_POLICY_INVALID', 'Trigger, hedge ratio and retained-exposure limit must be explicitly configured.');
    }
    const externalHedgeExposure = exposure >= triggerExposure ? exposure * hedgeRatio : 0;
    const retainedExposure = exposure - externalHedgeExposure;
    if (retainedExposure > maxRetainedExposure) {
      return fail('RETAINED_EXPOSURE_LIMIT', 'The systematic hedge plan would exceed the approved retained-exposure limit.');
    }
    return {
      ok: true, paperOnly: true, mode: policy.mode,
      aggregateNetExposure, triggerExposure, hedgeRatio,
      externalHedgeExposure: Number(externalHedgeExposure.toFixed(8)),
      retainedExposure: Number(retainedExposure.toFixed(8)),
      route: externalHedgeExposure > 0 ? 'paper_hedge_net_residual' : 'paper_hold_below_trigger',
    };
  }

  if (policy.mode === 'partial_internalisation') {
    if (permissions.dealingPrincipal !== true || permissions.externalHedging !== true ||
        permissions.bestExecution !== true || permissions.conflictsControls !== true) {
      return fail('PARTIAL_INTERNALISATION_PERMISSION_MISSING', 'Partial internalisation requires principal-risk, external-hedging, best-execution and conflicts controls.');
    }
    const internalisationRatio = Number(policy.internalisationRatio);
    const maxRetainedExposure = Number(policy.maxRetainedExposure);
    if (!Number.isFinite(internalisationRatio) || internalisationRatio < 0 || internalisationRatio > 1 ||
        !POSITIVE(maxRetainedExposure)) {
      return fail('PARTIAL_INTERNALISATION_POLICY_INVALID', 'Internalisation ratio and retained-exposure limit must be explicitly configured.');
    }
    const retainedExposure = exposure * internalisationRatio;
    if (retainedExposure > maxRetainedExposure) {
      return fail('RETAINED_EXPOSURE_LIMIT', 'The partial internalisation plan would exceed its approved retained-exposure limit.');
    }
    const externalHedgeExposure = exposure - retainedExposure;
    return {
      ok: true, paperOnly: true, mode: policy.mode,
      internalisationRatio,
      retainedExposure: Number(retainedExposure.toFixed(8)),
      externalHedgeExposure: Number(externalHedgeExposure.toFixed(8)),
      route: 'paper_split_internal_and_external',
      clientProfitabilityUsed: false,
    };
  }

  if (policy.mode === 'risk_warehousing') {
    if (permissions.dealingPrincipal !== true || permissions.bestExecution !== true ||
        permissions.conflictsControls !== true) {
      return fail('RISK_WAREHOUSING_PERMISSION_MISSING', 'Internal risk warehousing requires dealing-principal, best-execution and conflicts controls.');
    }
    const maxRetainedExposure = Number(policy.maxRetainedExposure);
    if (!POSITIVE(maxRetainedExposure)) {
      return fail('RETAINED_EXPOSURE_LIMIT_MISSING', 'Risk warehousing requires an approved positive exposure limit.');
    }
    if (exposure > maxRetainedExposure) {
      return fail('RETAINED_EXPOSURE_LIMIT', 'The proposed warehoused exposure exceeds its approved limit.');
    }
    return {
      ok: true, paperOnly: true, mode: policy.mode,
      retainedExposure: exposure, externalHedgeExposure: 0,
      route: 'paper_internal_risk_warehouse',
    };
  }

  return fail('HEDGE_MODE_UNSUPPORTED', 'The selected paper hedge mode is not supported.');
}
