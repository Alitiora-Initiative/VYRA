import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateMarketAccessRoute } from '../src/lib/access-graph/route-gate.mjs';
import { getProviderGraphSnapshot, PROVIDER_ACTIVITY_REQUIREMENTS } from '../src/lib/provider-graph/capabilities.mjs';

const COMPLETE_GATES = {
  legalOpinion: true,
  customerTypeApproval: true,
  principalIdentified: true,
  partnerAgreement: true,
  countryApproval: true,
  productApproval: true,
  marketingApproval: true,
  dataRights: true,
  kycAllocation: true,
  custodyAllocation: true,
  executionAllocation: true,
  operationalReadiness: true,
};

function makeVerifiedGraph(input) {
  const graph = getProviderGraphSnapshot();
  const provider = graph.providers.find((item) => item.id === input.providerId);
  provider.legalEntityVerified = true;
  provider.licenceEvidenceVerified = true;
  provider.signedAgreement = true;
  provider.approvedCountries = [input.country];
  provider.approvedCustomerTypes = [input.customerType];
  provider.approvedProducts = [input.product];
  provider.connectedSandbox = true;
  provider.productionApproved = true;

  for (const capabilityId of PROVIDER_ACTIVITY_REQUIREMENTS[input.activity]) {
    const today = new Date().toISOString().slice(0, 10);
    provider.capabilityStatus[capabilityId] = {
      status: 'verified',
      verifiedForVyra: true,
      evidence: [{
        evidenceId: 'test-' + capabilityId,
        title: 'Synthetic evidence for ' + capabilityId,
        sourceUrl: 'https://evidence.example.test/' + capabilityId,
        verifiedAt: today,
        verifiedBy: 'automated-test-reviewer',
        reverifyBy: '2099-12-31',
      }],
    };
  }
  return graph;
}

test('composite gate joins AccessGraph and Provider Graph and lists blockers from both', () => {
  const result = evaluateMarketAccessRoute({
    country: 'KE',
    customerType: 'retail',
    product: 'securities',
    activity: 'execute_orders',
    providerId: 'interactive-brokers',
  });
  assert.equal(result.status, 'blocked_pending_evidence');
  assert.equal(result.decision, 'deny_route');
  assert.ok(result.blockers.some((item) => item.startsWith('Access Graph:')));
  assert.ok(result.blockers.some((item) => item.startsWith('Provider Graph:')));
  assert.equal(result.graphVersions.access.startsWith('KE-'), true);
  assert.equal(result.graphVersions.provider.startsWith('PV-'), true);
  assert.equal(result.actions.liveExecution, false);
  assert.equal(result.actions.customerMoney, false);
});

test('an unassessed jurisdiction stays blocked even when supplied test evidence is otherwise complete', () => {
  const input = {
    country: 'US',
    customerType: 'retail',
    product: 'securities',
    activity: 'market_information',
    providerId: 'interactive-brokers',
  };
  const result = evaluateMarketAccessRoute(input, {
    gates: COMPLETE_GATES,
    providerGraph: makeVerifiedGraph(input),
  });
  assert.equal(result.access.countryAssessed, false);
  assert.equal(result.status, 'blocked_pending_evidence');
  assert.equal(result.readyForHumanReview, false);
  assert.ok(result.blockers.some((item) => item.includes('no assessed rule pack')));
});

test('a fully evidenced mapped route is escalated to humans but never auto-approved', () => {
  const input = {
    country: 'KE',
    customerType: 'retail',
    product: 'securities',
    activity: 'market_information',
    providerId: 'interactive-brokers',
  };
  const result = evaluateMarketAccessRoute(input, {
    gates: COMPLETE_GATES,
    providerGraph: makeVerifiedGraph(input),
  });
  assert.equal(result.status, 'manual_human_review_required');
  assert.equal(result.decision, 'escalate_for_human_review');
  assert.equal(result.readyForHumanReview, true);
  assert.equal(result.actions.customerOnboarding, false);
  assert.equal(result.actions.referrals, false);
  assert.equal(result.actions.orderTransmission, false);
  assert.equal(result.actions.liveExecution, false);
  assert.equal(result.actions.customerMoney, false);
  assert.equal(result.actions.custody, false);
});

test('caller-supplied approval gates are ignored by the composite evaluator', () => {
  const result = evaluateMarketAccessRoute({
    country: 'KE',
    customerType: 'retail',
    product: 'securities',
    activity: 'market_information',
    providerId: 'interactive-brokers',
    gates: COMPLETE_GATES,
  });
  assert.equal(result.status, 'blocked_pending_evidence');
  assert.equal(result.access.missingGates.length, 12);
  assert.ok(result.blockers.some((item) => item.includes('Activity-specific written legal classification')));
});

test('unmapped activities stay blocked even if all baseline evidence flags are complete', () => {
  const input = {
    country: 'KE',
    customerType: 'retail',
    product: 'securities',
    activity: 'an_activity_not_in_the_rule_pack',
    providerId: 'interactive-brokers',
  };
  const result = evaluateMarketAccessRoute(input, {
    gates: COMPLETE_GATES,
    providerGraph: makeVerifiedGraph({ ...input, activity: 'market_information' }),
  });
  assert.equal(result.status, 'blocked_pending_evidence');
  assert.ok(result.blockers.some((item) => item.includes('exact country, product and activity combination is not mapped')));
});
