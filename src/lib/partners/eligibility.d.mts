import type { PartnerCandidate } from './registry';

export type PartnerAccessGates = {
  legalReviewApproved: boolean;
  requiredAuthorisationEffective: boolean;
  partnerAgreementSigned: boolean;
  partnerCountryApproval: boolean;
  partnerProductApproval: boolean;
  marketingApproved: boolean;
  dataRightsApproved: boolean;
  operationalReadinessApproved: boolean;
  productionEnabled: boolean;
  virtualAssetActivityClassified?: boolean;
  virtualAssetRegulatoryRouteApproved?: boolean;
  virtualAssetPartnerScopeConfirmed?: boolean;
  virtualAssetPromotionApproved?: boolean;
};

export type PartnerAccessInput = {
  partner: PartnerCandidate | null | undefined;
  country: string;
  assetClass: string;
  activityClass?: 'securities' | 'collective_investment' | 'forex' | 'virtual_asset';
  gates: PartnerAccessGates;
};

export type PartnerAccessDecision = {
  allowed: boolean;
  reasons: string[];
};

export function evaluatePartnerAccess(input: PartnerAccessInput): PartnerAccessDecision;
