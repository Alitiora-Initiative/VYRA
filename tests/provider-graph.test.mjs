import test from 'node:test';
import assert from 'node:assert/strict';
import {
  evaluateProviderRoute,
  getProviderGraphSnapshot,
  PROVIDER_ACTIVITY_REQUIREMENTS,
} from '../src/lib/provider-graph/capabilities.mjs';

function addCurrentEvidence(record, capabilityId) {
  const today = new Date().toISOString().slice(0, 10);
  record.status = 'verified';
  record.verifiedForVyra = true;
  record.evidence = [{
    evidenceId: 'test-' + capabilityId,
    title: 'Synthetic test evidence for ' + capabilityId,
    sourceUrl: 'https://evidence.example.test/' + capabilityId,
    verifiedAt: today,
    verifiedBy: 'automated-test-reviewer',
    reverifyBy: '2099-12-31',
  }];
}

function makeVerifiedGraph(input = {}) {
  const graph = getProviderGraphSnapshot();
  const provider = graph.providers.find((item) => item.id === (input.providerId ?? 'interactive-brokers'));
  provider.legalEntityVerified = true;
  provider.licenceEvidenceVerified = true;
  provider.signedAgreement = true;
  provider.approvedCountries = [input.country ?? 'KE'];
  provider.approvedCustomerTypes = [input.customerType ?? 'retail'];
  provider.approvedProducts = [input.product ?? 'securities'];
  provider.connectedSandbox = true;
  provider.productionApproved = true;
  for (const capabilityId of PROVIDER_ACTIVITY_REQUIREMENTS[input.activity ?? 'market_information']) {
    addCurrentEvidence(provider.capabilityStatus[capabilityId], capabilityId);
  }
  return graph;
}

test('keeps every researched provider disconnected and unapproved', () => {
  const graph = getProviderGraphSnapshot();
  assert.equal(graph.providers.length, 5);
  assert.equal(graph.summary.legalEntitiesVerified, 0);
  assert.equal(graph.summary.signedAgreements, 0);
  assert.equal(graph.summary.sandboxConnections, 0);
  assert.equal(graph.summary.productionApproved, 0);
  for (const provider of graph.providers) {
    assert.equal(provider.relationshipStatus, 'research_only');
    assert.equal(provider.legalEntityVerified, false);
    assert.equal(provider.signedAgreement, false);
    assert.equal(provider.connectedSandbox, false);
    assert.equal(provider.productionApproved, false);
    for (const capability of Object.values(provider.capabilityStatus)) {
      assert.equal(capability.status, 'not_verified');
      assert.equal(capability.verifiedForVyra, false);
    }
  }
});

test('requires top-level provider gates and activity-specific capability evidence', () => {
  const result = evaluateProviderRoute({
    providerId: 'interactive-brokers',
    country: 'KE',
    customerType: 'retail',
    product: 'securities',
    activity: 'execute_orders',
  });
  assert.equal(result.ready, false);
  assert.equal(result.status, 'blocked_pending_provider_evidence');
  assert.equal(result.blockers.length, 17);
  assert.equal(result.requiredCapabilities.length, 9);
  assert.equal(result.missingCapabilities.length, 9);
  assert.equal(result.liveExecutionEnabled, false);
  assert.equal(result.customerMoneyEnabled, false);
  assert.equal(result.referralEnabled, false);
});

test('unknown provider identifiers fail closed', () => {
  const result = evaluateProviderRoute({
    providerId: 'invented-provider',
    country: 'KE',
    customerType: 'retail',
    product: 'crypto',
    activity: 'execute_orders',
  });
  assert.equal(result.providerFound, false);
  assert.equal(result.ready, false);
  assert.equal(result.status, 'provider_not_in_registry');
});

test('unknown activities require every provider capability rather than inheriting a smaller set', () => {
  const result = evaluateProviderRoute({
    providerId: 'interactive-brokers',
    country: 'KE',
    customerType: 'retail',
    product: 'securities',
    activity: 'unmapped_activity',
  });
  assert.equal(result.requiredCapabilities.length, 11);
  assert.equal(result.missingCapabilities.length, 11);
  assert.equal(result.ready, false);
});

test('a verified flag without dated, reviewer-attributed evidence is still blocked', () => {
  const graph = getProviderGraphSnapshot();
  const provider = graph.providers[0];
  provider.legalEntityVerified = true;
  provider.licenceEvidenceVerified = true;
  provider.signedAgreement = true;
  provider.approvedCountries = ['KE'];
  provider.approvedCustomerTypes = ['retail'];
  provider.approvedProducts = ['securities'];
  provider.connectedSandbox = true;
  provider.productionApproved = true;
  provider.capabilityStatus.market_data.status = 'verified';
  provider.capabilityStatus.market_data.verifiedForVyra = true;
  provider.capabilityStatus.market_data.evidence = [{
    evidenceId: 'missing-review-fields',
    title: 'Incomplete evidence',
    sourceUrl: 'https://evidence.example.test/incomplete',
  }];
  const result = evaluateProviderRoute({
    providerId: provider.id,
    country: 'KE',
    customerType: 'retail',
    product: 'securities',
    activity: 'market_information',
  }, graph);
  assert.equal(result.ready, false);
  assert.equal(result.missingCapabilities.length, 2);
  assert.ok(result.missingCapabilities.some((item) => item.reason.includes('verification date')));
});

test('expired or future-dated capability evidence stays blocked', () => {
  const input = {
    providerId: 'interactive-brokers',
    country: 'KE',
    customerType: 'retail',
    product: 'securities',
    activity: 'market_information',
  };

  const expiredGraph = makeVerifiedGraph(input);
  expiredGraph.providers[0].capabilityStatus.market_data.evidence[0].reverifyBy = '2000-01-01';
  const expired = evaluateProviderRoute(input, expiredGraph);
  assert.equal(expired.ready, false);
  assert.ok(expired.missingCapabilities.some((item) => item.id === 'market_data'));

  const futureGraph = makeVerifiedGraph(input);
  futureGraph.providers[0].capabilityStatus.market_data.evidence[0].verifiedAt = '2099-01-01';
  futureGraph.providers[0].capabilityStatus.market_data.evidence[0].reverifyBy = '2100-01-01';
  const future = evaluateProviderRoute(input, futureGraph);
  assert.equal(future.ready, false);
  assert.ok(future.missingCapabilities.some((item) => item.id === 'market_data'));
});

test('an unexpired, reviewed capability record can pass its provider-level checks but never enables an action', () => {
  const input = {
    providerId: 'interactive-brokers',
    country: 'KE',
    customerType: 'retail',
    product: 'securities',
    activity: 'market_information',
  };
  const graph = makeVerifiedGraph(input);
  const result = evaluateProviderRoute(input, graph);
  assert.equal(result.ready, true);
  assert.equal(result.status, 'manual_go_no_go_required');
  assert.equal(result.liveExecutionEnabled, false);
  assert.equal(result.customerMoneyEnabled, false);
  assert.equal(result.referralEnabled, false);
});
