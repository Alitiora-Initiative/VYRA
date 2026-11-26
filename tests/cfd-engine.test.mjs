import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateCfdMarginSnapshot, calculateCfdOrderRisk, markCfdPosition,
  resolvePaperExecutionModel, validateCfdContractSpec, validateCfdQuote,
} from '../src/lib/cfd/engine.mjs';

const contract = {
  contractCode: 'EURUSD.CFD', contractSize: 100000, minLots: 0.01,
  maxLots: 50, lotStep: 0.01, tickSize: 0.00001, maxLeverage: 30, enabled: true,
};
const now = Date.parse('2026-11-26T10:00:00.000Z');
const quote = { bid: 1.08, ask: 1.0802, source: 'test-feed', observedAt: new Date(now - 1000).toISOString() };
const policy = { maxLeverage: 20, marginMode: 'isolated' };

test('rejects contract specs that are disabled or incomplete', () => {
  assert.equal(validateCfdContractSpec({ ...contract, enabled: false }).code, 'CONTRACT_DISABLED');
  assert.equal(validateCfdContractSpec({ ...contract, tickSize: 0 }).code, 'CONTRACT_SPEC_INVALID');
});

test('rejects stale and crossed CFD quotes', () => {
  assert.equal(validateCfdQuote({ ...quote, observedAt: new Date(now - 10000).toISOString() }, { now, maxAgeMs: 5000 }).code, 'QUOTE_STALE');
  assert.equal(validateCfdQuote({ ...quote, ask: 1.07 }, { now }).code, 'QUOTE_INVALID');
});

test('buys at ask and sells at bid while applying jurisdiction leverage cap', () => {
  const buy = calculateCfdOrderRisk({ contract, quote, side: 'buy', lots: 0.1, requestedLeverage: 10, policy, freeMargin: 5000, now });
  const sell = calculateCfdOrderRisk({ contract, quote, side: 'sell', lots: 0.1, requestedLeverage: 10, policy, freeMargin: 5000, now });
  assert.equal(buy.ok, true);
  assert.equal(buy.executionPrice, quote.ask);
  assert.equal(sell.executionPrice, quote.bid);
  assert.equal(buy.paperOnly, true);
});

test('does not allow leverage above approved market or contract rule', () => {
  const result = calculateCfdOrderRisk({ contract, quote, side: 'buy', lots: 0.1, requestedLeverage: 21, policy, freeMargin: 5000, now });
  assert.equal(result.code, 'LEVERAGE_NOT_PERMITTED');
});

test('requires approved policy and rejects volume outside lot step', () => {
  const noPolicy = calculateCfdOrderRisk({ contract, quote, side: 'buy', lots: 0.1, requestedLeverage: 10, policy: null, freeMargin: 5000, now });
  const badVolume = calculateCfdOrderRisk({ contract, quote, side: 'buy', lots: 0.015, requestedLeverage: 10, policy, freeMargin: 5000, now });
  assert.equal(noPolicy.code, 'MARGIN_POLICY_MISSING');
  assert.equal(badVolume.code, 'VOLUME_INVALID');
});

test('blocks orders that exceed available margin', () => {
  const result = calculateCfdOrderRisk({ contract, quote, side: 'buy', lots: 1, requestedLeverage: 10, policy, freeMargin: 1000, now });
  assert.equal(result.code, 'INSUFFICIENT_FREE_MARGIN');
});

test('marks long at bid and short at ask', () => {
  const long = markCfdPosition({ side: 'long', lots: 1, contractSize: 100000, entryPrice: 1.0801, quote });
  const short = markCfdPosition({ side: 'short', lots: 1, contractSize: 100000, entryPrice: 1.08, quote });
  assert.equal(long.closePrice, quote.bid);
  assert.equal(short.closePrice, quote.ask);
  assert.ok(long.unrealizedPnl < 0);
  assert.ok(short.unrealizedPnl < 0);
});

test('calculates equity, free margin and a policy-controlled closeout signal', () => {
  const snapshot = calculateCfdMarginSnapshot({
    balance: 1000, positions: [{ unrealizedPnl: -600, marginRequired: 1000 }], closeoutLevelPct: 50,
  });
  assert.equal(snapshot.equity, 400);
  assert.equal(snapshot.freeMargin, -600);
  assert.equal(snapshot.marginLevelPct, 40);
  assert.equal(snapshot.closeoutRequired, true);
});



test('uses the stricter result of user-requested leverage and progressive policy tiers', () => {
  const result = calculateCfdOrderRisk({
    contract, quote, side: 'buy', lots: 0.1, requestedLeverage: 10,
    policy: {
      maxLeverage: 20, marginMode: 'cross', marginTierMethod: 'marginal',
      marginTiers: [
        { minNotional: 0, maxNotional: 5000, maxLeverage: 20 },
        { minNotional: 5000, maxNotional: null, maxLeverage: 10 },
      ],
    },
    freeMargin: 5000, now,
  });
  assert.equal(result.ok, true);
  assert.equal(result.marginCalculationMethod, 'marginal_tiered_max_of_requested_and_policy');
  assert.equal(result.requiredMargin, 1080.2);
});

test('gross margin does not offset opposing positions and includes pending reservations', () => {
  const snapshot = calculateCfdMarginSnapshot({
    balance: 2000,
    positions: [
      { unrealizedPnl: 0, marginRequired: 500 },
      { unrealizedPnl: 0, marginRequired: 500 },
    ],
    pendingOrderMargin: 200,
    otherReservedMargin: 100,
    closeoutLevelPct: 50,
  });
  assert.equal(snapshot.usedMargin, 1000);
  assert.equal(snapshot.totalMarginCommitment, 1300);
  assert.equal(snapshot.freeMargin, 700);
});

test('rejects negative pending or other margin reservations', () => {
  const result = calculateCfdMarginSnapshot({
    balance: 1000, positions: [], closeoutLevelPct: 50,
    pendingOrderMargin: -1,
  });
  assert.equal(result.code, 'MARGIN_RESERVATION_INVALID');
});

test('A-book, B-book and hybrid route simulation never claims a live execution', () => {
  assert.equal(resolvePaperExecutionModel({ model: 'a_book', netExposureAfterTrade: 100 }).route, 'paper_external_hedge');
  assert.equal(resolvePaperExecutionModel({ model: 'b_book', netExposureAfterTrade: 100 }).route, 'paper_internal_principal');
  assert.equal(resolvePaperExecutionModel({ model: 'hybrid', netExposureAfterTrade: 1200, maxRetainedExposure: 1000 }).route, 'paper_external_hedge');
  assert.equal(resolvePaperExecutionModel({ model: 'hybrid', netExposureAfterTrade: 300, maxRetainedExposure: 1000 }).route, 'paper_internal_principal');
  assert.equal(resolvePaperExecutionModel({ model: 'hybrid', netExposureAfterTrade: 300 }).code, 'HYBRID_LIMIT_MISSING');
});


test('calculates progressive margin using explicit contiguous notional tiers', async () => {
  const { calculateTieredCfdMargin } = await import('../src/lib/cfd/engine.mjs');
  const result = calculateTieredCfdMargin({
    notional: 250000, calculationMethod: 'marginal',
    tiers: [
      { minNotional: 0, maxNotional: 100000, maxLeverage: 30 },
      { minNotional: 100000, maxNotional: 200000, maxLeverage: 20 },
      { minNotional: 200000, maxNotional: null, maxLeverage: 10 },
    ],
  });
  assert.equal(result.ok, true);
  assert.equal(result.requiredMargin, 13333.33333333);
  assert.equal(result.appliedTiers.length, 3);
});

test('blocks missing, gapped or implicit tiered-margin methods', async () => {
  const { calculateTieredCfdMargin } = await import('../src/lib/cfd/engine.mjs');
  assert.equal(calculateTieredCfdMargin({ notional: 1000, tiers: [] }).code, 'MARGIN_TIER_METHOD_MISSING');
  assert.equal(calculateTieredCfdMargin({
    notional: 150000, calculationMethod: 'marginal',
    tiers: [
      { minNotional: 0, maxNotional: 100000, maxLeverage: 30 },
      { minNotional: 120000, maxNotional: null, maxLeverage: 20 },
    ],
  }).code, 'MARGIN_TIER_GAP');
});

test('separates a technology partner from a regulated execution model', async () => {
  const { resolvePaperBrokerageOperatingModel } = await import('../src/lib/cfd/engine.mjs');
  const policy = {
    status: 'approved', policyId: 'policy-kenya-demo', policyVersion: '1.0',
    jurisdictionCode: 'KE', clientType: 'retail',
    effectiveFrom: new Date(now - 1000).toISOString(),
    operatingModel: 'technology_partner', permissions: {},
  };
  const result = resolvePaperBrokerageOperatingModel({ policy, now });
  assert.equal(result.ok, true);
  assert.equal(result.route, 'no_execution_partner_handoff');
  assert.equal(result.acceptsClientOrders, false);
});

test('requires explicit principal permissions for matched principal', async () => {
  const { resolvePaperBrokerageOperatingModel } = await import('../src/lib/cfd/engine.mjs');
  const policy = {
    status: 'approved', policyId: 'policy-demo', policyVersion: '1',
    jurisdictionCode: 'GB', clientType: 'retail',
    effectiveFrom: new Date(now - 1000).toISOString(),
    operatingModel: 'matched_principal',
    permissions: { principal: true, matchedPrincipal: true, bestExecution: true, conflictsControls: false },
  };
  assert.equal(resolvePaperBrokerageOperatingModel({ policy, now }).code, 'MATCHED_PRINCIPAL_CONTROLS_MISSING');
});

test('hybrid operating model retains only the approved exposure amount and routes the excess', async () => {
  const { resolvePaperBrokerageOperatingModel } = await import('../src/lib/cfd/engine.mjs');
  const policy = {
    status: 'approved', policyId: 'policy-hybrid', policyVersion: '2',
    jurisdictionCode: 'GB', clientType: 'professional',
    effectiveFrom: new Date(now - 1000).toISOString(),
    operatingModel: 'hybrid', maxRetainedExposure: 1000,
    permissions: {
      principal: true, dealing: true, agencyRouted: true, externalVenueApproved: true,
      bestExecution: true, conflictsControls: true,
    },
  };
  const result = resolvePaperBrokerageOperatingModel({ policy, netExposureAfterTrade: 1400, now });
  assert.equal(result.ok, true);
  assert.equal(result.retainedExposure, 1000);
  assert.equal(result.externalHedgeExposure, 400);
  assert.equal(result.neverUsesClientProfitability, true);
});

test('blocks an expired operating policy', async () => {
  const { resolvePaperBrokerageOperatingModel } = await import('../src/lib/cfd/engine.mjs');
  const policy = {
    status: 'approved', policyId: 'policy-expired', policyVersion: '1',
    jurisdictionCode: 'KE', clientType: 'retail',
    effectiveFrom: new Date(now - 10000).toISOString(),
    effectiveUntil: new Date(now - 1000).toISOString(),
    operatingModel: 'agency_routed', permissions: { agencyRouted: true, externalVenueApproved: true },
  };
  assert.equal(resolvePaperBrokerageOperatingModel({ policy, now }).code, 'EXECUTION_POLICY_OUT_OF_DATE');
});
