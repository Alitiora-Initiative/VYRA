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
  assetClassesApprovedForVyra: ['equity'],
  licenceNumber: 'TEST-LICENCE',
  regulator: 'Test regulator',
  lastVerifiedAt: new Date().toISOString(),
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
    partner,
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

test('allows only a fully verified hypothetical partner record with all gates', () => {
  const result = evaluatePartnerAccess({
    partner,
    country: 'KE',
    assetClass: 'equity',
    gates,
  });
  assert.deepEqual(result, { allowed: true, reasons: [] });
});
