export const ACCESS_GRAPH_VERSION: string;
export const ACCESS_GRAPH_REVIEW_DATE: string;
export type AccessCountry = { code: string; name: string; rulePack: string | null; assessed: boolean };
export type AccessOption = { id: string; label: string };
export type AccessEvidence = { id: string; authority: string; title: string; publishedOrUpdated: string; url: string; provisions: string[]; summary: string; use: string };
export const ACCESS_EVIDENCE: AccessEvidence[];
export const ACCESS_COUNTRIES: AccessCountry[];
export const ACCESS_PRODUCTS: AccessOption[];
export const ACCESS_ACTIVITIES: AccessOption[];
export type AccessDecisionInput = { country?: string; product?: string; activity?: string; gates?: Record<string, boolean> };
export type AccessDecision = {
  version: string; reviewedAt: string; country: string; countryAssessed: boolean; product: string; activity: string;
  regulatorySignal: string; headline: string; explanation: string; severity: 'critical' | 'high' | 'medium';
  matchedRules: Array<{ id: string; title: string; detail: string; evidenceIds: string[]; requiredReview: string[] }>;
  evidence: AccessEvidence[]; missingGates: Array<{ key: string; label: string }>; allGatesComplete: boolean;
  launchStatus: 'manual_go_no_go_required' | 'blocked_pending_evidence';
  customerActionsEnabled: false; referralEnabled: false; liveExecutionEnabled: false; customerMoneyEnabled: false; message: string;
};
export function evaluateAccess(input?: AccessDecisionInput): AccessDecision;
export function getAccessGraphSnapshot(): {
  version: string; reviewedAt: string; jurisdictionCoverage: AccessCountry[]; products: AccessOption[]; activities: AccessOption[];
  evidence: AccessEvidence[]; rules: Array<{ id: string; country: string; products: string[]; activities: string[]; signal: string; severity: string; title: string; evidenceIds: string[] }>;
  launchControls: Array<{ key: string; label: string; default: boolean }>;
  productionSwitches: { customerActionsEnabled: false; referralEnabled: false; liveExecutionEnabled: false; customerMoneyEnabled: false };
};
