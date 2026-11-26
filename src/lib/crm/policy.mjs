export const CRM_ROLES = Object.freeze([
  'admin', 'sales', 'compliance', 'support', 'finance', 'dealing',
  'operations', 'partner_manager', 'read_only',
]);

export const LEAD_STAGES = Object.freeze([
  'new', 'contacted', 'qualified', 'eligibility_review',
  'partner_handoff_pending_approval', 'partner_onboarding', 'partner_confirmed', 'lost',
]);

export const CASE_CATEGORIES = Object.freeze([
  'kyc_review', 'aml_review', 'fraud_review', 'payment_exception', 'dealing_risk',
  'reconciliation', 'customer_support', 'complaint', 'partner_incident',
]);

const CASE_ROLES = Object.freeze({
  kyc_review: ['admin', 'compliance', 'operations'],
  aml_review: ['admin', 'compliance', 'operations'],
  fraud_review: ['admin', 'compliance', 'operations'],
  payment_exception: ['admin', 'finance', 'operations'],
  dealing_risk: ['admin', 'dealing', 'operations'],
  reconciliation: ['admin', 'finance', 'operations'],
  customer_support: ['admin', 'support', 'operations'],
  complaint: ['admin', 'support', 'compliance', 'operations'],
  partner_incident: ['admin', 'partner_manager', 'operations'],
});

export function canCreateLead(role) {
  return role === 'admin' || role === 'sales';
}

export function canManagePartners(role) {
  return role === 'admin' || role === 'partner_manager';
}

export function canAccessCase(role, category) {
  return CASE_ROLES[category]?.includes(role) ?? false;
}

export function canCreateTask(role) {
  return ['admin', 'sales', 'support', 'compliance', 'operations'].includes(role);
}

export function canChangeLeadStage(role, stage) {
  if (!LEAD_STAGES.includes(stage)) return false;
  if (!canCreateLead(role)) return false;
  // A staff edit cannot mark a lead as onboarding or an approved client.
  // Those stages require a future verified partner-event workflow.
  return !['partner_onboarding', 'partner_confirmed'].includes(stage);
}

export function canUpdateTask(role, assignedTo, actorId) {
  return assignedTo === actorId || role === 'admin' || role === 'operations';
}

export function isSafeCrmText(value, max = 600) {
  return typeof value === 'string' && value.trim().length > 0 && value.length <= max;
}
