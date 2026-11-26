import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluatePartnerAccess } from '../src/lib/partners/eligibility.mjs';

const gates = {
  legalReviewApproved: true,
  requiredAuthorisationEffective: true,
  partnerAgreementSigned: true,
  partnerCountryApproval: true,
  partnerProductApproval: true,
  marketingApproved: true,
  dataRightsApproved: true,
  operationalReadinessApproved: true,
  productionEnabled: true,
};

const partner = {
  status: 'approved',
  countryCoverageVerifiedForVyra: ['KE'],
  assetClassesApprovedForVyra: ['equity', 'crypto'],
  licenceNumber: 'TEST-LICENCE',
  regulator: 'Test regulator',
  lastVerifiedAt: new Date().toISOString(),
};

const virtualAssetGates = {
  virtualAssetActivityClassified: true,
  virtualAssetRegulatoryRouteApproved: true,
  virtualAssetPartnerScopeConfirmed: true,
  virtualAssetPromotionApproved: true,
};

test('blocks every current research-only partner', () => {
  const result = evaluatePartnerAccess({
    partner: { ...partner, status: 'research_only' },
    country: 'KE',
    assetClass: 'equity',
    gates,
  });
  assert.equal(result.allowed, false);
  assert.ok(result.reasons.some((reason) => reason.includes('not approved')));
});

test('blocks a country without explicit VYRA partner approval', () => {
  const result = evaluatePartnerAccess({
    partner,
    country: 'KE',
    assetClass: 'equity',
    gates: { ...gates, partnerCountryApproval: false },
  });
  assert.equal(result.allowed, false);
  assert.ok(result.reasons.length > 0);
});

test('blocks a product not in the partner approved asset-class allow-list', () => {
  const result = evaluatePartnerAccess({
    partner: { ...partner, assetClassesApprovedForVyra: ['equity'] },
    country: 'KE',
    assetClass: 'crypto',
    gates,
  });
  assert.equal(result.allowed, false);
});

test('blocks incomplete or stale regulatory evidence', () => {
  const result = evaluatePartnerAccess({
    partner: { ...partner, licenceNumber: null, lastVerifiedAt: '2020-01-01T00:00:00.000Z' },
    country: 'KE',
    assetClass: 'equity',
    gates,
  });
  assert.equal(result.allowed, false);
  assert.ok(result.reasons.some((reason) => reason.includes('evidence')));
});

test('requires every legal, operational and production gate to be true', () => {
  const result = evaluatePartnerAccess({
    partner,
    country: 'KE',
    assetClass: 'equity',
    gates: { ...gates, productionEnabled: false },
  });
  assert.equal(result.allowed, false);
  assert.ok(result.reasons.some((reason) => reason.includes('Production access')));
});

test('allows only a fully verified hypothetical equity partner record with all gates', () => {
  const result = evaluatePartnerAccess({
    partner,
    country: 'KE',
    assetClass: 'equity',
    gates,
  });
  assert.deepEqual(result, { allowed: true, reasons: [] });
});

test('blocks crypto access without separate VASP activity and promotion gates', () => {
  const result = evaluatePartnerAccess({
    partner,
    country: 'KE',
    assetClass: 'crypto',
    gates,
  });
  assert.equal(result.allowed, false);
  assert.equal(result.reasons.length, 4);
});

test('blocks crypto access when the virtual-asset activity classification is not complete', () => {
  const result = evaluatePartnerAccess({
    partner,
    country: 'KE',
    assetClass: 'crypto',
    gates: { ...gates, ...virtualAssetGates, virtualAssetActivityClassified: false },
  });
  assert.equal(result.allowed, false);
  assert.ok(result.reasons.some((reason) => reason.includes('separately classified')));
});

test('blocks virtual-asset activity even when a caller labels its asset class differently', () => {
  const result = evaluatePartnerAccess({
    partner,
    country: 'KE',
    assetClass: 'equity',
    activityClass: 'virtual_asset',
    gates,
  });
  assert.equal(result.allowed, false);
  assert.equal(result.reasons.length, 4);
});

test('allows only a hypothetical fully approved crypto arrangement with every separate VASP gate', () => {
  const result = evaluatePartnerAccess({
    partner,
    country: 'KE',
    assetClass: 'crypto',
    activityClass: 'virtual_asset',
    gates: { ...gates, ...virtualAssetGates },
  });
  assert.deepEqual(result, { allowed: true, reasons: [] });
});
