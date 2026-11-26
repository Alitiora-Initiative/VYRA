const REQUIRED_GATES = [
  ['legalReviewApproved', 'A written legal review has not approved this activity.'],
  ['requiredAuthorisationEffective', 'Required licence, registration, approval or principal appointment is not effective.'],
  ['partnerAgreementSigned', 'The relevant partner agreement is not signed.'],
  ['partnerCountryApproval', 'The partner has not approved this customer country.'],
  ['partnerProductApproval', 'The partner has not approved this product or asset class.'],
  ['marketingApproved', 'The partner and compliance owner have not approved the customer-facing promotion.'],
  ['dataRightsApproved', 'Data protection and market-data rights have not been approved.'],
  ['operationalReadinessApproved', 'Security, support, reconciliation and incident controls are not signed off.'],
  ['productionEnabled', 'Production access has not been explicitly enabled.'],
];

export function evaluatePartnerAccess(input) {
  const reasons = [];
  const partner = input?.partner;
  if (!partner || typeof partner !== 'object') {
    return { allowed: false, reasons: ['Partner record is missing.'] };
  }

  if (partner.status !== 'approved') {
    reasons.push('Partner status is not approved.');
  }

  if (partner.countryCoverageVerifiedForVyra?.includes(input.country) !== true) {
    reasons.push('The partner has no verified VYRA approval for this country.');
  }

  if (partner.assetClassesApprovedForVyra?.includes(input.assetClass) !== true) {
    reasons.push('The partner has no verified VYRA approval for this asset class.');
  }

  if (!partner.licenceNumber || !partner.regulator || !partner.lastVerifiedAt) {
    reasons.push('Current regulatory evidence is incomplete.');
  } else {
    const verifiedAt = Date.parse(partner.lastVerifiedAt);
    const ageMs = Date.now() - verifiedAt;
    if (!Number.isFinite(verifiedAt) || ageMs < 0 || ageMs > 30 * 24 * 60 * 60 * 1000) {
      reasons.push('Regulatory evidence is missing, future-dated or older than 30 days.');
    }
  }

  for (const [key, message] of REQUIRED_GATES) {
    if (input?.gates?.[key] !== true) reasons.push(message);
  }

  return { allowed: reasons.length === 0, reasons };
}
