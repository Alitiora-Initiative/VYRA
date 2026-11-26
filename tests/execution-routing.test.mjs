import test from 'node:test';
import assert from 'node:assert/strict';
import { rankPaperExecutionVenues, resolvePaperHedgePlan } from '../src/lib/execution/paper-router.mjs';

const NOW = Date.parse('2026-11-26T10:00:00.000Z');
const policy = {
  status: 'approved', version: 'execution-policy-v1',
  jurisdictionCode: 'GB', clientType: 'retail',
  evidenceUrl: 'https://example.test/best-execution', evidenceReference: 'Best execution test policy',
  reviewedAt: new Date(NOW - 1000).toISOString(), effectiveFrom: new Date(NOW - 1000).toISOString(),
  maxQuoteAgeMs: 5000, maxBenchmarkAgeMs: 5000, maxLatencyMs: 500,
  nonFillPenaltyBps: 20, latencyPenaltyBps: 2,
};
function candidate(overrides = {}) {
  return {
    venueId: 'lp-one', source: 'LP One', approved: true,
    tradingEnabled: true, instrumentAllowed: true, marketOpen: true,
    quoteKind: 'executable', bid: 1.0999, ask: 1.1001,
    observedAt: new Date(NOW - 500).toISOString(),
    availableQuantity: 100000, latencyMs: 40,
    feeBps: 0.2, expectedSlippageBps: 0.1, fillProbability: 0.99,
    ...overrides,
  };
}

test('ranks eligible venues by estimated total consideration, not headline spread alone', () => {
  const result = rankPaperExecutionVenues({
    side: 'buy', quantity: 10000, benchmarkPrice: 1.1,
    benchmarkSource: 'independent composite', benchmarkObservedAt: new Date(NOW - 500).toISOString(),
    now: NOW, policy,
    candidates: [
      candidate({ venueId: 'cheap-price-high-fee', ask: 1.10011, feeBps: 1.8, latencyMs: 30 }),
      candidate({ venueId: 'slightly-worse-price-low-fee', ask: 1.10012, feeBps: 0.1, latencyMs: 20 }),
    ],
  });
  assert.equal(result.ok, true);
  assert.equal(result.paperOnly, true);
  assert.equal(result.selected.venueId, 'slightly-worse-price-low-fee');
  assert.equal(result.liveExecutionCertified, false);
});

test('requires provider-approved executable quotes and rejects stale, indicative or disabled venues', () => {
  const result = rankPaperExecutionVenues({
    side: 'sell', quantity: 1, benchmarkPrice: 100,
    benchmarkSource: 'composite', benchmarkObservedAt: new Date(NOW).toISOString(),
    now: NOW, policy,
    candidates: [
      candidate({ venueId: 'indicative', quoteKind: 'indicative' }),
      candidate({ venueId: 'stale', observedAt: new Date(NOW - 10000).toISOString() }),
      candidate({ venueId: 'disabled', tradingEnabled: false }),
    ],
  });
  assert.equal(result.ok, false);
  assert.equal(result.code, 'NO_ELIGIBLE_VENUE');
  assert.equal(result.rejected.length, 3);
});

test('rejects a quote without sufficient executable depth', () => {
  const result = rankPaperExecutionVenues({
    side: 'buy', quantity: 50000, benchmarkPrice: 1.1,
    benchmarkSource: 'composite', benchmarkObservedAt: new Date(NOW).toISOString(),
    now: NOW, policy, candidates: [candidate({ availableQuantity: 40000 })],
  });
  assert.equal(result.code, 'NO_ELIGIBLE_VENUE');
  assert.match(result.rejected[0].reason, /depth/);
});

test('blocks a missing or stale best-execution policy and benchmark', () => {
  const input = {
    side: 'buy', quantity: 100, benchmarkPrice: 1.1,
    benchmarkSource: 'composite', benchmarkObservedAt: new Date(NOW).toISOString(),
    now: NOW, candidates: [candidate()],
  };
  assert.equal(rankPaperExecutionVenues({ ...input, policy: null }).code, 'BEST_EXECUTION_POLICY_MISSING');
  assert.equal(rankPaperExecutionVenues({
    ...input, policy, benchmarkObservedAt: new Date(NOW - 10000).toISOString(),
  }).code, 'BENCHMARK_UNAVAILABLE');
});

test('systematic hedge mode hedges aggregate net residual only after its trigger', () => {
  const base = {
    status: 'approved', version: 'hedge-v1', mode: 'systematic_net_residual',
    jurisdictionCode: 'GB', clientType: 'professional',
    evidenceUrl: 'https://example.test/hedge-policy', evidenceReference: 'Hedge policy fixture',
    reviewedAt: new Date(NOW - 1000).toISOString(),
    effectiveFrom: new Date(NOW - 1000).toISOString(),
    triggerExposure: 1000, hedgeRatio: 0.5, maxRetainedExposure: 900,
    permissions: { dealingPrincipal: true, externalHedging: true, bestExecution: true, conflictsControls: true },
  };
  const below = resolvePaperHedgePlan({ policy: base, aggregateNetExposure: 800, now: NOW });
  const above = resolvePaperHedgePlan({ policy: base, aggregateNetExposure: 1200, now: NOW });
  assert.equal(below.externalHedgeExposure, 0);
  assert.equal(above.externalHedgeExposure, 600);
  assert.equal(above.retainedExposure, 600);
});

test('partial internalisation splits only the aggregate book and enforces retained limit', () => {
  const policy = {
    status: 'approved', version: 'hedge-v2', mode: 'partial_internalisation',
    jurisdictionCode: 'GB', clientType: 'professional',
    evidenceUrl: 'https://example.test/hedge-policy', evidenceReference: 'Hedge policy fixture',
    reviewedAt: new Date(NOW - 1000).toISOString(),
    effectiveFrom: new Date(NOW - 1000).toISOString(),
    internalisationRatio: 0.25, maxRetainedExposure: 500,
    permissions: { dealingPrincipal: true, externalHedging: true },
  };
  const result = resolvePaperHedgePlan({ policy, aggregateNetExposure: -1200, now: NOW });
  assert.equal(result.retainedExposure, 300);
  assert.equal(result.externalHedgeExposure, 900);
  assert.equal(result.clientProfitabilityUsed, false);
});

test('risk warehouse blocks exposure above limit and requires dealing controls', () => {
  const policy = {
    status: 'approved', version: 'warehouse-v1', mode: 'risk_warehousing',
    jurisdictionCode: 'GB', clientType: 'professional',
    evidenceUrl: 'https://example.test/hedge-policy', evidenceReference: 'Hedge policy fixture',
    reviewedAt: new Date(NOW - 1000).toISOString(),
    effectiveFrom: new Date(NOW - 1000).toISOString(),
    maxRetainedExposure: 500,
    permissions: { dealingPrincipal: true, bestExecution: true, conflictsControls: true },
  };
  assert.equal(resolvePaperHedgePlan({ policy, aggregateNetExposure: 501, now: NOW }).code, 'RETAINED_EXPOSURE_LIMIT');
  assert.equal(resolvePaperHedgePlan({
    policy: { ...policy, permissions: { dealingPrincipal: false, conflictsControls: true } },
    aggregateNetExposure: 100, now: NOW,
  }).code, 'RISK_WAREHOUSING_PERMISSION_MISSING');
});

test('straight-through route cannot retain risk and requires external routing approval', () => {
  const policy = {
    status: 'approved', version: 'stp-v1', mode: 'straight_through',
    jurisdictionCode: 'GB', clientType: 'professional',
    evidenceUrl: 'https://example.test/hedge-policy', evidenceReference: 'Hedge policy fixture',
    reviewedAt: new Date(NOW - 1000).toISOString(),
    effectiveFrom: new Date(NOW - 1000).toISOString(),
    permissions: { externalRouting: true, bestExecution: true, conflictsControls: true },
  };
  const result = resolvePaperHedgePlan({ policy, aggregateNetExposure: 250, now: NOW });
  assert.equal(result.externalHedgeExposure, 250);
  assert.equal(result.retainedExposure, 0);
  assert.equal(resolvePaperHedgePlan({
    policy: { ...policy, permissions: { externalRouting: false } },
    aggregateNetExposure: 250, now: NOW,
  }).code, 'EXTERNAL_ROUTING_NOT_APPROVED');
});
