# VYRA Markets — Provider Brokerage Launch Checklist

**Review date:** 26 November 2026  
**Purpose:** Convert the supplied brokerage-provider launch checklist into a VYRA-specific delivery and evidence register.  
**Operating constraint:** VYRA is a prototype-stage software project. It is not a licensed broker, custodian, exchange, investment adviser, VASP, payment institution or fund distributor. Live execution, deposits, withdrawals and customer-money handling remain disabled.

## What this provider checklist assumes

The supplied checklist appears to describe a turnkey brokerage / white-label / broker-as-a-service arrangement. Its provider is expected to supply or approve the trading platform, dealing, liquidity, KYC, AML, billing, payments, customer support, legal documentation, mobile apps and affiliate programme. Those functions cannot be made real by adding screens to VYRA. Each must have a named legal owner, a signed contract, a technical interface, a country/product permission and an operational evidence trail.

VYRA's current intended route remains **partner-led market access**: the licensed partner owns the brokerage account, onboarding and KYC decisions, client money, custody, order execution, clearing, settlement and regulated customer relationship. VYRA supplies software and only those discovery, hand-off or data-viewing functions expressly permitted by counsel and the partner. No such partner is yet signed.

## Current verified VYRA baseline

| Area | Current position | Launch status |
|---|---|---|
| App | Responsive Next.js web app; dashboard, quotes, paper account, positions, paper orders and ledger | Prototype only |
| Database | Dedicated Neon Postgres, Frankfurt, VYRA main branch; Neon Managed Better Auth and Data API | Provisioned for paper/sandbox use |
| Risk engine | Server-side paper-order checks, quote-age checks, idempotency and paper ledger | Paper use only |
| Market data | CoinGecko crypto snapshots and Twelve Data adapter for equities, FX and commodities | Development feeds; commercial redistribution rights not evidenced |
| Access control / policy | AccessGraph v1.1: versioned Kenya country × customer type × product × activity rules with primary-source links and twelve default-deny release gates | Kenya scoped rule pack only; UK/US/EU/UAE unassessed; not legal advice or production authorisation |
| Partners | IBKR, Saxo, Alpaca, DriveWealth, Upvest and institutional platforms are research candidates | No appointment or contract |
| Countries | No country/product/customer-type combination is approved for VYRA | Default deny |
| Funding and withdrawals | No payment rails or client-money accounts | Not implemented |
| KYC/AML | No VYRA identity verification or transaction monitoring service | Must be owned by licensed partner initially |
| Dealing / liquidity | No broker order route, execution venue or liquidity agreement | Not implemented; live execution locked |
| Legal policies | No provider-issued AML, payment, terms, execution, privacy or fees PDFs supplied | Not published |
| Affiliates | Partner eligibility controls exist; affiliate offer, attribution, commissions and payout system are not active | Disabled pending written promotion and remuneration approval |
| Mobile apps | No native Android/iOS app; web UI is responsive | Web only; app store submission not ready |
| Brand | VYRA Markets name and dark/green visual system already in app | Domain and final brand/legal ownership not verified |
| Email | Neon Auth email/password configured; email delivery and password recovery must be end-to-end tested | Not certified |
| Social and analytics | No verified VYRA social URLs or GTM container ID recorded | Not connected |

## Step 1 — Select a provider and pass due diligence

Do not select a provider because its sales page says “white label” or “global.” Obtain written answers for the exact VYRA legal entity, target residents and products.

### First distinguish two different provider roles

The reference uses “choose a provider” broadly. VYRA must separate a technology supplier from the regulated principal and from execution, custody, payment, data and compliance providers. One group may offer several modules, but each regulated responsibility must still be verified.

That is not automatically the **regulated brokerage principal**. VYRA still needs a named legal entity that is authorised for the exact country, customer type and product, and that legally owns the client account, KYC/AML decisions, custody/client assets, execution, clearing, settlement and customer disclosures. One company may provide both technology and some regulated services, but this must be proven contractually and through regulator records; do not infer it from a “turnkey” label.

### Provider selection matrix — technology vs regulated services

Do not treat “provider” as one interchangeable role. VYRA must identify which legal entity is responsible for each capability and whether the same group supplies technology, regulated services or both.

| Capability being procured | Required functionality | Evidence required before selection |
|---|---|---|
| Trading terminal / client app | Browser terminal, market watchlists, charts, order entry, positions, history, responsive web, desktop and mobile delivery options | Feature demonstration, instrument coverage, chart/data sources, accessibility, languages, release process, uptime/support commitments and app ownership |
| Brokerage / regulated principal | Customer accounts, account terms, permitted products, onboarding approval and regulated customer relationship | Exact contracting legal entity, current regulator register entry, permission scope, target-country/customer eligibility, signed appointment/contract and responsibility matrix |
| Execution / dealing / liquidity | Order routing, market access, execution venue/counterparty, fills, reject/cancel states, liquidity and price formation | Executing entity, venues/counterparties, order-handling policy, best-execution obligations, costs, capacity, outage and kill-switch arrangements |
| Custody / client assets | Safeguarding, segregation, asset ownership, settlement, corporate actions and statements | Named custodian/bank/prime broker, legal ownership model, reconciliation, insolvency treatment and applicable protections |
| Payments / billing | Deposits, withdrawals, fee calculation, settlement, refunds, chargebacks and reconciliation | Payment institution/bank legal entity, permitted countries/currencies, client-money flow, fees, settlement schedule, failure/refund and reconciliation rules |
| KYC / AML / sanctions | Identity and business verification, sanctions/PEP screening, risk review, ongoing monitoring and suspicious activity escalation | Partner's accountable compliance owner, vendor processor role, document/country support, DPA, data location, audit and case escalation |
| CRM / sales / customer support | Lead and client lifecycle, secure communications, complaint tracking, access controls and service desk | Role-based access, audit trail, complaint owner, retention, export, SLA, incident and support escalation |
| Reporting / reconciliation | Account statements, order/fill status, fees, corporate actions, balances, client records and exception handling | Source-of-truth system, API/webhook documentation, event ordering/idempotency, statement format, daily reconciliation and correction process |
| Affiliate / referral system | Approved offers, eligible countries/instruments, rules acceptance, tracking, attribution, fraud controls and payout reporting | Approved advertiser/principal, permitted promotion status, compensation model, disclosures, traffic rules, audit and approval of every campaign |
| Mobile applications | Android/iOS packages, app signing, release pipeline, screenshots, listing information, privacy declarations and account deletion | App ownership, publisher legal entity, store eligibility, partner/regulator approval, SDK/data inventory and ongoing update responsibility |

**Provider due-diligence package:** legal entity and beneficial ownership; official licence/register evidence; allowed products and regions; client-account owner; KYC/AML owner; customer-money/custody owner; execution and liquidity counterparties; data and chart redistribution rights; API documentation and sandbox; webhook security and idempotency; service levels and outage procedures; incident, BCP/DR and audit rights; setup and recurring costs; per-account/volume, liquidity, PSP, KYC, data, mobile, support, customisation and exit fees; data export and termination support.

**VYRA decision:** keep technology-provider choice open. First decide the initial country/product and regulated operating model, then obtain comparable written proposals and total-cost schedules. No technology supplier is endorsed, selected, connected or appointed by this document.

### Provider candidates to approach

| Candidate | Best initial question | What must be proven |
|---|---|---|
| Interactive Brokers | Introducing-broker / institutional partnership | Whether the partner model accepts VYRA's entity and intended customers; countries, permissions, economics, account ownership and API scopes |
| Saxo | Institutional / introducing broker / white-label model | Legal contracting entity, supported countries, execution/custody model, minimums and whether an appointed intermediary is required |
| Alpaca | Broker API / broker-dealer partnerships | Exact permitted countries, entity acceptance, product scope, onboarding, custody and securities permissions |
| DriveWealth | Embedded brokerage partnerships | Partner eligibility, customer-country coverage, account model, KYC responsibility, funding rails and production requirements |
| Upvest | Investment API / embedded investing | Supported legal entities and countries, product scope, regulatory roles and commercial minimums |
| Kenyan CMA-licensed intermediary | Local securities/CIS partnership | Current register entry, exact licence/approval, permitted products and territorial/customer scope |
| Kenyan CMA-licensed online-forex provider | FX/CFD-specific partnership only | Relevant licence category, allowed products, customer restrictions, promotion rules and execution responsibility |
| Virtual-asset provider | Separate crypto/VASP review only | VASP activity category, applicable CBK/CMA route, territorial scope and explicit permission for the exact VYRA role |

**No candidate is approved.** The registry intentionally leaves all candidates `research_only`. Do not set one to `approved` until evidence has been checked and required agreement/appointment and legal gates are effective.

### Mandatory partner evidence

- Current legal entity name, registration and ultimate ownership.
- Regulator, licence number, official register URL, permissions and restrictions.
- Written confirmation of VYRA contracting-entity eligibility and customer-country coverage.
- Written asset-class/product scope for each intended country and customer type.
- Who owns customer account opening, KYC, AML/CTF, sanctions, PEP handling and ongoing monitoring.
- Who receives deposits, holds client money/assets, controls withdrawals and performs safeguarding/reconciliation.
- Who makes dealing decisions, receives and executes orders, routes to venues, clears and settles.
- Who issues statements, tax records, complaints and regulatory disclosures.
- All setup, platform, minimum-volume, account, execution, market-data, custody, deposit, withdrawal, FX and termination charges.
- API docs, sandbox, OAuth/scopes, webhook signing, idempotency, rate limits, outage policy and production certification.
- Outsourcing, data-processing, cross-border transfer, audit, business continuity and exit terms.
- Written approval for VYRA's brand, domain, affiliate activity, marketing copy, attribution and remuneration.

**Contract state:** no provider contract has been signed. A discovery call or sandbox credential is not a production approval.

## Step 2 — Brand, product and market configuration

| Provider checklist field | VYRA working decision | Evidence still needed |
|---|---|---|
| Brand | VYRA Markets | Trademark/name clearance and legal entity ownership |
| Domain | Use a temporary host-provided subdomain for paper demo; a proposed `vyra.markets` brand domain is not treated as purchased or verified | Domain availability, registrant, DNS, TLS and legal contact |
| Affiliate subdomain | Reserve design for `affiliate.<verified-domain>` only after affiliate programme approval | Domain control, security and approved promotion model |
| Traderoom subdomain | Reserve design for `trade.<verified-domain>`; currently the app is the paper-only web dashboard | Provider-hosted trading terminal/API and legal permission |
| Countries | No live market enabled; default deny for all countries until partner and legal approvals | Country × product × customer-type matrix, written partner eligibility |
| Languages | English first for the prototype | Human-reviewed translations, language-specific terms and support |
| Currency | USD is the current illustrative paper-account currency only | Provider settlement currencies, FX conversion, disclosures, fees |
| Minimum deposit | None; no deposits accepted | Partner funding policy and legal approval |
| Minimum investment | None configured for a real product | Product-specific minimums and investor eligibility from provider |
| Instruments | 11 seeded catalogue instruments across crypto, equities, FX and commodities; provider feeds are development-only. ETFs and options are not currently in the VYRA catalogue or approved scope. | Confirm the exact partner-supported instruments, identifiers, trading venues, country/product restrictions and commercial market-data rights |
| Client apps | Responsive web only; no native desktop, Android or iOS apps | Partner SDK/white-label requirements and app-store evidence |
| Visual style | Existing dark `#080c11`, green `#36d399`, VYRA mark | Final brand guidelines, logo rights, trademark clearance |

A free host subdomain is a staging address, not a permanent brokerage domain. Do not collect personal or financial data on an unverified domain.

### Product and marketing claims from the reference checklist

The reference checklist advertises examples such as 300+ instruments, up to nine charts, seven timeframes, 100+ indicators, tutorials, 24/7 support, fast deposits and withdrawals, and cash-out-anytime. These are provider marketing claims, not current VYRA capabilities. VYRA must not copy them into its website, app-store listing or partner deck without a real provider contract, implemented capability, measured service level and evidence.

Current VYRA has a responsive web dashboard and a small development catalogue. It does not provide nine simultaneous charts, seven certified chart timeframes, a 100-indicator library, a tutorial/education centre, 24/7 staffed support, deposits, withdrawals or payouts. No minimum deposit or investment is configured because no real-money account exists. The only balance is an illustrative simulated USD paper balance.

Treat the following as separate implementation gates:
- expand the product catalogue only after provider coverage, exchange identifiers and display/trading rights are verified;
- add chart packages and timeframes only after checking chart-library licences and the provider's market-data entitlements;
- add tutorials and customer support only with named owners, reviewed content and staffed service commitments;
- add payment and withdrawal flows only through the authorised partner's approved funding and safeguarding arrangements;
- never describe a paper fill or simulated balance as a real investment or customer account.

## Step 3 — Legal PDFs and email addresses

The six requested provider PDFs are not in the VYRA repository or this conversation. VYRA must not manufacture them and present them as provider-issued policy.

Required provider/counsel documents and intended route slugs:

| Document supplied by provider/counsel | Intended URL | Current state |
|---|---|---|
| AML.pdf | `/legal/aml` | Status notice only; policy not supplied |
| Payment Policy.pdf | `/legal/payment_policy` | Status notice only; payment service not implemented |
| Terms.pdf | `/legal/term` | Status notice only; contracting entity not confirmed |
| Order Execution Policy.pdf | `/legal/order_execution` | Status notice only; no executing broker |
| Privacy Policy.pdf | `/legal/privacy` | Status notice only; final data inventory and controller roles need review |
| General Fees.pdf | `/legal/general_fees` | Status notice only; no provider fee schedule supplied |

When received, each PDF must be checked for the correct legal entity, regulator, effective date, country/product scope, version, document owner and consistency with the signed contract. Keep a versioned copy and publish only after approval.

Create named business mailboxes only after the domain is verified and mailbox provider is selected (for example partnerships, support, privacy and compliance). Do not send mailbox passwords by chat or email; invite named users and require MFA. Current VYRA has no verified custom-domain mailboxes.

## Step 4 — Social media and analytics

- Add only official social profiles that VYRA actually controls. No handles are invented in the app.
- Use a VYRA-owned Google Tag Manager container only after the privacy notice and lawful analytics basis are approved.
- The app now supports an optional `NEXT_PUBLIC_GTM_ID` and loads GTM only after the visitor opts into analytics. No GTM ID is configured, so no GTM container is loaded.
- Analytics must not receive passwords, KYC information, account balances, order payloads, personal identifiers or partner access tokens.
- Maintain campaign tagging and a change log; partner-approved promotion and affiliate links must be distinguishable.

## Step 5 — Google Play and Apple App Store

### Draft listing facts

- App name: VYRA Markets.
- Short description (prototype): “Explore multi-asset markets and practise with a paper account.”
- Full description (prototype): “VYRA Markets is a market-information and paper-trading workspace. View provider-sourced market snapshots, organise a watchlist and test hypothetical orders using a simulated account. No deposits, withdrawals, custody or live trading are available.”
- Current category proposal: Finance (subject to each store's review).
- Languages: English only for the initial prototype.
- App icon and feature graphics: final export set not complete; the web mark/favicon is not a complete store asset pack.
- Phone screenshots: must be captured from a verified production-like mobile build after UI and data accuracy review.
- App binary: no native Android/iOS build exists.

### Store eligibility gate

Google Play currently requires an **Organization** developer account for financial products and services, including stock trading, investment funds and cryptocurrency exchanges. Its standard full-distribution registration fee is USD 25 one time. Apple's published App Review Guidelines say apps used for financial trading, investing or money management should be submitted by the financial institution providing the services, with the necessary licences and permissions in each jurisdiction. Apple's Developer Program is USD 99 per year. VYRA therefore must not submit a pretend live brokerage app under a personal developer account or before its regulated provider supplies the required evidence.

Sources:
- Google Play: https://support.google.com/googleplay/android-developer/answer/18265346
- Google Play account setup and fee: https://support.google.com/googleplay/android-developer/answer/6112435
- Apple App Review Guidelines, section 3.2.1(viii): https://developer.apple.com/app-store/review/guidelines/
- Apple Developer Program membership: https://developer.apple.com/help/account/membership/program-enrollment/

## Final step — Affiliate programme

Affiliate marketing in financial services can constitute regulated promotion or introduction. The affiliate system remains disabled. Before enabling it, obtain written legal and partner approval for:

- Offer/advertiser legal entity and regulated principal.
- Approved instruments and product descriptions.
- Approved countries and customer types.
- Referral action (click, lead, qualified account, funded account or something else).
- Commission formula, payer, payment timing, cancellations, clawbacks, tax and disclosure.
- Affiliate eligibility, prohibited practices, traffic sources and acceptance rules.
- Risk warning, conflicts/inducements disclosure and promotion approval workflow.
- Attribution window, duplicate/fraud handling, consent, retention and audit.
- Complaint, suspension, termination and customer-transition rules.

No referral commission, payment, tracking pixel or paid financial promotion should be activated until those gates are effective. Do not store government IDs, financial details or KYC documents in an affiliate tracking system.

## Provider's named modules — VYRA gap map

| Module | Actual VYRA state | Required next step |
|---|---|---|
| User communication | Neon email/password auth integration scaffold; outbound email and account recovery not certified | Configure approved email sender, trusted origins, test verification/reset end to end |
| Sales module | Not implemented | Define whether provider or partner owns sales/advice; implement approved lead hand-off only |
| KYC | Not implemented by VYRA | Partner-owned KYC for initial model; no document collection by VYRA |
| Billing | No payment or billing processor | Partner-owned funding and fee collection; obtain contracts and reconciliation |
| Trading platform | VYRA web paper-trading terminal | Build a broker adapter only after partner sandbox and scopes are granted |
| Liquidity | No liquidity provider | Provider must identify executing broker, venues and liquidity source |
| AML | No transaction monitoring or formal programme at VYRA | Partner owns regulated customer AML; VYRA vendor controls and reporting only if contractually required |
| Reports | Paper ledger and paper order journal | Add provider statement reconciliation once permitted API/data access exists |
| Affiliate system | No live programme; eligibility gates are present | Implement only after promotion and remuneration approvals |
| Dealing | Live execution hard-disabled | No dealing until executing entity, permissions, sandbox and certification exist |
| Mobile applications | Responsive web only | Native client work after signed provider requirements and app-store eligibility |

## Release decision

**Current permitted release:** paper-only VYRA web demo with synthetic balances and development market data.

**Not ready:** live brokerage, real deposits/withdrawals, live orders, custody, client-money handling, regulated product distribution, paid affiliate promotion, store publication as a brokerage or provider-branded white label.

**The fastest compliant route is not to pretend VYRA is a broker.** It is to secure one regulated principal, one starting jurisdiction and one product category; prove that VYRA's precise role is permitted; then integrate only the principal's approved sandbox and later its certified production APIs. The VYRA platform should remain fail-closed outside that written scope.
