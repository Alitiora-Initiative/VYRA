import test from 'node:test';
import assert from 'node:assert/strict';
import {
  evaluateFinalOutcome,
  parseAgentJson,
  recordHumanAcknowledgement,
  validateAgentReport,
  LAUNCH_GATES,
} from '../src/decision-engine.mjs';

const route = {
  caseId: 'SYNTH-1',
  provider: {
    legalEntityVerified: false,
    licenceEvidenceVerified: false,
    signedAgreement: false,
    sandboxConnected: false,
    productionApproved: false,
  },
  launchGates: Object.fromEntries(LAUNCH_GATES.map((gate) => [gate, false])),
};
const sources = [{ id: 'cma-licensing-checklists' }];

test('parses structured JSON agent responses', () => {
  const report = parseAgentJson('{"status":"review","claims":[]}');
  assert.equal(report.status, 'review');
});

test('fails closed if agent output contains unknown or missing source citations', () => {
  const result = validateAgentReport({
    claims: [
      { claim: 'Claim with known source', sourceIds: ['cma-licensing-checklists'] },
      { claim: 'Claim with invented source', sourceIds: ['fictional-regulator-2026'] },
      { claim: 'Claim without source', sourceIds: [] },
    ],
  }, ['cma-licensing-checklists']);
  assert.equal(result.referencesValid, false);
  assert.equal(result.unsupportedReferences.length, 2);
});

test('all uncompleted launch gates and unverified provider facts block the route', () => {
  const result = evaluateFinalOutcome({
    route,
    reports: { scout: { claims: [] }, analyst: { claims: [] }, auditor: { claims: [] } },
    sources,
  });
  assert.equal(result.status, 'BLOCKED_PENDING_EVIDENCE');
  assert.equal(result.incompleteGates.length, LAUNCH_GATES.length);
  assert.equal(result.actions.liveExecution, false);
  assert.equal(result.actions.customerMoney, false);
});

test('a complete record still requires human legal/compliance go-no-go', () => {
  const completeRoute = {
    ...route,
    provider: {
      legalEntityVerified: true,
      licenceEvidenceVerified: true,
      signedAgreement: true,
      sandboxConnected: true,
      productionApproved: true,
    },
    launchGates: Object.fromEntries(LAUNCH_GATES.map((gate) => [gate, true])),
  };
  const result = evaluateFinalOutcome({
    route: completeRoute,
    reports: { scout: { claims: [] }, analyst: { claims: [] }, auditor: { claims: [] } },
    sources,
  });
  assert.equal(result.status, 'MANUAL_LEGAL_COMPLIANCE_GO_NO_GO_REQUIRED');
  assert.equal(result.actions.liveExecution, false);
  assert.equal(result.actions.accountOpening, false);
});

test('human acknowledgement cannot switch a brokerage action on', () => {
  const outcome = evaluateFinalOutcome({
    route,
    reports: {},
    sources,
  });
  const acknowledged = recordHumanAcknowledgement(outcome, 'acknowledge', 'Synthetic review accepted for internal follow-up.');
  assert.equal(acknowledged.humanAcknowledgement.decision, 'acknowledge');
  assert.equal(acknowledged.actions.liveExecution, false);
  assert.equal(acknowledged.actions.customerMoney, false);
});
