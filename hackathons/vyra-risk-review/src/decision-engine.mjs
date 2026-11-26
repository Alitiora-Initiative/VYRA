export const LAUNCH_GATES = [
  'legalOpinion',
  'customerTypeApproval',
  'principalIdentified',
  'partnerAgreement',
  'countryApproval',
  'productApproval',
  'marketingApproval',
  'dataRights',
  'kycAllocation',
  'custodyAllocation',
  'executionAllocation',
  'operationalReadiness',
];

export function extractText(answer) {
  if (typeof answer === 'string') return answer;
  if (!answer || typeof answer !== 'object') return String(answer ?? '');
  if (typeof answer.text === 'string') return answer.text;
  if (typeof answer.content === 'string') return answer.content;
  if (Array.isArray(answer.content)) {
    return answer.content.map((item) => {
      if (typeof item === 'string') return item;
      if (item && typeof item.text === 'string') return item.text;
      return '';
    }).filter(Boolean).join('\n');
  }
  return JSON.stringify(answer);
}

export function parseAgentJson(raw) {
  const text = String(raw ?? '').trim();
  try {
    return JSON.parse(text);
  } catch {
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start >= 0 && end > start) {
      try { return JSON.parse(text.slice(start, end + 1)); } catch { /* use raw fallback */ }
    }
    return {
      status: 'unparsed',
      summary: 'The agent response was not valid JSON. Human review is required.',
      rawText: text,
      claims: [],
      missingEvidence: ['Agent output could not be parsed into the required structured format.'],
      risks: ['Do not treat this response as a decision.'],
      recommendedNextSteps: ['Inspect the raw response and rerun with corrected input.'],
    };
  }
}

export function validateAgentReport(report, allowedSourceIds) {
  const allowed = new Set(allowedSourceIds);
  const claims = Array.isArray(report?.claims) ? report.claims : [];
  const unsupportedReferences = [];
  for (const claim of claims) {
    const sourceIds = Array.isArray(claim?.sourceIds) ? claim.sourceIds : [];
    if (sourceIds.length === 0) {
      unsupportedReferences.push({ claim: String(claim?.claim ?? 'Unspecified claim'), sourceId: null, reason: 'No source ID attached.' });
      continue;
    }
    for (const sourceId of sourceIds) {
      if (!allowed.has(sourceId)) {
        unsupportedReferences.push({ claim: String(claim?.claim ?? 'Unspecified claim'), sourceId, reason: 'Source ID is not in the supplied source register.' });
      }
    }
  }
  return {
    claimCount: claims.length,
    unsupportedReferences,
    referencesValid: unsupportedReferences.length === 0,
  };
}

export function evaluateFinalOutcome({ route, reports, sources }) {
  const sourceIds = (sources ?? []).map((source) => source.id);
  const reportChecks = Object.entries(reports ?? {}).map(([role, report]) => ({
    role,
    ...validateAgentReport(report, sourceIds),
  }));
  const incompleteGates = LAUNCH_GATES.filter((gate) => route?.launchGates?.[gate] !== true);
  const unknownProvider = !route?.provider?.legalEntityVerified ||
    !route?.provider?.licenceEvidenceVerified ||
    !route?.provider?.signedAgreement ||
    !route?.provider?.sandboxConnected ||
    !route?.provider?.productionApproved;
  const allReferencesValid = reportChecks.every((check) => check.referencesValid);
  const status = incompleteGates.length > 0 || unknownProvider || !allReferencesValid
    ? 'BLOCKED_PENDING_EVIDENCE'
    : 'MANUAL_LEGAL_COMPLIANCE_GO_NO_GO_REQUIRED';

  return {
    caseId: route?.caseId ?? 'unknown',
    status,
    policyVersion: 'KE-2026.11.26.2',
    checkedAt: new Date().toISOString(),
    reportChecks,
    incompleteGates,
    providerEvidenceComplete: !unknownProvider,
    sourceReferencesValid: allReferencesValid,
    humanReviewRequired: true,
    actions: {
      accountOpening: false,
      referral: false,
      orderTransmission: false,
      liveExecution: false,
      customerMoney: false,
      custody: false,
      deposit: false,
      withdrawal: false,
    },
    reason: status === 'BLOCKED_PENDING_EVIDENCE'
      ? 'Evidence is incomplete or agent citations failed deterministic source-register validation. No downstream action is enabled.'
      : 'Recorded evidence is complete, but only a human legal/compliance go/no-go can authorise the exact scope. No downstream action is enabled by this tool.',
  };
}

export function recordHumanAcknowledgement(outcome, decision, note = '') {
  if (!['acknowledge', 'reject', 'defer'].includes(decision)) {
    throw new Error('Decision must be acknowledge, reject or defer.');
  }
  return {
    ...outcome,
    humanAcknowledgement: {
      decision,
      note: String(note).slice(0, 500),
      recordedAt: new Date().toISOString(),
      meaning: 'Acknowledgement of this review report only. It is not regulatory approval and does not enable customer or money movement actions.',
    },
    actions: {
      accountOpening: false,
      referral: false,
      orderTransmission: false,
      liveExecution: false,
      customerMoney: false,
      custody: false,
      deposit: false,
      withdrawal: false,
    },
  };
}
