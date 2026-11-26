# VYRA Markets — Brokerage Technology Vendor Map

**Research cut-off:** 26 November 2026  
**Purpose:** Map the technology and institutional vendors required across the brokerage lifecycle. The listed providers are research candidates only; no contract, eligibility, licence, API access or deployment is confirmed for VYRA.

## 1. The critical architecture rule

A brokerage is not one API. It is a regulated legal entity, customer account model, custody/funds arrangement, execution and clearing stack, product distribution permission, market-data rights, onboarding and financial-crime controls, support and a reconciled record of every asset movement.

The preferred zero-capital approach is **not to assemble VYRA as a substitute custodian, broker, fund manager or payment provider**. Choose one regulated institutional partner that can own the customer relationship, account opening, KYC/AML approval, customer money, custody, trading, clearing, settlement and official statements. VYRA's technology can connect through a partner-approved API/hosted flow and use other suppliers only when the partner confirms that outsourcing is permitted.

No vendor badge, sandbox key, SDK, chart widget, liquidity bridge, white-label CRM or payment gateway lends a licence to VYRA. A vendor can help the regulated institution discharge a task; the legal responsibility remains with the authorised entity according to the law and contract.

## 2. End-to-end vendor layers

| Layer | What it does | Shortlist / examples | VYRA approach |
|---|---|---|---|
| Regulated brokerage / account infrastructure | Legal customer account, onboarding, product permissions, orders, execution, custody/clearing and reporting | Interactive Brokers, Saxo, Alpaca Broker API, DriveWealth, Upvest | Select one partner; ask about Kenya and each intended customer country in writing |
| Kenyan CIS / investment distribution | Approved scheme discovery, distribution, subscription and redemption flows | CMA-licensed ISPP, licensed investment bank, fund manager | Investigate a Kenyan ISPP or fund-manager-led model; do not assume a generic affiliate link is enough |
| Alternative/private fund marketplace | Approved access to private equity, debt, real estate, infrastructure, hedge funds and structured notes for eligible wealth channels | iCapital, CAIS | B2B discovery through an eligible adviser/distributor; no public retail fund funnel |
| Global mutual fund / ETF distribution | Fund universe, dealing, distributor connectivity, data and operations | Allfunds | Explore through an eligible bank, wealth manager or regulated distributor |
| Enterprise wealth platform | Client book, custody, order management, execution, reporting, administration and multi-asset operations | FNZ | Long-term enterprise/technology vendor benchmark; not a zero-cost start-up API |
| Market data and exchange distribution | Authoritative quotes, trades, reference data, entitlements and redistribution rights | Partner's exchange feed; LSEG Data & Analytics; other exchange-authorised vendors | Use partner feed first; get written end-user display and redistribution rights |
| Charting | Candles, indicators, drawings, volume, watchlists and chart interaction | TradingView Lightweight Charts; TradingView Advanced Charts / Trading Platform | Use Lightweight Charts under its open-source licence initially; full TradingView products need correct access/licence |
| Identity / KYC / KYB | ID capture, liveness, document checks, corporate ownership verification | Sumsub, Persona; provider's own KYC supplier | Partner should own the initial KYC flow; VYRA should not ingest raw IDs by default |
| AML / sanctions / PEP screening | Watchlist, PEP, sanctions and adverse-media checks | ComplyAdvantage; partner's screening stack | Partner owns decision, ongoing monitoring and regulatory escalation; vendor output is not a legal conclusion |
| Fraud / account security | Device, session, payment and account-takeover risk | Provider-native fraud controls; assess specialist vendors only with partner | Do not add a separate paid fraud system until the partner requires it |
| Deposits and withdrawals | Bank rails, client-money accounts, payment reconciliation and withdrawals | Regulated broker/custodian/bank payment rails | Customer pays partner directly; VYRA must not receive or pool client money |
| Custody / prime brokerage | Safeguarding securities/cash/crypto, asset segregation, financing and settlement | Regulated broker/custodian appointed by partner | Must be part of the written institutional operating model |
| Fund administration / transfer agency | NAV, subscriptions/redemptions, register, investor reports, fund accounting | Appointed fund administrator and registrar; potential enterprise providers to research after fund model chosen | Fund manager appoints the relevant authorised administrators; VYRA does not calculate official NAV |
| Books, reconciliation and audit | Cash, positions, fills, fees, transfers, actions, statements and balanced accounting | Partner book of record; VYRA's separate audit/reconciliation mirror | Partner's statement and ledger remain authoritative; VYRA uses exception reporting |
| Legal / compliance / audit | Perimeter advice, licence applications, independent controls, statutory audits | Qualified local regulatory counsel, auditor, security assessor | Not replaceable with a software tool; budget must be known before any regulated launch |
| Hosting / database / security | Web app, auth, database, secret management, logs and backups | Render, Netlify, Cloudflare Workers, Supabase (demo only on Free) | Free plans for synthetic paper demo only; production needs supported resilience and contractual controls |

## 2A. Trading-platform supplier capability checklist

Assess any trading-platform supplier against the actual VYRA requirement rather than a bundled marketing label. A supplier may provide some or all of the following modules, but the legal and operational owner of each service must remain explicit.

| Module | Capability requirements | Integration and commercial evidence |
|---|---|---|
| Traderoom / terminal | Multi-asset instrument selector, quote detail, charts, watchlists, order ticket, order status, positions, account history and responsive layouts | Supported instruments and order types, data source and entitlement, supported client apps, UI customisation, accessibility and test environment |
| Dealing / execution | Order routing, validation, fills, rejects, cancels, partial fills, venue and counterparty connectivity | Named executing entity, venues/LPs, order lifecycle events, API/webhooks, idempotency, rate limits, best-execution policy and kill switch |
| Liquidity / pricing | Market depth or quote aggregation, spread/markup rules, symbol mapping and trading session calendars | Liquidity counterparties, price formation, markups, market-data source, execution statistics, outages and volume/commission minimums |
| CRM / sales / support | Customer lifecycle, permissions, secure communications, complaint intake and support case tracking | Data controller/processor roles, user roles, audit export, support SLA, retention, incident and termination |
| KYC / AML | Document and liveness workflows, KYB, sanctions/PEP/adverse media, transaction monitoring and case management | Partner decision owner, processor DPA, geographic coverage, false-positive operations, audit and retention |
| Billing / payments | Fee schedules, payment initiation, deposits, withdrawals, refunds and reconciliation | Bank/PSP legal entity, authorised activities, supported country/currencies, client-money handling, settlement and chargeback terms |
| Reporting / back office | Statements, trade confirmations, client activity, exposure/risk, fee reports and operational/audit exports | Source of truth, export formats, event replay, reconciliation process, data portability and audit access |
| Affiliates | Advertiser offer configuration, eligible country/instrument rules, acceptance records, attributed leads and commission calculations | Promotion approval workflow, disclosures, attribution expiry, fraud and reversal handling, tax/reporting and prohibited traffic policy |
| Mobile / desktop | iOS/Android build, desktop distribution, app signing, store releases and version management | Source/binary ownership, app-store eligibility, SDK inventory, support lifecycle, data declarations and release SLA |

Vendor comparisons must use a 12–36 month total-cost model: implementation/setup, recurring licences, accounts/active-user charges, volume or commission thresholds, liquidity/bridge, market-data, KYC, payment, hosting, support, customisation, mobile releases, data export and termination. No price or feature shown in marketing material is treated as a VYRA quote or proof of regulatory permission.

**VYRA approach:** preserve a provider-neutral adapter boundary. The regulated principal determines which modules and counterparties may be connected; VYRA integrates only the approved interfaces and never treats a technology platform as a broker, custodian, bank or regulator.

## 3. Brokerage and investment rails — candidates

### 3.1 Interactive Brokers

Use cases to explore:
- Introducing Broker relationship.
- Broker/client account-management and hosted application workflows.
- API and reporting for a properly approved partner.
- Hedge Fund Capital Introduction (separate service; not an open referral affiliate programme).

IBKR's official capital-introduction page says its eligible hedge fund users must use IBKR as their principal prime broker and meet stated criteria: at least $3 million AUM and a one-year audited track record, or one year of trading through IBKR. Funds are presented to IBKR customers who are Accredited Investors and Qualified Purchasers. These restrictions are an example of institutional investor qualification; they are not an entitlement for VYRA.

Questions: Kenya entity eligibility; customer country and product acceptance; exact introducer permissions; whether VYRA may provide software to an approved introducer; client account ownership; referral compensation; API, portal and white-label costs; market-data rights and complaints allocation.

### 3.2 Saxo

Use cases to explore: introducing services, institutional/white-label account infrastructure, multi-asset trading and post-trade operations.

Questions: whether an introduction-only model is available to a Kenya-based company; which local licences apply; resident/customer coverage; account and custody legal entity; white-label minimums; fees; data, API and service-level obligations.

### 3.3 Alpaca Broker API

Use cases: API-first brokerage infrastructure for fully disclosed or omnibus partner models.

Questions: exact Kenyan corporate and customer eligibility; regulated entity contracting with the client; account type; supported products in each geography; VYRA licensing/appointment; pricing, minimums, and custody/clearing responsibility. Do not infer Kenya eligibility from a general international availability claim.

### 3.4 DriveWealth

Use cases: embedded brokerage APIs for onboarding, funding, trading, custody, clearing and regulatory reporting.

Questions: legal operating model; eligible local entity and customers; customer account ownership; onboarding data and KYC responsibilities; security/SLA; pricing, volumes, market data and exit terms.

### 3.5 Upvest

Use cases: embedded investment API and operating-model choices. Official docs describe take-provider-licence and bring-own-licence models, plus single-account and omnibus variants.

Questions: country eligibility; licence model; minimum volume/AUM; product/custody scope; commercial terms and responsibility matrix. Keep as future European research unless a suitable market is selected.

## 4. Private markets, hedge funds and fund distribution

### 4.1 iCapital
iCapital describes its Marketplace as connecting wealth managers with alternative investments from asset managers. Its provider page reported 1,358+ asset managers, 60 integrated platform/service partners, 2,644 funds supported and $1.2T+ global platform assets as of 31 July 2026. These are provider-reported figures. It is a high-priority research candidate for alternative investment rails, but VYRA must ask whether any Africa/Kenya-based distributor or technology vendor can participate.

### 4.2 CAIS
CAIS describes an adviser-oriented alternatives platform including private-market funds, hedge funds and structured notes, with pre-trade education and post-trade workflows. Its site describes financial-adviser access rather than an unqualified public retail offer. Ask what adviser registration, investor qualification, country, solicitation and compensation conditions apply.

### 4.3 Allfunds
Allfunds describes fund distribution, dealing and technology for fund houses, banks, wealth managers and institutional distributors. Its public metrics dated 30 September 2026 include €1.97T AUA, more than 900 distributor contracts and more than 200,000 funds and ETFs including alternatives. Explore a route through an existing eligible regulated distributor; do not assume a technology start-up can become a fund distributor without approvals.

### 4.4 FNZ
FNZ describes an enterprise wealth platform integrating client administration, custody, clearing, execution, reporting and multi-asset services. It is a potential enterprise platform/outsourcing benchmark, not a self-serve API intended for an uncapitalised retail start-up.

**Private-fund rule:** every fund needs independent verification of fund legal entity, manager authorisation, fund approval, offering documents, administrator, custodian/trustee, auditor, valuation, liquidity, minimum subscription, fees, investor qualification and jurisdiction. Hedge funds are not interchangeable with retail mutual funds or ETFs. Do not list or solicit subscriptions to funds until the legal distributor and offer process are identified.

## 5. KYC, KYB, AML and financial crime

### Sumsub
Official docs describe verification of users, businesses and transactions with configurable workflows, REST API, WebSDK and MobileSDK, plus AML/transaction-monitoring and Travel Rule functions. It is a potential due-diligence candidate if a future partner asks VYRA to procure identity technology. Confirm country/document coverage, Kenyan IDs, liveness, data location, retention, subcontractors, false-positive operations, support and costs.

### Persona
Persona documents an API supporting identity verification, risk assessment, government ID checks, liveness, inquiries, workflows and webhooks. Its KYC+AML documentation describes ID extraction/verification and watchlist screening. Confirm country coverage, accepted Kenyan identity documents, data handling and integration requirements.

### ComplyAdvantage
Official API documentation describes REST APIs for screening workflows, including access to regional API endpoints. Assess watchlist coverage, PEP/adverse media, sanctions update frequency, false-positive case management, ongoing screening, audit evidence, data transfer and total cost.

**Boundary:** KYC vendors are technology processors, not the regulated decision-maker. The partner should own the acceptance/rejection decision and report/escalation duties unless counsel and the regulator approve another allocation. Avoid building a VYRA KYC upload system before the data controller/processor roles, registration and DPA are established.

## 6. Market data and charts

### Market data
The priority is not simply finding the cheapest price API. It is proving rights to display data to end customers and understanding exchange-specific entitlements. Data contracts must specify:
- live versus delayed price;
- display versus non-display use;
- redistribution to retail or professional users;
- derived-data rights;
- user counts and reporting;
- exchange fees and geographic reach;
- historical data and storage/retention;
- audit and entitlement controls;
- price source and timestamps.

LSEG Data & Analytics describes real-time redistribution feeds, tick history and machine-readable news, which is an example of enterprise-grade distribution. Such products need commercial review and are not assumed affordable. Use the selected broker's data service first where its agreement grants VYRA appropriate display rights. Free development data is not proof of exchange redistribution permission.

### Charting
TradingView documents three distinct choices:
1. **Lightweight Charts** — open-source Apache 2.0 chart library suitable for personal/start-up development subject to the licence; it does not provide market data.
2. **Advanced Charts** — access-controlled library with terms and implementation conditions. Official documentation says it is not redistributable and is obtained through an access request; public/free availability conditions differ from private or paywalled use.
3. **Trading Platform** — broker-oriented charting and trading product with its own licensing fees and broker-backend/datafeed requirements.

VYRA should begin with Lightweight Charts and provider data that VYRA is authorised to display. Never use TradingView website/widget data as execution, order validation or non-display data without the appropriate data rights. A chart cannot make a quote authoritative for a broker order.

## 7. Customer money, payments and custody

The safest first architecture is to avoid selecting a VYRA payment processor at all. The regulated partner should supply the payment rails, customer bank account details, client-money or custody account structure, withdrawal approval and bank reconciliation. A generic e-commerce processor does not automatically support brokerage deposits, investment subscriptions, crypto custody or regulated client money.

The partner due-diligence pack must evidence:
- exact legal entity receiving money/assets;
- bank/custodian or wallet counterparty;
- segregation and safeguarding model;
- customer ownership and beneficial interest;
- reconciliation cadence;
- deposit and withdrawal controls;
- chargebacks/recalls and failed transfers;
- settlement timeline and cut-offs;
- insolvency treatment and applicable compensation scheme;
- sanctions and suspicious activity escalation.

VYRA must not ask a user to deposit to a founder bank account, personal wallet, generic PSP balance or omnibus account controlled by VYRA.

## 8. Security and operating tooling

Minimum tool categories:
- Source control and protected CI: private GitHub, Actions, Dependabot and secret scanning.
- Authentication: Neon Managed Better Auth for the VYRA paper environment; MFA and approved partner SSO/OAuth are required before any partner account-linking or sensitive account access.
- Secrets: host-managed secret vault; separated sandbox and production credentials.
- Logs and observability: structured server logs with PII redaction, host metrics, alerting and trace correlation; assess Sentry/OpenTelemetry as candidates.
- API controls: schema validation, idempotency keys, rate limits, webhook signature verification, replay prevention, key rotation, request tracing.
- Security checks: dependency audit, static analysis, secret scan, penetration test and incident exercises.
- Backups: automated, encrypted, retention-defined, off-account where possible, with tested restoration.
- Reconciliation: daily cash/position/order/fee/event comparisons with discrepancy queue and evidence.
- Customer support: secure complaint intake, provider escalation, ownership, response tracking and records.

The tool must be selected to match the regulated partner and the data/controller model. Do not install more vendors than the operating model requires.

## 9. Suggested minimum viable stack

| Capability | Initial choice | Why |
|---|---|---|
| Front end | Existing Next.js / React | Already in VYRA repository |
| Chart | TradingView Lightweight Charts or current chart components | Open-source chart library; data source kept separate |
| Authentication | Neon Managed Better Auth on the dedicated VYRA project | Paper-demo identity only; verify email OTP/reset/session lifecycle and add the exact hosted origin before deployment |
| Application database | Dedicated Neon Postgres project `vyra-markets` in Frankfurt, with main and `vyra-dev` branches | Neon-native migration applied; Free tier is synthetic/paper only, not a live customer-money book |
| Brokerage | One provider-approved direct/fully-disclosed account relationship | Avoid VYRA holding funds, custody or trading principal risk |
| Fund access | A Kenyan licensed ISPP/fund-manager partner first; alternatives marketplaces only through eligible institution | Fits the bridge hypothesis; investor eligibility and fund approvals remain separate |
| Market data | Partner-provided feed with written display rights | Reduces duplicate commercial data work |
| KYC/AML | Partner's current vendor | Avoid duplicate raw-ID storage and inconsistent decision ownership |
| Payments/custody | Partner's bank/custodian rails | No VYRA client money |
| Hosting | Render/Netlify paper demo; Cloudflare Workers compatibility branch | Current zero-cost development choices, not production |
| Monitoring | Host-native monitoring first | Avoid unnecessary monthly fees |
| Compliance/legal | Qualified local counsel and external assurance | Not replaceable with API products |

## 10. Vendor selection gates

Reject or defer a vendor that:
- cannot name the legal entity contracting and regulated entity responsible;
- does not accept the proposed country/customer/product combination;
- asks VYRA to receive or pool customer funds without the required permission;
- cannot explain custody, clearing, settlement, segregation or insolvency treatment;
- cannot provide a security, privacy, incident and outsourcing due-diligence pack;
- will not agree to appropriate audit, complaint, data and exit provisions;
- has undisclosed market-data or exchange redistribution restrictions;
- requires upfront fees or monthly minimums that the project cannot fund;
- markets returns as guaranteed or encourages misleading promotions.

Every vendor record needs official URL, legal entity, product, regulator/licence if regulated, country eligibility, use case, technical documentation, sandbox availability, security evidence, price/minimums, support/SLA, data rights, integration owner, status, date checked and evidence.

## 11. Primary source links

- iCapital Marketplace: https://marketplace.icapital.com/
- CAIS platform: https://www.caisgroup.com/financial-advisor/cais-platform
- CAIS alternative investments: https://www.caisgroup.com/investment-solutions/alternative-investments
- Allfunds fund houses: https://allfunds.com/en/fund-houses/
- Allfunds about: https://allfunds.com/en/about
- FNZ wealth platform: https://www.fnz.com/wealth-platform
- IBKR Hedge Fund Capital Introduction: https://portal.interactivebrokers.com/en/accounts/hedge-fund-onboarding.php
- Sumsub overview: https://docs.sumsub.com/docs/overview
- Persona API introduction: https://docs.withpersona.com/api-introduction
- ComplyAdvantage API: https://docs.complyadvantage.com/api-docs
- TradingView Advanced Charts quick start: https://www.tradingview.com/charting-library-docs/latest/quick-start/
- TradingView Advanced Charts introduction: https://www.tradingview.com/charting-library-docs/latest/introduction/
- TradingView free charting libraries: https://www.tradingview.com/free-charting-libraries/
- LSEG market data redistribution: https://www.lseg.com/en/data-analytics/market-data/data-redistribution

**Evidence limits:** Provider capability pages and scale metrics are provider-published claims, not independently audited by VYRA. None confirms VYRA eligibility. Pricing, licence requirements, countries, investor types and commercial rights require direct written confirmation. A product's availability on a provider page does not establish its lawful availability to a Kenyan retail user.
