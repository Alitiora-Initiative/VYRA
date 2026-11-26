# VYRA Forex & CFD Brokerage Product Architecture

**Research cut-off:** 26 November 2026  
**Product decision:** Forex/CFDs are the first brokerage product family. Equities, ETFs, spot crypto and binary options are not part of the initial launch scope. All VYRA customer trading remains paper-only until the contracting entity, permissions, regulated principal, execution, custody/funds, data and operational controls are proven.

## 1. What VYRA is building

VYRA is not trying to become a generic charting front end with a deposit button. The product is a brokerage operating layer for a properly authorised Forex/CFD business:

- **Traderoom:** web/mobile terminal, live provider-sourced bid/ask prices, market/limit/stop orders, watchlists, charts, positions, account statements and transparent costs.
- **CFD contract engine:** provider-specific contract sizes, lot steps, ticks, quote currencies, sessions, financing/swap schedules, corporate-action adjustments and short/long support.
- **Margin and risk engine:** policy-derived leverage, initial/maintenance margin, isolated/cross margin, equity, free margin, margin calls, close-out, negative-balance treatment and exposure limits.
- **Execution/dealing:** documented client-facing execution terms, quote validation, order lifecycle, external liquidity routing/hedging, retained exposure controls, trade surveillance and reconciliations.
- **CRM/back office:** lead-to-client journey, onboarding status, partner/IB management, support, complaints, KYC/AML case references, payment exceptions, dealing/risk incidents, reports and retention.
- **Market-specific release control:** country × client category × instrument × activity × regulated entity × platform × payment provider must pass AccessGraph and Provider Graph evidence gates before any activity is switched on.

The existing cash-only paper ledger is not the CFD engine. It remains intact. The new CFD module starts with a separate contract/quote/policy reference model and deterministic risk calculations. It does not submit orders, move funds, connect a liquidity provider or create a live account.

## 2. CFD asset scope and launch sequence

### First instrument family

Start with a narrow, provider-confirmed list of:
1. Major FX-pair CFDs;
2. Major equity-index CFDs;
3. Gold and a small set of major commodity CFDs;
4. A limited list of highly liquid single-stock CFDs only after corporate-action and market-data controls are verified.

Crypto CFDs, exotic FX, illiquid small-cap share CFDs, options, perpetuals and binary options are excluded from phase one. Their legal, market, liquidity, volatility, custody or consumer-protection characteristics require separate analysis. Do not confuse a CFD with owning the underlying share, ETF, commodity or cryptocurrency.

Every instrument needs a signed-off contract specification: underlying/reference source, contract size, lot min/max/step, tick size/value, quote and margin currencies, trading sessions/timezone, financing/swap long/short, triple-swap day, dividend/corporate-action treatment, spread policy, price-source hierarchy, trading halts, market closure, negative-price/price-limit treatment, short availability, margin tiers and close-only/disable controls. A chart symbol is not a contract specification.

### Launch waves

No country ranking is inferred from the supplied webinar chat. Brazil, Indonesia, Colombia, Philippines and Nigeria are research candidates only; the replay did not include the chart's complete scores, method or underlying evidence. VYRA's first country must be the one with the strongest verified operating readiness, not merely the highest retail search traffic.

Each wave requires the same evidence:
- regulator permission and the exact contracting/servicing entity;
- allowed product/instrument and retail/professional client classification;
- approved marketing and introducer scope;
- KYC document/liveness/PEP/sanctions capability and local language;
- licensed PSP/bank arrangements, local payment methods, currencies, settlement and reversals;
- customer-fund safeguarding/segregation and reconciliation ownership;
- dealing/LP coverage, market-data entitlements and trading sessions;
- support hours, complaint handling, disclosures and tax/reporting;
- tested unit economics from real and attributable data.

## 3. A-Book, B-Book and Hybrid

These are industry descriptions of how the broker manages the market risk created by a client CFD contract. The label alone does not identify the client's legal counterparty, guarantee best execution, prove a liquidity connection or determine regulatory status.

| Model | Risk treatment | Revenue/economics | Required governance and technology |
|---|---|---|---|
| **A-Book / externally hedged flow** | Customer trades are hedged or routed to one or more external liquidity providers, one-to-one or aggregated. The broker may still be the customer's contractual counterparty and retains operational, timing, basis, slippage and LP counterparty risks. | Primarily disclosed spread mark-up and/or commission, minus liquidity, bridge and execution costs. | FIX/API bridge, LP due diligence, quote-source hierarchy, order/hedge correlation IDs, external fills, partial/reject handling, slippage analysis, LP exposure reconciliation and best-execution evidence. |
| **B-Book / internalised exposure** | The broker retains all or part of the customer's CFD exposure as principal rather than offsetting it externally. | Spread/commission plus gains or losses on the broker's retained position. Customer losses can create broker gains, so the conflict is structurally more direct. Client losses are not a safe or guaranteed business plan. | Explicit counterparty terms and conflicts disclosures, independent risk limits, position/exposure aggregation, dealing-desk segregation, price controls, fair execution, surveillance, capital stress tests, kill/close-only controls and independent compliance review. |
| **Hybrid** | Some exposure is externally hedged; some is retained. The policy can use symbol, total net exposure, trade size, LP capacity, liquidity, concentration or approved risk limits. | A combination of spread/commission and retained-book P&L, less external costs. | Versioned rules, approval and change logs, reasons for each hedge decision, retained/hedged exposure reporting, risk-limit triggers, fair-treatment monitoring and complete replayability. |

**VYRA recommendation:** engineer the platform to support a provider-declared A-Book/Hybrid configuration without assuming VYRA is authorised to deal as principal. For a Kenyan research path, examine the CMA non-dealing online FX broker category first because the CMA describes that category as a link to the FX market for commission/spread mark-up without market-making. A-Book is not automatically identical to the legal non-dealing model; the execution contract, client counterparty, risk transfer, customer journey and local counsel opinion must establish the fit. Do not choose B-Book as a loophole or route clients based on individual profitability. If a partner uses Hybrid, require objective exposure/liquidity rules, disclosed conflicts and auditable changes.

VYRA's paper execution model function is a training/test simulation only. Its route labels are not real orders, liquidity connections, broker decisions or execution certification.

## 4. CFD risk and pricing engine requirements

### Order-entry checks

Before an order can be accepted, the server—not the browser—must check:
- customer account, market and product eligibility from the approved rule pack;
- client category, appropriateness assessment and account trading permissions;
- contract enabled state and effective contract version;
- quote source, bid/ask integrity, timestamp/freshness, trading session and stale/dislocated-price checks;
- minimum/maximum lots, lot step, market hours, order type and instrument restrictions;
- leverage and notional tiers from the exact country × client type × instrument policy;
- initial margin, existing reservations, free margin and exposure/position limits;
- user price/quantity confirmation and order idempotency;
- market volatility, price gaps, halts, daily limits and emergency close-only state.

A missing margin policy, stale quote, unknown contract, missing conversion rate or unavailable provider must fail closed. Never silently fall back to 1:100, 1:400, another country's rules or a simulated price.

### Valuation and margin

A minimum model is:

- **Long open:** execute against the ask side; **short open:** execute against the bid side.
- **Long close valuation:** mark against the bid; **short close valuation:** mark against the ask.
- **Notional:** lots × contract size × reference price × currency-conversion rate.
- **Initial margin:** derived from the active notional-tier leverage/margin rule; a basic single-tier approximation is notional divided by permitted leverage.
- **Equity:** cash balance + realised P&L + unrealised P&L + applicable adjustments.
- **Free margin:** equity − used margin − reserved margin.
- **Margin level:** equity / used margin × 100, where used margin is non-zero.
- **Close-out:** triggered using the approved policy threshold; close-out ordering, partial liquidation and spread/slippage handling are separately versioned.

The code now includes deterministic paper calculations for contract validation, quote freshness, buy-at-ask/sell-at-bid, long/short marking, margin snapshots, leverage caps and policy-driven close-out signals. The policy table is empty by design. The engine deliberately requires a policy rather than inventing country leverage.

### Additional calculations needed before partner execution

The next CFD engine phase must add tiered aggregate margin, cross-currency conversion with source and timestamp, financing calendars/rollover, triple-swap day, dividends and corporate actions, partial close, hedged/netted position modes, pending-order reservations, forced liquidation sequencing, negative-balance protection, gap/slippage stress scenarios, trading breaks and daily official statement reconciliation. These calculations must be tested against the selected broker/provider's conformance cases before being used for a customer's account.

## 5. Jurisdiction, licences and the Kenyan starting point

A technology package does not lend VYRA a licence. The actual activities and customer-facing legal entity matter: who contracts with the customer, opens/accounts for them, markets or solicits, assesses appropriateness, receives/transmits instructions, is principal/counterparty, holds or controls client money, handles withdrawals, manages client positions, and pays introducers.

### Kenya findings

The CMA's 2017 Online Foreign Exchange Trading Regulations explicitly define online FX trading to include CFDs on foreign underlyings. They define:
- a dealing online FX broker as a CMA-licensed principal and market maker;
- a non-dealing online FX broker as a CMA-licensed link between the FX market and client earning commission or spread mark-up, without market-making activities;
- the need for the relevant CMA licence before carrying on those brokerage or money-manager businesses.

The 2017 text sets a Kenyan company limited by shares, a fit-and-proper/executive-experience framework, minimum paid-up capital in the original text of KES 50 million (dealing broker), KES 30 million (non-dealing broker) and KES 10 million (money manager), and liquid capital for dealing/non-dealing brokers of KES 30 million or 8% of liabilities, whichever is higher. The online FX money-manager liquid-capital figure in that text is KES 5 million or 8% of liabilities, whichever is higher. The same text requires platform-provider admission evidence, onboarding, AML/KYC, business plans, risk assessments, appropriateness education, dispute handling and service-provider SLAs.

The 2023 Online FX amendment is listed in the CMA regulatory framework and the published amendment text adds an annual fee of 3% of gross trading revenue for both dealing and non-dealing online FX brokers. The exact fee base and treatment of commissions/rebates should be confirmed from the operative legal notice and with CMA counsel. Do not treat the capital/liquid-capital figures above as a final 2026 legal opinion: counsel must reconcile the full amended law, current CMA circulars/checklists and the applicant's precise business model with the CMA before making a financial commitment.

The 2017 Regulations also set an upper leverage ceiling of 400 times the client's deposit, subject to the CMA's express power to revise it by circular. That is a legal ceiling in that text, not a suggested default for VYRA. The same Regulations prohibit Kenya-shilling currency pairs and binary options for online FX brokers. They require written risk disclosure and client agreement before account opening, accurate electronic records preserved for at least seven years, daily client-fund reconciliation, and risk controls for stop loss, no-negative accounts, margin calls and close-out. Client money must be held separately and must not be used for margining, hedging or company assets. The rule text also sets monthly regulatory reporting duties. Verify current CMA circulars and amendments before applying any exact leverage or retention setting.

On 17 November 2026 the CMA announced two additional non-dealing online FX broker licences and described their regulated service as including FX and CFDs, segregated client funds, strong onboarding controls and investor education. The live CMA licensee register should be checked immediately before any introduction, vendor engagement that assumes a principal, or market launch.

**Practical consequence:** VYRA cannot rely on the vendor package statement "no entity required" to conclude that Kenya licensing does not apply. It may be a technical-package statement about the vendor's product/setup, not a CMA legal opinion. The CMA's 2017 rules say the applicant for a broker licence must be a Kenyan company limited by shares. Obtain a written classification opinion for the exact VYRA activity and partner agreement before accepting Kenyan customers or promotion.

## 6. Vendor shortlist and procurement strategy

### Quadcode — first demo because of the webinar

The supplied webinar and public product pages describe a Forex/CFD turnkey package and Back Office with:
- web/mobile traderoom, custom branding, charts, timeframes and market instruments;
- market/limit orders, stop/take-profit controls, leverage, long/short positions, hedging and risk management;
- isolated and cross-margin CFD support on the dedicated CFD package page;
- dealing desk support for A-Book, B-Book and Hybrid models;
- liquidity connections, CRM and Back Office, client/admin/IB management, KYC, anti-fraud and user communication;
- Sales CRM, reporting, chat/call/ticketing, marketing email/push/pop-ups, affiliate CPA/RevShare/SpreadShare/IB modules and billing/PSP connections.

The CFD package page claims 850+ global assets, a 14-day launch, Hybrid A/B execution and 170+ pre-integrated PSPs. Other Quadcode pages use different PSP integration counts (including 100+). The main pricing page displays Basic at 17,500 without a currency marker, Advanced at $37,000 and Full at $50,000, while its FAQ describes a roughly $25,000–$50,000 range. These are not a binding quote and do not establish what is included, the price currency, recurring costs or Kenya availability. Request the actual named-provider list, per-country coverage and a dated itemised quote. The user-supplied page also contained binary-options and prop-trading sections; those are not part of VYRA's Forex/CFD scope. Media logos on a vendor page do not confer market-data, article-republication or news-syndication rights for VYRA.

**Ask Quadcode for a demo using these exact test cases:** open a long and short CFD; show contract specification, bid/ask and financing; show margin calculation at two permitted client categories; test stale price, trading halt, partial fill, LP reject, gap-through-stop and margin close-out; show A-book hedge correlation, B-book exposure and Hybrid rule audit; reconcile a customer execution to LP/bridge records; show a withdrawal reversal and a complaint escalation; export a user's full record and audit history; and show how an affiliate/IB is blocked from unapproved countries.

### Alternative providers

| Provider | Strength | VYRA decision |
|---|---|---|
| **Quadcode** | The nearest match to the webinar requirement: turnkey Forex/CFD terminal, dealing models, CRM/back office, KYC, billing, affiliates and PSP options. | First technical demo, but no commitment until legal, commercial, API, security, hosting, data export and service terms are verified. |
| **Leverate** | Publishes pricing for its own CFD platform and separate CRM/client-portal add-on, and also offers MT4/MT5 services. Its page shows €1,690/month for up to 1,000 real accounts and €2,390/month for CRM/client portal as listed prices at the research cut-off. | Useful price/contract benchmark, not directly comparable with Quadcode until inclusion, liquidity, market data, onboarding and implementation costs are normalised. |
| **B2BROKER** | Modular suite: B2CORE client portal/back office, B2CORE IB, B2TRADER with REST/WebSocket/FIX APIs, and B2CONNECT liquidity FIX connectivity. | Best modular/technical comparison if VYRA wants to keep the traderoom, CRM and liquidity bridge separable. Request restricted API access and conformance details. |
| **Existing MT5 ecosystem** | Mature multi-asset trading platform option with independent CRM, bridges, hosting and LP ecosystem. | Benchmark as an alternative platform stack; compare full licence, hosting, bridge, plugin, data, server, audit and exit dependencies rather than assuming MT5 is included or free. |

### Mandatory provider due diligence

Obtain legal contracting entity, corporate registry, audited financials, ownership, relevant licences and exact permission scope; country/client/product restrictions; named LPs and banks; execution/counterparty structure; market data sources and redistribution rights; quote/order API and signed-webhook documentation; sandbox and production certification; API scopes and rate limits; failover and event replay; hosting regions and sub-processors; encryption and key controls; penetration-test and SOC/ISO/PCI evidence with scope; incident SLA, RTO/RPO and DR tests; staff access roles and MFA; complete audit export; record retention/deletion; data portability and termination assistance; implementation cost, monthly minimums, per-account/per-trade costs and minimum volume; app-store ownership; service/support coverage; and contractual liability allocation.

No "100+ PSPs", "850+ instruments", "two-week launch", "zero extra fees", "no entity required" or conversion/payback statement should be used in the investor deck without a written definition, dated evidence, full exclusions and a contract-backed proof point.

## 7. CRM and back-office design

VYRA's CRM needs to handle a broker's customer lifecycle, not just website enquiries. The current staff-only CRM is the first operations-control layer: leads, country/source/campaign, role-based tasks, partner research, operational cases and append-only audit. It is not yet a full brokerage CRM or a connected Quadcode/B2CORE/FXBO back office.

Target modules:

1. **Sales CRM:** website leads, dedupe, lead owner, consent, call/email/chat history, contact preferences, pipeline and next task.
2. **Onboarding CRM:** partner-issued application reference, KYC/KYB status, missing-document reason, appropriateness status, account type, ageing, escalation and approval/decline reason. Keep raw IDs and documents with the regulated partner by default.
3. **Client 360:** partner account IDs, account status, leverage profile, accepted disclosures, trading permissions, support history and statement links. The regulated partner is the source of truth.
4. **Affiliate/IB partner room:** partner KYB/due diligence, contracts, permitted geos, approved marketing assets, click/lead attribution, duplicate/fraud checks, reversals and authorised commissions. Payout calculation/activation stays disabled until the actual compensation arrangement is legally approved.
5. **Payments desk:** deposit/withdrawal status, PSP transaction reference, settlement, failed/reversed/chargeback exception, reconciliation and owner. Never ask VYRA to collect card/bank credentials or receive client funds.
6. **Dealing/risk desk:** client flow, symbol exposure, LP route/hedge, rejected orders, slippage, stale prices, outages, market close, margin close-out and risk-limit breach. Sensitive queues need dealing/compliance/operations-only access.
7. **Support and complaints:** chat, calls, tickets, complaint category, response clock, escalation, resolution and regulator/partner notification reference.
8. **Retention and analytics:** consent-based educational messages, activation and retention cohorts, product usage, platform friction, inactivity and customer outcomes. Do not use deposit pressure, loss-chasing or bonus abuse to force trading.

### Affiliate and marketing system

The webinar mentions CPA, revenue-share and spread-share payments. VYRA should model the partner agreement, country and channel approvals, campaign creative approval, source attribution and fraud controls first. It must not automatically assume a commission tied to a funded account, trade volume, spread or client loss is lawful in every market. The partner/principal and local counsel must approve the actual activity, compensation, disclosures and tax treatment. Do not pay or activate an affiliate until there is a permitted agreement and the partner has approved the geo and content.

The marketing guide's figures (e.g. typical conversion rates, affiliate budget share and inbound lead savings) are not VYRA benchmarks. Measure real channel cohorts:
- qualified lead cost and eligible lead rate;
- onboarding completion and appropriateness/verification outcome;
- first funded account rate only as a descriptive funnel metric, never as a reason to pressure deposits;
- customer acquisition cost (CAC) using a clearly documented numerator/denominator;
- active and retained clients at 7/30/90 days;
- net spread/commission revenue less LP, payment, data and servicing costs;
- complaints, chargebacks, refunds, suspicious activity and customer outcomes;
- marketing opt-out and affiliate-quality metrics by channel and country.

Do not optimise only for deposits, trading volume, client losses or high leverage. A high-quality brokerage must also measure complaints, churn, rejected unsuitable applications, execution quality and financial resilience.

## 8. Payment, KYC and AML operating model

For every PSP, identify its actual licensed legal entity and regulator, supported countries and currencies, financial-services/CFD acceptance, local payment instruments, acquiring and payout rails, settlement and reserve terms, refund/chargeback handling, fraud/3DS capabilities, data processing, reconciliation events and service levels. A logo or pre-integration count is not permission to use that PSP for every entity, country or product.

The regulated broker/partner controls customer-money accounts and segregation. In the Kenyan 2017 online FX regulations, brokers must maintain strict segregation, open client accounts at a Kenyan licensed bank, reconcile client money daily and not use client funds for margining, hedging or company assets. VYRA CRM should store only opaque PSP/partner references and exception metadata—not card numbers, bank login details or customer funds.

KYC/AML vendor evaluation should cover ID-document coverage, liveness, KYB/beneficial ownership, sanctions/PEP/adverse media, ongoing monitoring, transaction monitoring, case management, false-positive workflows, data location, subcontractors, retention, deletion and partner decision ownership. The broker remains accountable for the regulated decision. VYRA should store the decision reference and status only when allowed.

## 9. Delivery plan

### Phase A — foundation (current feature branch)
- Staff-only CRM and operations case queues.
- CFD contract specification and bid/ask reference schema, disabled by default.
- Evidence-derived margin policy schema with no default country or leverage rule.
- Deterministic CFD paper calculators and tests.
- Operating model, regulator, vendor and procurement documentation.

### Phase B — paper CFD traderoom
- Provider-like test feed explicitly labelled simulated, then a separately verified public market-data feed where redistribution rights exist.
- CFD demo account, long/short positions, contract specifications, P&L, margin, financing, account history and stop/close controls.
- Quote freshness and currency conversion, tiered margin, isolated/cross margin and stress scenarios.
- Test harness for LP rejects, partial fills, gaps, re-quotes and margin events.
- No customer funds or live orders.

### Phase C — partner and vendor integration
- Select the regulated principal and platform/CRM/bridge stack.
- Sandbox-only API adapters; verify authentication, idempotency, event order, replay and reconciliation.
- Signed status webhooks for account/KYC/payment/orders; partner decisions remain authoritative.
- Integrate a named PSP and KYC supplier only under written authorisation and data contracts.
- Daily client-money and trading ledger reconciliation owned by the regulated firm.

### Phase D — launch readiness
- Legal entity, licence, capital, fit-and-proper people, insurance, client-fund banking and regulatory returns.
- Risk, conflicts, best-execution, appropriateness, AML/CTF, complaints, outsourcing, cybersecurity, data protection, BCP/DR and record retention.
- Approved product disclosures, loss warning, terms, execution policy, costs/charges, risk assessment and marketing approvals.
- Independent security test, operational rehearsal and regulator/principal written go/no-go.
- Start with one approved country/product/customer class; expand only after evidenced stability.

## Sources checked

- Quadcode Forex/CFD white-label: https://quadcode.com/white-label-broker
- Quadcode CFD package: https://quadcode.com/cfd-package
- Quadcode Back Office: https://quadcode.com/back-office
- Quadcode trading platform and current pricing FAQ: https://quadcode.com/trading-platform
- Kenya CMA 2017 Online Foreign Exchange Trading Regulations: https://cma.or.ke/wp-content/uploads/2023/03/Capital-Markets-Online-Foreign-Exchange-Trading-Regulations-2017.pdf
- Kenya CMA 2023 Online FX amendment: https://www.cma.or.ke/regulatory-framework/
- Kenya CMA current licence register: https://licensees.cma.or.ke/
- CMA 17 November 2026 licensing announcement: https://www.cma.or.ke/cma-licenses-digital-investment-platforms-a-crowdfunding-platform-operator-and-online-foreign-exchange-brokers/
- ESMA CFD product-intervention reminder, 24 February 2026: https://www.esma.europa.eu/press-news/esma-news/esma-reminds-firms-of-their-obligations-under-cfd-product-intervention-measures
- FCA CFD firm requirements: https://www.fca.org.uk/firms/contract-for-differences
- Leverate pricing: https://leverate.com/pricing/trading-platform/
- B2BROKER product documentation: https://docs.b2broker.com/
