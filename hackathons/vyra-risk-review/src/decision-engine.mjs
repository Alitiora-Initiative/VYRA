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
  const fallback = () => ({
    parseStatus: 'unparsed',
    status: 'unparsed',
    summary: 'The agent response was not valid JSON. Human review is required.',
    rawText: text,
    claims: [],
    missingEvidence: ['Agent output could not be parsed into the required structured format.'],
    risks: ['Do not treat this response as a decision.'],
    recommendedNextSteps: ['Inspect the raw response and rerun with corrected input.'],
  });
  try {
    const parsed = JSON.parse(text);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return fallback();
    return { ...parsed, parseStatus: 'parsed' };
  } catch {
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start >= 0 && end > start) {
      try {
        const parsed = JSON.parse(text.slice(start, end + 1));
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
          return { ...parsed, parseStatus: 'parsed' };
        }
      } catch { /* use raw fallback */ }
    }
    return fallback();
  }
}

export function validateAgentReport(role, report, allowedSourceIds) {
  const allowed = new Set(allowedSourceIds);
  const claims = Array.isArray(report?.claims) ? report.claims : [];
  const unsupportedReferences = [];
  const structuralErrors = [];

  if (!report || typeof report !== 'object') {
    structuralErrors.push('Report is missing or not an object.');
  } else if (report.parseStatus !== 'parsed') {
    structuralErrors.push('Agent output was not parsed as valid JSON.');
  } else if (typeof report.status !== 'string' || !report.status.trim()) {
    structuralErrors.push('Agent report has no status field.');
  }

  if (role === 'independent-auditor') {
    for (const field of ['unsupportedClaims', 'contradictions', 'unverifiedAssumptions', 'additionalEvidenceNeeded', 'recommendedNextSteps']) {
      if (!Array.isArray(report?.[field])) structuralErrors.push('Auditor report is missing array: ' + field);
    }
  } else {
    for (const field of ['claims', 'missingEvidence', 'risks', 'recommendedNextSteps']) {
      if (!Array.isArray(report?.[field])) structuralErrors.push('Analyst report is missing array: ' + field);
    }
    if (claims.length === 0) structuralErrors.push('Analyst report contains no source-backed claims.');
  }

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
    role,
    claimCount: claims.length,
    structuralErrors,
    unsupportedReferences,
    referencesValid: structuralErrors.length === 0 && unsupportedReferences.length === 0,
  };
}

export function evaluateFinalOutcome({ route, reports, sources }) {
  const sourceIds = (sources ?? []).map((source) => source.id);
  const requiredRoles = ['evidence-scout', 'route-analyst', 'independent-auditor'];
  const missingReports = requiredRoles.filter((role) => !reports?.[role]);
  const reportChecks = requiredRoles.map((role) => validateAgentReport(role, reports?.[role], sourceIds));
  const incompleteGates = LAUNCH_GATES.filter((gate) => route?.launchGates?.[gate] !== true);
  const unknownProvider = !route?.provider?.legalEntityVerified ||
    !route?.provider?.licenceEvidenceVerified ||
    !route?.provider?.signedAgreement ||
    !route?.provider?.sandboxConnected ||
    !route?.provider?.productionApproved;
  const allReportsValid = reportChecks.every((check) => check.referencesValid);
  const blocked = incompleteGates.length > 0 || unknownProvider || missingReports.length > 0 || !allReportsValid;
  const status = blocked
    ? 'BLOCKED_PENDING_EVIDENCE'
    : 'MANUAL_LEGAL_COMPLIANCE_GO_NO_GO_REQUIRED';

  return {
    caseId: route?.caseId ?? 'unknown',
    status,
    policyVersion: 'KE-2026.11.26.2',
    checkedAt: new Date().toISOString(),
    reportChecks,
    missingReports,
    incompleteGates,
    providerEvidenceComplete: !unknownProvider,
    sourceReferencesValid: allReportsValid && missingReports.length === 0,
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
    reason: blocked
      ? 'Evidence gates, provider facts or required agent reports are incomplete or failed deterministic validation. No downstream action is enabled.'
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
