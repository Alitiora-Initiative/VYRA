# VYRA CRM and Brokerage Operations Architecture

**Research date:** 26 November 2026  
**Status:** Architecture and vendor shortlist. No CRM vendor, regulated principal, KYC provider, payment provider or dealing provider is contracted or production-approved.

## 1. What the webinar changes

The Quadcode webinar discussion correctly frames a brokerage as an operating model, not just a trading screen. VYRA's build must cover five connected systems:

1. **Market selection and launch waves:** assess commercial demand and operational readiness separately. The replay chat mentions Brazil as the highest-ranked market, Indonesia as a large mobile market, Colombia as a shortlist market, the Philippines at fifth, and Nigeria as an opportunity with payment complexity. Those comments are not a complete chart, a verified market report or permission to serve those countries. The slide values, methodology, date range and underlying sources were not included in the transcript provided to VYRA.
2. **Local operating fit:** KYC document and language coverage, local payment rails, local support hours, customer protection, fraud patterns and jurisdictional approvals must be validated for each country.
3. **Growth and retention:** record first/last-touch attribution, acquisition source, campaign cost when available, lead stage, onboarding drop-off, partner referrals, support interactions and retention signals. Measure conversion and cohort retention from real events, not illustrative ROI assumptions.
4. **Brokerage operations:** CRM, client reporting, communications, ticketing, KYC/AML case routing, billing/payment exceptions, affiliate/IB operations, dealing/anti-fraud and reconciliation need distinct owners and audit trails.
5. **Controlled expansion:** launch one partner-approved country/product cohort, measure the complete funnel and support burden, then add the next country only after the first operating wave is stable.

**Important:** the webinar transcript contains attendee comments and a few verbal chart interpretations, not the underlying chart dataset. VYRA must not hard-code a country ranking or 3-month payback assumption from chat comments. No target-market decision should be made before the Access Graph and Provider Graph have dated evidence for the exact customer, activity and product.

## 2. CRM vendor decision

### Shortlist

| Option | Strengths shown in public vendor material | VYRA assessment |
|---|---|---|
| **Quadcode Back Office** | Sales CRM and lead-to-retention journey; reports; chats/calls/ticketing; email/push/pop-up marketing; affiliate/IB/CPA/revenue-share modules; dealing and anti-fraud; billing with 100+ PSP connections; KYC/AML and multi-level verification. | Strongest first demo for a Quadcode-powered brokerage. Ask for the actual API/webhook catalogue, supported geographies, payment-provider list, role/audit controls, retention rules, data-export guarantees, pricing and service schedule. Vendor says infrastructure is hosted on its servers; confirm the exact hosting, subcontractor and data-location terms. |
| **B2CORE** | Client cabinet and back office, customer/account/transaction management, KYC, fiat/crypto wallets, payment integrations, helpdesk, bonuses, partner/IB reporting and trading-platform integrations. | Strong alternative for a provider-neutral multi-asset CRM/back office. Obtain a written country/asset coverage matrix, integration list, SLA, full data-exit test and end-to-end operational demo. Public pricing lists paid tiers; the live cost must be quoted against VYRA's projected account and volume assumptions. |
| **FXBO** | Client data and transaction history, categorisation, IB/affiliate management, document workflows and expiry reminders, targeted campaigns, internal task/request routing, payment-provider and KYC integrations. | Strong alternative for a Forex/CFD-heavy back office. Validate all needed multi-asset workflows, data residency, APIs, event export, audit granularity and local PSP/KYC coverage. |
| **Generic CRM (HubSpot, Salesforce, Zoho)** | Lead capture, marketing attribution, sales pipelines and general customer support workflows. | Use only for top-of-funnel B2B sales/partnerships unless a privacy and architecture review approves more. Do not make a generic marketing CRM the authoritative store for KYC files, client balances, payment instructions, dealing decisions or regulatory case outcomes. |

### Initial recommendation

Run a structured vendor demo of **Quadcode Back Office first** because the webinar is directly associated with Quadcode and its published feature set maps closely to the brokerage operations raised in the chat. Run B2CORE and FXBO as competing bids. Do not select a vendor based on a webinar, logo, feature list or conversion claim. Select only after a written functional test, security review, legal/data assessment, commercial comparison and exit/portability test.

VYRA's product design should remain **provider-neutral**: CRM adapter interfaces for leads, client status, task/case status, partner attribution, KYC decision references, payment exception references, support tickets, trading-account references and event webhooks. Partner data stays the authoritative source for regulated accounts, balances, identity verification and transactions.

## 3. Functional operating modules VYRA must cover

| Module | Required workflow | Control / proof |
|---|---|---|
| Sales CRM | Lead capture, deduplication, owner assignment, call/email history, pipeline stages and next action | Consent and purpose tracking, role-based access, immutable stage history |
| Acquisition analytics | First/last-touch attribution, UTM source/medium/campaign, affiliate code, GEO and channel | Consent-aware tracking, dedupe, source timestamps, campaign cost imports and cohort conversion |
| Onboarding desk | Application status, missing-document reason, partner decision reference and ageing queue | Partner remains KYC/AML decision-maker; never copy raw IDs into VYRA CRM |
| Client servicing | Client profile references, support tickets, complaints, ownership, priority and SLA clocks | Complaint escalation, restricted notes, least privilege and evidence of resolution |
| Payments operations | Deposit/withdrawal status, PSP reference, delayed/reversed/failed exception, reconciliation state | Partner/PSP receives money; no VYRA client-money account or credentials |
| Dealing and risk | Execution rejects, exposure alerts, market outages, price exceptions and kill-switch state | Broker/dealing partner owns execution; maker-checker for operational controls |
| Affiliate and IB | Partner due diligence, approved territories, client attribution, fraud flags and approved remuneration records | No referral activation, trading-volume commission or payout before counsel and principal approval |
| Retention | Activation, first meaningful use, 7/30/90-day cohort retention, support friction and opt-in communications | No misleading profit promises, high-pressure prompts or unwanted marketing |
| Finance/reconciliation | Fee and partner statement ingestion, cash/position/trade discrepancy queue and daily sign-off | Provider is source of truth; every exception has owner, ageing and resolution evidence |
| Reporting | Funnel, GEO readiness, acquisition source, unit economics, complaint ratios and operational SLA | Real events only; disclose missing/incomplete provider feeds and attribution uncertainty |

## 4. Initial VYRA CRM implementation boundary

The CRM foundation in this repository intentionally starts with:
- staff role grants (admin, sales, compliance, support, finance, dealing, operations, partner manager, read-only);
- prospect pipeline with source/campaign/country attribution and explicit communication consent;
- task queues with owner, priority and due date;
- partner and operations case registers;
- append-only audit events and row-level database access controls.

It does **not** accept identity-document images, KRA/PIN/ID numbers, card/bank/wallet credentials, customer funds, live orders, official KYC decisions or commission calculations. The stage partner_handoff_pending_approval is an internal status only; it does not send a referral or open an account. The stages partner_onboarding and partner_confirmed must be set only by a future verified partner event, not a staff edit.

CRM access defaults to **no access**. A database administrator must explicitly provision the first staff membership. This prevents ordinary retail users from browsing prospect records. A role grant must be reviewed before production and must not be shared.

## 5. Market and provider integration requirements

### Country readiness scorecard

Every target country needs an evidence-backed score across: legal permission, regulated principal coverage, product eligibility, local-language support, KYC document coverage, payment rails and settlement, fraud/chargeback controls, customer support hours, market-data rights, tax/reporting, and achievable unit economics.

Use the webinar's verbal Brazil/Indonesia/Colombia/Philippines/Nigeria notes as **research questions**, not rankings. For Brazil, verify Pix availability and local support. For Indonesia, verify local payment rails, language and onboarding coverage. For Colombia, verify local KYC and payment fit. For the Philippines, verify payment, support and customer-protection requirements. For Nigeria, quantify payment success/chargebacks and licensing perimeter before treating the apparent upside as launch readiness.

### KYC and AML

For a Kenya research candidate, Smile ID publicly describes identity-document and identity-number coverage, liveness/authentication and AML screening. Sumsub documents user and business verification, REST APIs, WebSDK/MobileSDK, transaction monitoring and case-management capabilities. These are candidates only. Require the regulated principal to approve the provider, verification level, data controller/processor terms, decision ownership, retention and escalation workflow before connecting them.

### Payment operations

Do not treat a PSP integration list as evidence that a payment rail is licensed or can legally service a VYRA customer. For each country, record the contracting PSP legal entity, regulator/licence, supported currencies, local methods, merchant category/financial-services acceptance, settlement timing, chargeback/reversal handling, reconciliation events and restrictions. Customer money must flow directly to the regulated partner or its approved safeguarding arrangement.

### Dealing and risk

Require a named broker/dealing principal, execution venue/LP list, pricing and spread policy, order lifecycle event schema, reject reasons, exposure limits, market outage/price-error handling, kill switch, and independent daily reconciliation. A CRM queue is a case-routing tool, not an execution engine.

## 6. Vendor demo and procurement scorecard

Score each candidate 0–5 only after evidence is demonstrated. Suggested weights:

- Brokerage-specific CRM and client lifecycle — 15%
- KYC/AML workflow and case integration — 12%
- Payment/PSP and reconciliation — 12%
- IB/affiliate attribution and controls — 10%
- Dealing, anti-fraud and risk operations — 10%
- APIs, signed webhooks, event replay and sandbox — 12%
- RBAC, field-level controls, immutable audit and MFA/SSO — 12%
- Data residency, sub-processors, retention and export/exit — 10%
- Support SLA, uptime evidence and incident process — 4%
- Total cost of ownership and commercial flexibility — 3%

**Mandatory pass/fail gates:** no verified legal entity; no security/DPA evidence; no role-scoped admin access; no auditable export; no API/webhook documentation; no country-level PSP/KYC coverage; no clear termination/data deletion plan. Any failed mandatory gate disqualifies a provider regardless of weighted score.

Request these artefacts before procurement: API/OpenAPI specification, webhook signatures and retry rules, sandbox account, data-flow diagram, sub-processor list, hosting region, encryption/key management, SOC/ISO evidence and scope, penetration-test summary, incident SLA, access-role matrix, audit export, retention schedule, deletion certification, business continuity/DR test, customer references, full price schedule, minimums, integration fees and contract exit terms.

## 7. CRM data model and privacy rules

- Keep lead contact data separate from regulated client identity and trading data.
- Record the purpose, channel, time and policy version for marketing consent; do not treat an account-opening request as blanket marketing consent.
- Use partner-issued opaque references for KYC, payment, account and trade cases. Never store raw identity documents, national ID/KRA PIN, card number, bank credentials, wallet seed phrase or customer money.
- Set a retention review date and deletion/rectification process; access logs and immutable event history must not expose full contact details.
- Use field masking, least privilege, staff MFA, time-bound roles and quarterly access reviews before storing real prospect information.
- Never put personal data in URL parameters, campaign tags, referral codes or general analytics events.
- Do not market to a lead unless the recorded lawful basis and channel rules permit it.

## 8. Implementation roadmap

**Phase 1 — CRM control plane:** staff roles, lead pipeline, task queue, partner register, cases, audit and attribution; empty by default, no fake data.

**Phase 2 — Integration contracts:** partner CRM adapter, webhook signature verification, deduplication/idempotency, status mapping and event replay; sandbox only.

**Phase 3 — Operational queues:** onboarding ageing, PSP exceptions, dealing alerts, complaints and reconciliation cases, with maker-checker and SLA monitoring.

**Phase 4 — Growth analytics:** campaign spend imports, CAC by channel, partner cohorts, activation and retention by GEO, and contribution margin from partner-provided statements.

**Phase 5 — production readiness:** legal approvals, partner agreement, security and privacy review, vendor conformance, disaster recovery, staff training and a documented go/no-go decision. No live money or order feature is enabled by completion of a CRM phase.

## Sources

- Quadcode Back Office: https://quadcode.com/back-office
- B2CORE: https://b2broker.com/products/b2core/platform/
- FXBO Back Office: https://fxbackoffice.com/products/crm
- Smile ID Kenya: https://smile.id/countries/kenya
- Sumsub developer overview: https://docs.sumsub.com/docs/overview
- Sumsub transaction monitoring: https://docs.sumsub.com/docs/transaction-monitoring
