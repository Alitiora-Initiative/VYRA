export const PROVIDER_GRAPH_VERSION = 'PV-2026.11.26.1';

export const PROVIDER_CAPABILITIES = [
  {
    id: 'regulated_principal',
    label: 'Regulated principal / customer account',
    ownerQuestion: 'Which legal entity signs the customer agreement and owns the regulated account relationship?',
    requiredEvidence: ['Legal entity and registration number', 'Current regulator register evidence', 'Licence category and permitted activities', 'Customer-country and investor-category acceptance', 'Signed responsibility matrix'],
  },
  {
    id: 'account_onboarding',
    label: 'Account opening and onboarding',
    ownerQuestion: 'Who collects the application, classifies the customer and makes the final acceptance decision?',
    requiredEvidence: ['Supported onboarding method/API', 'Account ownership and contracting flow', 'Customer eligibility rules', 'Authenticated application status events'],
  },
  {
    id: 'kyc_aml',
    label: 'KYC, AML, sanctions and monitoring',
    ownerQuestion: 'Who owns identity verification, screening decisions, ongoing monitoring and regulatory escalation?',
    requiredEvidence: ['KYC/AML responsibility allocation', 'Screening processor and data-processing terms', 'Country/document coverage', 'Sanctions/PEP case escalation', 'Audit and retention process'],
  },
  {
    id: 'client_assets',
    label: 'Client money, custody and safeguarding',
    ownerQuestion: 'Which authorised institution receives and safeguards customer money or assets?',
    requiredEvidence: ['Named bank/custodian legal entity', 'Segregation and ownership model', 'Withdrawal authority and controls', 'Settlement and reconciliation process', 'Insolvency and safeguarding disclosure'],
  },
  {
    id: 'execution_dealing',
    label: 'Execution, dealing and liquidity',
    ownerQuestion: 'Who accepts, routes, executes, cancels, clears and settles an order?',
    requiredEvidence: ['Executing legal entity and permissions', 'Venue/LP/counterparty list', 'Order lifecycle API and webhooks', 'Execution/markup/commission schedule', 'Best-execution and outage procedures'],
  },
  {
    id: 'market_data',
    label: 'Market data and redistribution rights',
    ownerQuestion: 'Which source provides each quote and what display/redistribution rights are granted?',
    requiredEvidence: ['Provider and exchange source per instrument', 'Live/delayed entitlement', 'Retail/professional display rights', 'Derived data and retention terms', 'Timestamp and outage semantics'],
  },
  {
    id: 'payments',
    label: 'Payments, deposits and withdrawals',
    ownerQuestion: 'Which authorised bank/payment provider processes customer funding and withdrawals?',
    requiredEvidence: ['Payment institution/bank identity and permission', 'Supported jurisdictions and currencies', 'Client-money flow and settlement time', 'Refund/recall and chargeback process', 'Daily reconciliation and failure handling'],
  },
  {
    id: 'reporting_reconciliation',
    label: 'Statements, reporting and reconciliation',
    ownerQuestion: 'Which system is authoritative for cash, positions, orders, fills, fees and statements?',
    requiredEvidence: ['Statement/API data dictionary', 'Signed event/webhook and replay rules', 'Idempotency and sequence handling', 'Daily reconciliation and exception process', 'Correction and audit policy'],
  },
  {
    id: 'customer_support',
    label: 'Customer communications and complaints',
    ownerQuestion: 'Who owns service requests and complaints for each regulated activity?',
    requiredEvidence: ['Named support legal entity', 'Complaint routing and service targets', 'Incident/escalation contacts', 'Secure communications and access controls'],
  },
  {
    id: 'affiliate_promotions',
    label: 'Affiliate, referral and promotions',
    ownerQuestion: 'Who approves each promotion and is referral remuneration allowed in the target market?',
    requiredEvidence: ['Promotion/legal approval', 'Partner appointment and scope', 'Compensation/conflicts approval', 'Accepted affiliate rules and traffic sources', 'Attribution, audit and clawback rules'],
  },
  {
    id: 'mobile_apps',
    label: 'Web, desktop, Android and iOS applications',
    ownerQuestion: 'Who owns the binaries, publisher accounts, user support and release obligations?',
    requiredEvidence: ['App ownership and source/binary rights', 'App-store eligibility and publisher evidence', 'Privacy/data-safety declaration', 'Signing and release process', 'Support and update SLA'],
  },
];

const PARTNERS = [
  { id: 'interactive-brokers', name: 'Interactive Brokers', category: 'brokerage infrastructure research', officialWebsite: 'https://www.interactivebrokers.com/', documentation: 'https://www.interactivebrokers.com/campus/ibkr-api-page/web-api-account-management/' },
  { id: 'saxo', name: 'Saxo', category: 'multi-asset partner research', officialWebsite: 'https://www.home.saxo/', documentation: 'https://www.saxoportal.com/institutional-and-partners/introducing-broker.html' },
  { id: 'alpaca', name: 'Alpaca', category: 'brokerage API research', officialWebsite: 'https://alpaca.markets/', documentation: 'https://docs.alpaca.markets/us/docs/about-broker-api' },
  { id: 'drivewealth', name: 'DriveWealth', category: 'embedded brokerage research', officialWebsite: 'https://www.drivewealth.com/', documentation: 'https://developer.drivewealth.com/apis/docs/intro' },
  { id: 'upvest', name: 'Upvest', category: 'investment API research', officialWebsite: 'https://upvest.co/', documentation: 'https://docs.upvest.co/operating_models' },
];

function initialCapabilityStatus() {
  return {
    status: 'not_verified',
    evidence: [],
    verifiedForVyra: false,
    notes: 'No VYRA contract, approval or production integration is recorded.',
  };
}

export function getProviderGraphSnapshot() {
  return {
    version: PROVIDER_GRAPH_VERSION,
    reviewedAt: '2026-11-26',
    providers: PARTNERS.map((partner) => ({
      ...partner,
      relationshipStatus: 'research_only',
      legalEntityVerified: false,
      licenceEvidenceVerified: false,
      signedAgreement: false,
      approvedCountries: [],
      approvedCustomerTypes: [],
      approvedProducts: [],
      connectedSandbox: false,
      productionApproved: false,
      capabilityStatus: Object.fromEntries(
        PROVIDER_CAPABILITIES.map((capability) => [capability.id, initialCapabilityStatus()])
      ),
    })),
    capabilityRequirements: PROVIDER_CAPABILITIES,
    summary: {
      providersInResearch: PARTNERS.length,
      legalEntitiesVerified: 0,
      signedAgreements: 0,
      sandboxConnections: 0,
      productionApproved: 0,
      capabilitiesVerified: 0,
    },
    invariant: 'A provider's API or marketing page does not establish VYRA eligibility, regulatory permission, custody, execution, client-money authority or a signed agreement.',
  };
}

export function evaluateProviderRoute(input = {}) {
  const snapshot = getProviderGraphSnapshot();
  const provider = snapshot.providers.find((item) => item.id === input.providerId);
  if (!provider) {
    return {
      providerFound: false,
      ready: false,
      status: 'provider_not_in_registry',
      blockers: ['No verified VYRA provider record exists for this provider identifier.'],
      liveExecutionEnabled: false,
      customerMoneyEnabled: false,
      referralEnabled: false,
    };
  }

  const blockers = [];
  if (!provider.legalEntityVerified) blockers.push('Provider legal entity and ownership are not verified.');
  if (!provider.licenceEvidenceVerified) blockers.push('Current regulator register and licence scope are not verified.');
  if (!provider.signedAgreement) blockers.push('No signed VYRA agreement or appointment is recorded.');
  if (!provider.approvedCountries.includes(input.country)) blockers.push('The requested customer country is not approved for VYRA.');
  if (!provider.approvedCustomerTypes.includes(input.customerType)) blockers.push('The requested investor category is not approved for VYRA.');
  if (!provider.approvedProducts.includes(input.product)) blockers.push('The requested product is not approved for VYRA.');
  if (!provider.connectedSandbox) blockers.push('No partner sandbox is connected.');
  if (!provider.productionApproved) blockers.push('Production enablement is not approved.');
  return {
    providerFound: true,
    providerId: provider.id,
    providerName: provider.name,
    ready: blockers.length === 0,
    status: blockers.length ? 'blocked_pending_provider_evidence' : 'manual_go_no_go_required',
    blockers,
    liveExecutionEnabled: false,
    customerMoneyEnabled: false,
    referralEnabled: false,
  };
}
