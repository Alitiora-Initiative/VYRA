import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateProviderRoute, getProviderGraphSnapshot } from '../src/lib/provider-graph/capabilities.mjs';

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

test('requires legal entity, licence, agreement, country, client type, product and sandbox evidence', () => {
  const result = evaluateProviderRoute({
    providerId: 'interactive-brokers',
    country: 'KE',
    customerType: 'retail',
    product: 'securities',
  });
  assert.equal(result.ready, false);
  assert.equal(result.status, 'blocked_pending_provider_evidence');
  assert.equal(result.blockers.length, 8);
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
  });
  assert.equal(result.providerFound, false);
  assert.equal(result.ready, false);
  assert.equal(result.status, 'provider_not_in_registry');
});
