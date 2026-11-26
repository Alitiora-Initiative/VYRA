import { ACCESS_GRAPH_VERSION, evaluateAccess } from './rules.mjs';
import { PROVIDER_GRAPH_VERSION, evaluateProviderRoute } from '../provider-graph/capabilities.mjs';

export const COMPOSITE_ROUTE_GATE_VERSION = 'RG-2026.11.26.1';

export function evaluateMarketAccessRoute(input = {}, dependencies = {}) {
  const access = evaluateAccess({
    country: input.country,
    customerType: input.customerType,
    product: input.product,
    activity: input.activity,
    gates: dependencies.gates ?? {},
  });
  const provider = evaluateProviderRoute(input, dependencies.providerGraph);
  const blockers = [];

  if (!access.countryAssessed) {
    blockers.push('Access Graph: this jurisdiction has no assessed rule pack.');
  }
  if (access.regulatorySignal === 'unassessed' || access.regulatorySignal === 'legal_review_required') {
    blockers.push('Access Graph: this exact country, product and activity combination is not mapped to a reviewed rule.');
  }
  for (const gate of access.missingGates) {
    blockers.push('Access Graph: ' + gate.label + ' is incomplete.');
  }
  if (!provider.providerFound) {
    blockers.push('Provider Graph: the selected provider is not in the VYRA research register.');
  } else {
    for (const blocker of provider.blockers) blockers.push('Provider Graph: ' + blocker);
  }

  const readyForHumanReview = blockers.length === 0 &&
    access.launchStatus === 'manual_go_no_go_required' &&
    provider.ready;

  return {
    version: COMPOSITE_ROUTE_GATE_VERSION,
    status: readyForHumanReview ? 'manual_human_review_required' : 'blocked_pending_evidence',
    decision: readyForHumanReview ? 'escalate_for_human_review' : 'deny_route',
    readyForHumanReview,
    route: {
      country: access.country,
      customerType: access.customerType,
      product: access.product,
      activity: access.activity,
      providerId: input.providerId ?? null,
    },
    graphVersions: {
      access: ACCESS_GRAPH_VERSION,
      provider: PROVIDER_GRAPH_VERSION,
    },
    access: {
      regulatorySignal: access.regulatorySignal,
      headline: access.headline,
      launchStatus: access.launchStatus,
      countryAssessed: access.countryAssessed,
      matchedRuleIds: access.matchedRules.map((rule) => rule.id),
      matchedEvidenceIds: access.evidence.map((item) => item.id),
      missingGates: access.missingGates,
    },
    provider: {
      providerFound: provider.providerFound,
      providerId: provider.providerId ?? input.providerId ?? null,
      providerName: provider.providerName ?? null,
      status: provider.status,
      requiredCapabilities: provider.requiredCapabilities,
      missingCapabilities: provider.missingCapabilities,
    },
    blockers,
    actions: {
      customerOnboarding: false,
      referrals: false,
      orderTransmission: false,
      liveExecution: false,
      customerMoney: false,
      accountOpening: false,
      custody: false,
    },
    notice: 'This composite evidence gate is not legal advice, partner approval or regulatory authorisation. A clear evidence review can only be escalated to accountable humans; it never enables customer or live-trading actions.',
  };
}
