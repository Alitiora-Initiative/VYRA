export type PartnerReviewStatus = 'research_only' | 'due_diligence' | 'approved' | 'suspended';

export type PartnerCandidate = {
  id: string;
  name: string;
  category: 'brokerage_infrastructure' | 'multi_asset_introducer' | 'investment_api';
  status: PartnerReviewStatus;
  officialWebsite: string;
  officialDocumentation: string;
  countryCoverageVerifiedForVyra: string[];
  assetClassesApprovedForVyra: string[];
  licenceNumber: string | null;
  regulator: string | null;
  lastVerifiedAt: string | null;
  notes: string[];
};

const candidates: PartnerCandidate[] = [
  {
    id: 'interactive-brokers',
    name: 'Interactive Brokers',
    category: 'multi_asset_introducer',
    status: 'research_only',
    officialWebsite: 'https://www.interactivebrokers.com/',
    officialDocumentation: 'https://www.interactivebrokers.com/campus/ibkr-api-page/web-api-account-management/',
    countryCoverageVerifiedForVyra: [],
    assetClassesApprovedForVyra: [],
    licenceNumber: null,
    regulator: null,
    lastVerifiedAt: null,
    notes: [
      'Research candidate for introducing-broker and account-management workflows.',
      'No VYRA appointment, account, country eligibility or API connection is confirmed.',
    ],
  },
  {
    id: 'saxo',
    name: 'Saxo',
    category: 'multi_asset_introducer',
    status: 'research_only',
    officialWebsite: 'https://www.home.saxo/',
    officialDocumentation: 'https://www.saxoportal.com/institutional-and-partners/introducing-broker.html',
    countryCoverageVerifiedForVyra: [],
    assetClassesApprovedForVyra: [],
    licenceNumber: null,
    regulator: null,
    lastVerifiedAt: null,
    notes: [
      'Research candidate for institutional, introducing-broker and white-label models.',
      'No VYRA appointment, account, country eligibility or API connection is confirmed.',
    ],
  },
  {
    id: 'alpaca',
    name: 'Alpaca',
    category: 'brokerage_infrastructure',
    status: 'research_only',
    officialWebsite: 'https://alpaca.markets/',
    officialDocumentation: 'https://docs.alpaca.markets/us/docs/about-broker-api',
    countryCoverageVerifiedForVyra: [],
    assetClassesApprovedForVyra: [],
    licenceNumber: null,
    regulator: null,
    lastVerifiedAt: null,
    notes: [
      'Research candidate for API-first brokerage infrastructure.',
      'Provider marketing about geographic reach is not proof of Kenya eligibility for VYRA.',
    ],
  },
  {
    id: 'drivewealth',
    name: 'DriveWealth',
    category: 'brokerage_infrastructure',
    status: 'research_only',
    officialWebsite: 'https://www.drivewealth.com/',
    officialDocumentation: 'https://developer.drivewealth.com/apis/docs/intro',
    countryCoverageVerifiedForVyra: [],
    assetClassesApprovedForVyra: [],
    licenceNumber: null,
    regulator: null,
    lastVerifiedAt: null,
    notes: [
      'Research candidate for API-based account opening, funding and brokerage services.',
      'No VYRA contract, customer-country approval or production API access is confirmed.',
    ],
  },
  {
    id: 'upvest',
    name: 'Upvest',
    category: 'investment_api',
    status: 'research_only',
    officialWebsite: 'https://upvest.co/',
    officialDocumentation: 'https://docs.upvest.co/operating_models',
    countryCoverageVerifiedForVyra: [],
    assetClassesApprovedForVyra: [],
    licenceNumber: null,
    regulator: null,
    lastVerifiedAt: null,
    notes: [
      'Research candidate for embedded investment infrastructure and operating-model comparison.',
      'No VYRA contract or Kenyan entity/customer eligibility is confirmed.',
    ],
  },
];

export function listPartnerCandidates(): PartnerCandidate[] {
  return candidates.map((candidate) => ({
    ...candidate,
    countryCoverageVerifiedForVyra: [...candidate.countryCoverageVerifiedForVyra],
    assetClassesApprovedForVyra: [...candidate.assetClassesApprovedForVyra],
    notes: [...candidate.notes],
  }));
}

export function getPartnerCandidate(id: string): PartnerCandidate | undefined {
  const candidate = candidates.find((entry) => entry.id === id);
  return candidate ? {
    ...candidate,
    countryCoverageVerifiedForVyra: [...candidate.countryCoverageVerifiedForVyra],
    assetClassesApprovedForVyra: [...candidate.assetClassesApprovedForVyra],
    notes: [...candidate.notes],
  } : undefined;
}
