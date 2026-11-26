export const ACCESS_GRAPH_VERSION = 'KE-2026.11.26.2';
export const ACCESS_GRAPH_REVIEW_DATE = '2026-11-26';

export const ACCESS_EVIDENCE = [
  {
    id: 'cma-licensing-checklists',
    authority: 'Capital Markets Authority (Kenya)',
    title: 'CMA licensing checklists',
    publishedOrUpdated: 'Updated 15 September 2026',
    url: 'https://www.cma.or.ke/licensing/',
    provisions: ['Broker Dealer', 'Stockbrokers', 'Investment Adviser', 'Intermediary Service Platform Provider', 'Online Forex Brokers'],
    summary: 'The CMA publishes separate licensing checklists for market-intermediary categories. Its page says the checklists are summaries and the underlying regulations are conclusive.',
    use: 'Evidence that a Kenya activity needs category-specific classification; this page is not itself a licence or permission.',
  },
  {
    id: 'cma-cis-regulations',
    authority: 'Parliament of Kenya / Capital Markets Authority',
    title: 'Capital Markets (Collective Investment Schemes) Regulations, 2023',
    publishedOrUpdated: '2023',
    url: 'https://www.parliament.go.ke/sites/default/files/2024-03/Capital%20markets%20regulations%2C%202023%20%28LN%20NO.%20170%20OF%202023%2C%20LN%20NO.%20171%20OF%202023%2C%20LN%20NO.%20172%20OF%202023%20AND%20LN%20NO.%20173%20OF%202023%29-compressed.pdf',
    provisions: ['Regulations 76–77: ISPP licensing and requirements'],
    summary: 'The regulations state that a person shall not operate an intermediary service platform without an ISPP licence, and that marketing and distribution of schemes from multiple fund managers requires CMA approval.',
    use: 'A legal-review trigger for a platform that may facilitate CIS marketing/distribution; counsel must confirm the current consolidated and transitional position.',
  },
  {
    id: 'kenya-vasp-regulations',
    authority: 'National Treasury / CBK / CMA',
    title: 'Virtual Asset Service Providers Regulations, 2026 (Legal Notice 134 of 2026)',
    publishedOrUpdated: 'Gazetted 22 July 2026',
    url: 'https://www.centralbank.go.ke/wp-content/uploads/2026/11/The-Virtual-Asset-Service-Providers-Regulations-2026.pdf',
    provisions: ['Regulation 4: application in or from Kenya', 'Regulation 6: licence application', 'Regulations 123–125: advertising and promotions'],
    summary: 'The regulations apply to persons offering virtual-asset services in or from Kenya. Targeting local consumers or deriving economic benefit/income from Kenya can establish the in/from Kenya connection even without physical presence. Licensing and promotion obligations are activity-specific.',
    use: 'A high-priority rule source for crypto-related brokerage, exchange, custody and promotion activity; exact service category and regulator must be legally classified.',
  },
  {
    id: 'cbk-cma-vasp-notice',
    authority: 'Central Bank of Kenya and Capital Markets Authority',
    title: 'Public notice: gazettement of the VASP Regulations, 2026',
    publishedOrUpdated: '13 November 2026',
    url: 'https://www.centralbank.go.ke/wp-content/uploads/2026/11/CBK-CMA-Public-Notice-Operationalisation-of-the-VASP-Regulations-2026-.pdf',
    provisions: ['VASP Act 2025 and Regulations 2026 operationalisation'],
    summary: 'The joint notice says persons providing or intending to provide virtual-asset services must apply to the relevant regulator under the applicable service category.',
    use: 'Official confirmation that the VASP regime is operational; do not use pre-2026 assumptions about an unregulated crypto gap.',
  },
  {
    id: 'cma-regulatory-sandbox',
    authority: 'Capital Markets Authority (Kenya)',
    title: 'CMA Regulatory Sandbox eligibility',
    publishedOrUpdated: 'Accessed 26 November 2026',
    url: 'https://www.sandbox.cma.or.ke/index.php/who-is-eligible',
    provisions: ['Eligibility and innovation scope'],
    summary: 'The CMA describes eligibility for a Kenyan-incorporated company or a firm licensed by an equivalent securities regulator, intending to offer an innovative solution in Kenya. The page excludes products, services or models already clearly addressed under existing laws.',
    use: 'A supervised testing route to investigate for genuine innovation, not a general licence waiver or a workaround for ordinary regulated activity.',
  },
];

export const ACCESS_COUNTRIES = [
  { code: 'KE', name: 'Kenya', rulePack: ACCESS_GRAPH_VERSION, assessed: true },
  { code: 'GB', name: 'United Kingdom', rulePack: null, assessed: false },
  { code: 'US', name: 'United States', rulePack: null, assessed: false },
  { code: 'EU', name: 'European Union', rulePack: null, assessed: false },
  { code: 'AE', name: 'United Arab Emirates', rulePack: null, assessed: false },
];

export const ACCESS_CUSTOMER_TYPES = [
  { id: 'retail', label: 'Retail investor' },
  { id: 'professional', label: 'Professional investor' },
  { id: 'institutional', label: 'Institutional client' },
];

export const ACCESS_PRODUCTS = [
  { id: 'securities', label: 'Shares / securities' },
  { id: 'collective_investment', label: 'Funds / collective investments' },
  { id: 'forex', label: 'FX / leveraged forex' },
  { id: 'virtual_asset', label: 'Crypto / virtual assets' },
];

export const ACCESS_ACTIVITIES = [
  { id: 'market_information', label: 'Display general market information' },
  { id: 'partner_referral', label: 'Refer / introduce a customer' },
  { id: 'solicit_or_advise', label: 'Solicit, arrange or advise' },
  { id: 'receive_or_transmit_orders', label: 'Receive or transmit orders' },
  { id: 'execute_orders', label: 'Execute / deal as broker' },
  { id: 'hold_customer_assets', label: 'Hold customer money or assets' },
  { id: 'operate_cis_platform', label: 'Operate a fund distribution platform' },
  { id: 'online_forex_brokerage', label: 'Operate an online forex brokerage' },
  { id: 'virtual_asset_service', label: 'Provide a virtual-asset service' },
  { id: 'promote_virtual_asset_service', label: 'Advertise / promote a virtual-asset service' },
];

const RULES = [
  {
    id: 'ke-vasp-activity',
    country: 'KE',
    products: ['virtual_asset'],
    activities: ['virtual_asset_service', 'execute_orders', 'receive_or_transmit_orders', 'hold_customer_assets'],
    signal: 'licensing_framework_applies',
    severity: 'critical',
    title: 'Virtual-asset activity is inside a current licensing framework',
    detail: 'The 2026 Regulations apply to virtual-asset services in or from Kenya. The location test includes actively targeting local consumers or deriving economic benefit/income from Kenya, even without a physical presence. The relevant activity and regulator must be identified before any service is enabled.',
    evidenceIds: ['kenya-vasp-regulations', 'cbk-cma-vasp-notice'],
    requiredReview: ['Classify the exact service against the Act’s permitted activity categories.', 'Confirm whether CBK or CMA is the relevant regulator.', 'Obtain the effective licence or documented partner/outsourcing route for VYRA’s precise role.', 'Obtain counsel review of local targeting, remuneration and cross-border activity.'],
  },
  {
    id: 'ke-vasp-promotion',
    country: 'KE',
    products: ['virtual_asset'],
    activities: ['promote_virtual_asset_service', 'partner_referral', 'solicit_or_advise'],
    signal: 'promotion_compliance_applies',
    severity: 'critical',
    title: 'Virtual-asset advertising and promotion requires a separate control',
    detail: 'Regulations 123–125 address advertising and promotion of virtual-asset services. They also address persons acting on behalf of licensees. A tracking link, affiliate label or overseas hosting choice does not itself remove the need to classify and review the promotion.',
    evidenceIds: ['kenya-vasp-regulations', 'cbk-cma-vasp-notice'],
    requiredReview: ['Identify the advertiser, licensee and any third party acting on its behalf.', 'Have the exact promotion, compensation and audience reviewed.', 'Use accurate, balanced and current risk information.', 'Record approval, versions, channels and withdrawal controls.'],
  },
  {
    id: 'ke-cis-platform',
    country: 'KE',
    products: ['collective_investment'],
    activities: ['operate_cis_platform', 'partner_referral', 'solicit_or_advise', 'receive_or_transmit_orders'],
    signal: 'ispp_classification_required',
    severity: 'high',
    title: 'A fund-distribution platform may require ISPP licensing / approval',
    detail: 'Kenya’s CIS Regulations include an ISPP licensing regime. The statutory text states that a person shall not operate an intermediary service platform without an ISPP licence; multiple-manager CIS distribution also has an approval requirement. The current rule position and VYRA’s exact customer journey require Kenyan counsel and CMA confirmation.',
    evidenceIds: ['cma-licensing-checklists', 'cma-cis-regulations'],
    requiredReview: ['Map whether the proposed product discovery, lead capture, referral, subscription or order flow constitutes operating an ISPP.', 'Review current 2025 general licensing requirements and applicable CIS regulations.', 'Confirm the need for an ISPP licence and any product / multiple-manager approvals.', 'Confirm the written fund-manager agreement and investor-protection responsibilities.'],
  },
  {
    id: 'ke-securities-intermediary',
    country: 'KE',
    products: ['securities'],
    activities: ['solicit_or_advise', 'receive_or_transmit_orders', 'execute_orders', 'hold_customer_assets', 'partner_referral'],
    signal: 'intermediary_classification_required',
    severity: 'high',
    title: 'Securities intermediation must be mapped to the correct CMA category',
    detail: 'The CMA publishes distinct checklists for broker-dealers, stockbrokers, investment advisers, investment banks, custodians and other market intermediaries. The correct category depends on the actual function performed; a software or affiliate label is not a classification.',
    evidenceIds: ['cma-licensing-checklists'],
    requiredReview: ['Describe each customer-facing and back-office activity precisely.', 'Check the current CMA regulations and licensing checklist for the likely category.', 'Confirm whether VYRA is information-only software, an outsourced technology provider, an introducer or a regulated intermediary.', 'Obtain a written perimeter opinion before enabling customer acquisition or order flow.'],
  },
  {
    id: 'ke-online-forex',
    country: 'KE',
    products: ['forex'],
    activities: ['online_forex_brokerage', 'solicit_or_advise', 'receive_or_transmit_orders', 'execute_orders', 'partner_referral'],
    signal: 'online_forex_classification_required',
    severity: 'high',
    title: 'Online forex has a distinct CMA licensing perimeter',
    detail: 'The CMA publishes a separate Online Forex Brokers checklist. Product mechanics such as leverage, CFDs, dealing as principal or routing to another broker matter; VYRA must not infer permission from a generic multi-asset partner label.',
    evidenceIds: ['cma-licensing-checklists'],
    requiredReview: ['Specify whether the product is spot FX, leveraged online forex, CFD or another instrument.', 'Determine whether dealing or non-dealing permissions are implicated.', 'Verify the exact partner entity and licence scope in the CMA register.', 'Obtain written country and customer eligibility for the proposed flow.'],
  },
];

const BASELINE_GATES = [
  ['legalOpinion', 'Activity-specific written legal classification'],
  ['customerTypeApproval', 'Customer / investor classification and eligibility'],
  ['principalIdentified', 'Named regulated principal and responsibility matrix'],
  ['partnerAgreement', 'Executed partner agreement and permitted VYRA role'],
  ['countryApproval', 'Written customer-country approval'],
  ['productApproval', 'Written instrument / product approval'],
  ['marketingApproval', 'Approved financial promotion and referral content'],
  ['dataRights', 'Market-data and data-processing rights'],
  ['kycAllocation', 'KYC / AML / sanctions owner and escalation route'],
  ['custodyAllocation', 'Customer-money and asset custody owner'],
  ['executionAllocation', 'Execution, dealing and complaint owner'],
  ['operationalReadiness', 'Security, incident, support and reconciliation sign-off'],
];

export function evaluateAccess(input = {}) {
  const country = String(input.country ?? '').toUpperCase();
  const product = String(input.product ?? '');
  const customerType = String(input.customerType ?? 'unspecified');
  const activity = String(input.activity ?? '');
  const countryInfo = ACCESS_COUNTRIES.find((entry) => entry.code === country);
  const matchingRules = RULES.filter((rule) =>
    rule.country === country &&
    rule.products.includes(product) &&
    rule.activities.includes(activity)
  );

  let regulatorySignal = 'unassessed';
  let headline = 'Not assessed — keep this market route disabled';
  let explanation = 'VYRA has not completed a verified rule pack for this jurisdiction and activity. The absence of a matched rule is not evidence of permission.';
  let severity = 'critical';

  if (countryInfo?.assessed && activity === 'market_information') {
    regulatorySignal = 'information_only_candidate';
    headline = 'Information-only scope candidate';
    explanation = 'Displaying general information is not a trading permission. Data licences, advertising rules, privacy obligations and the exact wording still need review. No account, referral, order or money movement is enabled by this result.';
    severity = 'medium';
  } else if (matchingRules.length) {
    const priority = ['licensing_framework_applies', 'promotion_compliance_applies', 'ispp_classification_required', 'intermediary_classification_required', 'online_forex_classification_required'];
    const selected = [...matchingRules].sort((a, b) => priority.indexOf(a.signal) - priority.indexOf(b.signal))[0];
    regulatorySignal = selected.signal;
    headline = selected.title;
    explanation = selected.detail;
    severity = selected.severity;
  } else if (countryInfo?.assessed) {
    regulatorySignal = 'legal_review_required';
    headline = 'Activity not mapped — legal review required';
    explanation = 'The Kenya rule pack does not contain a verified rule for this exact combination. VYRA does not infer that the activity is permitted. Add authoritative evidence and obtain legal classification before enabling it.';
    severity = 'high';
  }

  const gates = input.gates ?? {};
  const missingGates = BASELINE_GATES
    .filter(([key]) => gates[key] !== true)
    .map(([key, label]) => ({ key, label }));
  const allGatesComplete = missingGates.length === 0;

  return {
    version: ACCESS_GRAPH_VERSION,
    reviewedAt: ACCESS_GRAPH_REVIEW_DATE,
    country,
    countryAssessed: Boolean(countryInfo?.assessed),
    product,
    customerType,
    customerTypeSpecificReviewRequired: true,
    customerTypeNote: 'The Kenya rule pack does not yet differentiate every requirement by retail, professional and institutional client type. Explicit classification and a customer-category review are required.',
    activity,
    regulatorySignal,
    headline,
    explanation,
    severity,
    matchedRules: matchingRules.map((rule) => ({
      id: rule.id,
      title: rule.title,
      detail: rule.detail,
      evidenceIds: rule.evidenceIds,
      requiredReview: rule.requiredReview,
    })),
    evidence: [...new Set(matchingRules.flatMap((rule) => rule.evidenceIds))]
      .map((id) => ACCESS_EVIDENCE.find((entry) => entry.id === id))
      .filter(Boolean),
    missingGates,
    allGatesComplete,
    launchStatus: allGatesComplete ? 'manual_go_no_go_required' : 'blocked_pending_evidence',
    customerActionsEnabled: false,
    referralEnabled: false,
    liveExecutionEnabled: false,
    customerMoneyEnabled: false,
    message: allGatesComplete
      ? 'All recorded gates are marked complete, but a human legal/compliance go/no-go is still required. This tool cannot grant authorisation.'
      : String(missingGates.length) + ' evidence gates remain incomplete. VYRA customer onboarding, referrals, live execution and money movement remain disabled.',
  };
}

export function getAccessGraphSnapshot() {
  return {
    version: ACCESS_GRAPH_VERSION,
    reviewedAt: ACCESS_GRAPH_REVIEW_DATE,
    jurisdictionCoverage: ACCESS_COUNTRIES,
    products: ACCESS_PRODUCTS,
    customerTypes: ACCESS_CUSTOMER_TYPES,
    activities: ACCESS_ACTIVITIES,
    evidence: ACCESS_EVIDENCE,
    rules: RULES.map(({ id, country, products, activities, signal, severity, title, evidenceIds }) => ({
      id, country, products, activities, signal, severity, title, evidenceIds,
    })),
    launchControls: BASELINE_GATES.map(([key, label]) => ({ key, label, default: false })),
    productionSwitches: {
      customerActionsEnabled: false,
      referralEnabled: false,
      liveExecutionEnabled: false,
      customerMoneyEnabled: false,
    },
  };
}
