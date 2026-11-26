export const PROVIDER_GRAPH_VERSION: string;
export type ProviderCapability = {
  id: string;
  label: string;
  ownerQuestion: string;
  requiredEvidence: string[];
};
export const PROVIDER_CAPABILITIES: ProviderCapability[];
export function getProviderGraphSnapshot(): {
  version: string;
  reviewedAt: string;
  providers: Array<{
    id: string; name: string; category: string; officialWebsite: string; documentation: string;
    relationshipStatus: 'research_only';
    legalEntityVerified: false; licenceEvidenceVerified: false; signedAgreement: false;
    approvedCountries: string[]; approvedCustomerTypes: string[]; approvedProducts: string[];
    connectedSandbox: false; productionApproved: false;
    capabilityStatus: Record<string, { status: 'not_verified'; evidence: string[]; verifiedForVyra: false; notes: string }>;
  }>;
  capabilityRequirements: ProviderCapability[];
  summary: { providersInResearch: number; legalEntitiesVerified: number; signedAgreements: number; sandboxConnections: number; productionApproved: number; capabilitiesVerified: number };
  invariant: string;
};
export function evaluateProviderRoute(input?: {
  providerId?: string; country?: string; customerType?: string; product?: string;
}): {
  providerFound: boolean; ready: boolean; status: string; blockers: string[];
  providerId?: string; providerName?: string;
  liveExecutionEnabled: false; customerMoneyEnabled: false; referralEnabled: false;
};
