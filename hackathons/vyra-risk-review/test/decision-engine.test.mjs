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

function makeValidReports() {
  return {
    'evidence-scout': parseAgentJson(JSON.stringify({
      status: 'review',
      summary: 'The supplied CMA checklist points to separate intermediary categories.',
      claims: [{ claim: 'The CMA lists distinct market-intermediary checklists.', sourceIds: ['cma-licensing-checklists'] }],
      relevantProvisions: [],
      missingEvidence: ['Full regulations and VYRA perimeter opinion'],
      risks: ['Do not infer an exemption from the checklist'],
      recommendedNextSteps: ['Obtain counsel review'],
    })),
    'route-analyst': parseAgentJson(JSON.stringify({
      status: 'review',
      summary: 'The route involves a virtual-asset activity in Kenya.',
      claims: [{ claim: 'The activity requires review under the current framework.', sourceIds: ['cma-licensing-checklists'] }],
      activityClassification: 'licensing_review_required',
      missingEvidence: ['Exact role and partner licence evidence'],
      risks: ['Local targeting and promotion restrictions'],
      recommendedNextSteps: ['Obtain a written classification'],
    })),
    'independent-auditor': parseAgentJson(JSON.stringify({
      status: 'needs_human_review',
      summary: 'The reports use the supplied source register; full source accuracy still requires human review.',
      verifiedClaimIndexes: [0],
      unsupportedClaims: [],
      contradictions: [],
      unverifiedAssumptions: ['No partner licence has been verified'],
      additionalEvidenceNeeded: ['Executed partner agreement'],
      recommendedNextSteps: ['Keep the route blocked'],
    })),
  };
}

test('parses structured JSON and fenced JSON agent responses', () => {
  const report = parseAgentJson('{"status":"review","claims":[]}');
  const fenced = parseAgentJson('```json\n{"status":"review","claims":[]}\n```');
  assert.equal(report.parseStatus, 'parsed');
  assert.equal(fenced.parseStatus, 'parsed');
  assert.equal(fenced.status, 'review');
});

test('marks malformed or non-object agent output as unparsed', () => {
  const report = parseAgentJson('not JSON');
  assert.equal(report.parseStatus, 'unparsed');
  assert.equal(report.status, 'unparsed');
});

test('fails closed if analyst output contains unknown or missing source citations', () => {
  const unknown = parseAgentJson(JSON.stringify({
    status: 'review',
    claims: [{ claim: 'Invented source claim', sourceIds: ['fictional-regulator-2026'] }],
    missingEvidence: [], risks: [], recommendedNextSteps: [],
  }));
  const missing = parseAgentJson(JSON.stringify({
    status: 'review',
    claims: [{ claim: 'No source attached', sourceIds: [] }],
    missingEvidence: [], risks: [], recommendedNextSteps: [],
  }));
  assert.equal(validateAgentReport('evidence-scout', unknown, ['cma-licensing-checklists']).referencesValid, false);
  assert.equal(validateAgentReport('evidence-scout', missing, ['cma-licensing-checklists']).referencesValid, false);
});

test('all uncompleted launch gates and unverified provider facts block the route', () => {
  const result = evaluateFinalOutcome({ route, reports: makeValidReports(), sources });
  assert.equal(result.status, 'BLOCKED_PENDING_EVIDENCE');
  assert.equal(result.incompleteGates.length, LAUNCH_GATES.length);
  assert.equal(result.missingReports.length, 0);
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
  const result = evaluateFinalOutcome({ route: completeRoute, reports: makeValidReports(), sources });
  assert.equal(result.status, 'MANUAL_LEGAL_COMPLIANCE_GO_NO_GO_REQUIRED');
  assert.equal(result.sourceReferencesValid, true);
  assert.equal(result.actions.liveExecution, false);
  assert.equal(result.actions.accountOpening, false);
});

test('missing reviewer reports block an otherwise complete route', () => {
  const completeRoute = {
    ...route,
    provider: { legalEntityVerified: true, licenceEvidenceVerified: true, signedAgreement: true, sandboxConnected: true, productionApproved: true },
    launchGates: Object.fromEntries(LAUNCH_GATES.map((gate) => [gate, true])),
  };
  const result = evaluateFinalOutcome({ route: completeRoute, reports: {}, sources });
  assert.equal(result.status, 'BLOCKED_PENDING_EVIDENCE');
  assert.deepEqual(result.missingReports, ['evidence-scout', 'route-analyst', 'independent-auditor']);
});

test('malformed auditor output cannot be treated as a clean review', () => {
  const reports = makeValidReports();
  reports['independent-auditor'] = parseAgentJson('not JSON');
  const result = evaluateFinalOutcome({ route, reports, sources });
  const auditor = result.reportChecks.find((check) => check.role === 'independent-auditor');
  assert.equal(auditor.referencesValid, false);
  assert.ok(auditor.structuralErrors.length > 0);
  assert.equal(result.status, 'BLOCKED_PENDING_EVIDENCE');
});

test('human acknowledgement cannot switch a brokerage action on', () => {
  const outcome = evaluateFinalOutcome({ route, reports: makeValidReports(), sources });
  const acknowledged = recordHumanAcknowledgement(outcome, 'acknowledge', 'Synthetic review accepted for internal follow-up.');
  assert.equal(acknowledged.humanAcknowledgement.decision, 'acknowledge');
  assert.equal(acknowledged.actions.liveExecution, false);
  assert.equal(acknowledged.actions.customerMoney, false);
});
