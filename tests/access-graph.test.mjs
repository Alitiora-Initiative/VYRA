import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateAccess, ACCESS_GRAPH_VERSION } from '../src/lib/access-graph/rules.mjs';

const BASELINE_GATES = {
  legalOpinion: true, customerTypeApproval: true, principalIdentified: true, partnerAgreement: true, countryApproval: true,
  productApproval: true, marketingApproval: true, dataRights: true, kycAllocation: true,
  custodyAllocation: true, executionAllocation: true, operationalReadiness: true,
};

test('uses a versioned, date-stamped rule pack', () => {
  const result = evaluateAccess({ country: 'KE', product: 'virtual_asset', activity: 'virtual_asset_service' });
  assert.match(ACCESS_GRAPH_VERSION, /^KE-/);
  assert.equal(result.version, ACCESS_GRAPH_VERSION);
  assert.equal(result.reviewedAt, '2026-11-26');
});

test('unknown jurisdictions fail closed instead of inheriting Kenya rules', () => {
  const result = evaluateAccess({ country: 'US', product: 'securities', activity: 'market_information' });
  assert.equal(result.countryAssessed, false);
  assert.equal(result.regulatorySignal, 'unassessed');
  assert.equal(result.launchStatus, 'blocked_pending_evidence');
  assert.equal(result.customerActionsEnabled, false);
});

test('Kenya virtual-asset services match the 2026 licensing framework', () => {
  const result = evaluateAccess({ country: 'KE', product: 'virtual_asset', activity: 'virtual_asset_service' });
  assert.equal(result.regulatorySignal, 'licensing_framework_applies');
  assert.ok(result.evidence.some((e) => e.id === 'kenya-vasp-regulations'));
  assert.ok(result.explanation.includes('economic benefit/income from Kenya'));
});

test('Kenya virtual-asset promotion is separately mapped', () => {
  const result = evaluateAccess({ country: 'KE', product: 'virtual_asset', activity: 'promote_virtual_asset_service' });
  assert.equal(result.regulatorySignal, 'promotion_compliance_applies');
  assert.ok(result.matchedRules.some((r) => r.id === 'ke-vasp-promotion'));
});

test('Kenya CIS platform journeys surface the ISPP licensing path', () => {
  const result = evaluateAccess({ country: 'KE', product: 'collective_investment', activity: 'operate_cis_platform' });
  assert.equal(result.regulatorySignal, 'ispp_classification_required');
  assert.ok(result.evidence.some((e) => e.id === 'cma-cis-regulations'));
});

test('securities and online-forex activities require exact intermediary classification', () => {
  const securities = evaluateAccess({ country: 'KE', product: 'securities', activity: 'execute_orders' });
  const forex = evaluateAccess({ country: 'KE', product: 'forex', activity: 'online_forex_brokerage' });
  assert.equal(securities.regulatorySignal, 'intermediary_classification_required');
  assert.equal(forex.regulatorySignal, 'online_forex_classification_required');
});

test('information-only is never confused with a permission to trade or refer', () => {
  const result = evaluateAccess({ country: 'KE', product: 'securities', activity: 'market_information' });
  assert.equal(result.regulatorySignal, 'information_only_candidate');
  assert.equal(result.customerActionsEnabled, false);
  assert.equal(result.referralEnabled, false);
  assert.equal(result.liveExecutionEnabled, false);
});

test('a partner name or link does not waive missing launch evidence', () => {
  const result = evaluateAccess({ country: 'KE', product: 'securities', activity: 'partner_referral', gates: {} });
  assert.equal(result.launchStatus, 'blocked_pending_evidence');
  assert.equal(result.missingGates.length, 12);
  assert.equal(result.customerMoneyEnabled, false);
});

test('even a fully completed evidence checklist requires a human go/no-go', () => {
  const result = evaluateAccess({ country: 'KE', product: 'securities', activity: 'execute_orders', gates: BASELINE_GATES });
  assert.equal(result.launchStatus, 'manual_go_no_go_required');
  assert.equal(result.customerActionsEnabled, false);
  assert.equal(result.liveExecutionEnabled, false);
});

test('records investor type but still requires a category-specific legal review', () => {
  const retail = evaluateAccess({ country: 'KE', product: 'securities', customerType: 'retail', activity: 'market_information' });
  const institutional = evaluateAccess({ country: 'KE', product: 'securities', customerType: 'institutional', activity: 'market_information' });
  assert.equal(retail.customerType, 'retail');
  assert.equal(institutional.customerType, 'institutional');
  assert.equal(retail.customerTypeSpecificReviewRequired, true);
  assert.notEqual(retail.launchStatus, 'authorised');
  assert.ok(retail.missingGates.some((gate) => gate.key === 'customerTypeApproval'));
});

test('empty or invalid combinations do not inherit a permissive default', () => {
  const result = evaluateAccess({});
  assert.equal(result.regulatorySignal, 'unassessed');
  assert.equal(result.launchStatus, 'blocked_pending_evidence');
});
