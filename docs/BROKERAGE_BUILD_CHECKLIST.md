# VYRA Markets — Master Build Checklist

**Legend:** [x] committed in repository; [~] partly complete / verification pending; [!] blocked by external dependency; [ ] not started.

A completed document or software task does not mean VYRA is authorised to conduct regulated activity.

## P0 — Safety boundaries and governance

- [x] Keep VYRA described as software, not as a licensed broker, adviser, custodian, exchange or fund manager.
- [x] Keep live execution disabled for every asset-class adapter.
- [x] Keep current accounts, balances, orders and fills paper-only.
- [x] Separate simulated balances from any future partner-sourced balances.
- [x] Add the 12,000+ word researched brokerage master plan.
- [x] Add brokerage operating, data, order, reconciliation and deployment flowcharts.
- [x] Document the country/product/customer-type launch gates and current provider model in `docs/PROVIDER_BROKERAGE_LAUNCH_CHECKLIST.md`.
- [x] Create a first versioned Kenya regulatory evidence/rule pack for AccessGraph covering VASP activity/promotion, CIS platform distribution, securities intermediation and online forex.
- [ ] Expand the rule/evidence register with qualified counsel across customer type, each additional jurisdiction, instrument and activity; unknown markets remain blocked.
- [ ] Obtain external Kenyan legal advice on ISPP, broker-dealer, online forex and referral boundaries.
- [ ] Request written CMA classification guidance for VYRA's exact customer journeys.
- [ ] Download and reconcile current 2025 General Licensing Regulations and 2026 CMA ISPP / broker-dealer checklists.
- [ ] Select a single first operating model: information-only hand-off, ISPP, or appointed/introducing partner.
- [ ] Select one starting country and one starting product class.
- [ ] Assign owners for compliance/legal, privacy, security, customer complaints, partner management and reconciliation.
- [ ] Add formal go/no-go and change-approval records.

## P0 — Infrastructure and deployment

- [x] Preserve the existing unrelated Supabase projects 9N8 and Space Ledger; neither was modified.
- [x] Provision dedicated Neon Postgres project `vyra-markets` in Frankfurt, with `vyra` database and dedicated main branch.
- [x] Enable Neon Managed Better Auth and Neon Data API on VYRA's branch.
- [x] Commit and apply the Neon-native schema migration at `neon/migrations/20261126000100_vyra_core.sql`.
- [x] Verify 14 public tables, RLS enabled on all 14, 19 public RLS policies and 69 validated constraints.
- [x] Keep UUID user IDs after inspecting Neon Managed Auth's UUID primary key; do not change the existing UUID foreign keys.
- [x] Remove Supabase runtime clients, Supabase middleware and service-role runtime dependency from the active app path.
- [x] Add Neon Next.js server/client auth integration and the Neon Data API adapter.
- [x] Create a dedicated quote-ingestion PostgreSQL role; it cannot modify customer accounts, orders, positions or ledger records.
- [x] Enforce email verification for new Neon Auth accounts and enable the shared Neon email provider; delivery/reset still require end-to-end test.
- [x] Add VYRA favicon, installable-web-app manifest, legal-document status pages and analytics consent gate.
- [x] Run GitHub Actions on main: all 16 unit tests, TypeScript, ESLint and the production Next.js build passed on commit `9f0e6d65ceed9a53fdf5457f600d5a67adc37783` (26 Nov 2026).
- [~] Re-run the full workflow after the latest documentation-only Neon runbook correction; do not treat an in-progress run as completed.
- [ ] Verify Neon sign-up, OTP verification email delivery, sign-in, session refresh, sign-out and password reset end-to-end using a test mailbox. Neon is configured to require verification; delivery and reset completion are not yet certified.
- [ ] Add the exact deployed staging origin to Neon Auth trusted domains after the Render service URL is known.
- [ ] Provision the free Render paper-demo web service and set the four Neon environment variables securely; do not deploy as a live brokerage.
- [ ] Configure an approved custom domain and business mailboxes when domain/ownership and email provider are selected.
- [ ] Add secret scanning, dependency auditing and branch protection.
- [ ] Document encrypted backups, retention and tested restoration before any personal/financial data is stored.
- [ ] Keep GitHub private; do not buy a Vercel upgrade or make the repository public to bypass current limitations.


## P1 — Partner research and eligibility

- [ ] Verify each partner legal entity against its regulator register and retain dated evidence.
- [ ] Obtain written country/customer-type eligibility, starting with Kenya.
- [ ] Contact Interactive Brokers institutional / introducing broker team.
- [ ] Contact Saxo institutional / introducing broker team.
- [ ] Contact Alpaca Broker API partnerships team.
- [ ] Contact DriveWealth partnerships team.
- [ ] Contact Upvest for later European market research if relevant.
- [ ] Contact at least one CMA-licensed Kenyan investment bank or fund manager about the ISPP model.
- [ ] Ask CMA for written perimeter guidance using the exact proposed VYRA flow.
- [ ] Create a weighted provider scorecard for each candidate.
- [ ] Capture legal entity, licence number, regulator, permission scope, country and product limits, account model and official register URL.
- [ ] Map who owns account opening, KYC, AML, sanctions, deposits, withdrawals, client money, custody, execution, clearing, settlement, statements and complaints.
- [ ] Obtain commercial details: setup, monthly minimums, account fees, trading fees, market-data fees, minimum volume/assets and termination charges.
- [ ] Obtain API docs, sandbox credentials, webhooks, rate limits, idempotency rules and production certification requirements.
- [ ] Reject any provider that asks VYRA or its founder to receive customer money or cannot prove regulatory status.

## P1 — Corporate, licensing and legal documents

- [ ] Certificate of incorporation and current registry extract.
- [ ] Constitution, share register, beneficial-ownership register and group structure.
- [ ] Director/controller identity, address, CV, regulatory history and fit-and-proper declarations.
- [ ] Board resolutions and delegated authority matrix.
- [ ] Business plan and three-year financial forecast.
- [ ] Capital and liquid-capital calculation using current rules.
- [ ] Organisation chart and key-person plan.
- [ ] Platform architecture, capacity, cyber and security evidence.
- [ ] Product catalogue and demonstrated customer journey.
- [ ] AML/CTF and sanctions policy.
- [ ] Fraud prevention and customer risk framework.
- [ ] Data protection policy and ODPC registration analysis.
- [ ] Cross-border data map, data-processing agreement and lawful transfer safeguards.
- [ ] Cybersecurity policy and incident response plan.
- [ ] Business continuity and disaster recovery plan with RTO/RPO.
- [ ] Record retention and immutable audit-trail procedures.
- [ ] Risk management policy and risk matrix.
- [ ] Complaint lodging, acknowledgement, investigation and resolution procedure.
- [ ] Customer terms, privacy notice, cookie notice, risk disclosures and partner disclosures.
- [ ] Financial promotions approval and archive procedure.
- [ ] Conflicts and inducements policy covering referral payments and rankings.
- [ ] Outsourcing and third-party risk policy.
- [ ] Partner referral / introducer agreement with activity, country and customer limits.
- [ ] API/technology agreement, DPA, SLA, incident, audit and exit schedules.
- [ ] For fund distribution: manager agreement, fund approval, offering documents, eligibility rules, administrator/custodian/auditor and liquidity/valuation disclosures.
- [ ] For own brokerage licence: application documents and a funded capital plan.

## P1 — Product and software foundations

- [x] Build the first AccessGraph jurisdiction/product/activity evaluator with versioned evidence, default-deny for unknown jurisdictions and eleven incomplete release gates.
- [ ] Build a partner capability registry for market data, onboarding, accounts, KYC status, deposits, withdrawals, balances, positions, orders, statements and support.
- [ ] Build a partner directory with legal entity, regulator, licence, category, scope, official register link and evidence date.
- [ ] Build a product catalogue with identifier, legal provider, asset class, issuer/manager, currency, domicile, customer restrictions, fees and risks.
- [x] Add partner-specific country/product eligibility checks and default-deny gates in the existing partner eligibility module.
- [ ] Add partner-specific country/product allow-lists and emergency disable switches.
- [x] Add a first-visit analytics consent choice; the optional GTM script is only loaded after analytics acceptance.
- [ ] Add versioned consent and privacy event history.
- [ ] Add pseudonymous referral events without personal data in URL parameters.
- [ ] Add link versioning, partner approval, attribution expiry, duplicate/referral fraud controls and audit history.
- [ ] Add a provider hand-off screen explaining that account opening takes place with the named partner (requires an approved named partner first).
- [x] Add source evidence metadata, rule-pack version and review date to AccessGraph.
- [ ] Extend source timestamps and last-verified dates to every partner and instrument record.
- [ ] Add balanced risk disclosures and compensation/conflict labels.
- [ ] Add content approval workflow; unapproved promotions cannot publish.
- [ ] Add customer complaint links to the accountable legal entity.
- [ ] Add partner account status / portfolio sync only when the contract permits it.
- [ ] Add OAuth or scoped token storage only where the provider authorises it.
- [ ] Keep identity documents with the partner by default.
- [ ] Make unknown, unsupported and stale partner/data states fail closed.

## P2 — Broker integration (only after written permission)

- [ ] Create sandbox-only adapter with distinct production credentials and environment.
- [ ] Document legal entity, API scopes, provider environment and account model.
- [ ] Implement partner-authenticated account linking.
- [ ] Implement account status callbacks with signature validation and replay protection.
- [ ] Implement provider-sourced cash, buying power, settled/unsettled cash, positions and open orders.
- [ ] Implement order preview with provider quote, fees, market session and product restrictions.
- [ ] Implement order submission with user confirmation, idempotency and immutable audit.
- [ ] Model accepted, pending, partial, filled, cancelled, rejected and expired statuses separately.
- [ ] Implement signed webhooks, event sequence validation, deduplication and polling recovery.
- [ ] Implement daily reconciliation of positions, cash, fills, fees, corporate actions and transfers.
- [ ] Implement discrepancy case management and disable affected feature for material differences.
- [ ] Provide official statement and export links; partner records remain authoritative.
- [ ] Pass vendor certification tests.
- [ ] Obtain written production enablement and legal/compliance sign-off.
- [ ] Enable the smallest approved country × product × partner segment.
- [ ] Keep every unapproved product and territory disabled.

## P2 — Market data and charting rights

- [ ] Select the minimum markets needed for the first product.
- [ ] Store data source, exchange, currency, session, timezone, as-of time and delayed/live status per instrument.
- [ ] Obtain commercial real-time or delayed display rights through the broker or licensed vendor.
- [ ] Confirm display, redistribution and non-display permissions.
- [ ] Do not treat free developer access as commercial redistribution permission.
- [ ] Keep CoinGecko and Twelve Data labelled as development feeds until commercial terms are verified.
- [ ] Add stale quote rejection, cache monitoring and provider error states.
- [ ] Keep charting separate from order execution and custody.

## P2 — Operations and security

- [ ] Enforce MFA for workforce and privileged users.
- [ ] Separate support, compliance, operations and engineering roles.
- [ ] Make support read-only by default and audit every customer-record access.
- [ ] Add rate limits for authentication, referral events and account linking.
- [ ] Add secret scanning, rotation, least privilege and key-revocation runbooks.
- [ ] Complete independent security review and penetration test before real customer data.
- [ ] Validate webhook signatures, timestamps, replay and event ordering.
- [ ] Produce daily reconciliation and exception reports.
- [ ] Add partner outage and stale-data circuit breakers.
- [ ] Define complaint categories, ownership and response targets.
- [ ] Exercise security incident and data breach response.
- [ ] Test disaster recovery and rollback.
- [ ] Require release approvals and deployment audit.

## P3 — Launch readiness

- [ ] Confirm all required licences, permissions, appointments, notifications and partner approvals are effective.
- [ ] Confirm target residents and each product are expressly supported by regulator and partner.
- [ ] Confirm executed partner, data-sharing and outsourcing agreements.
- [ ] Confirm customer money never enters a VYRA-controlled account.
- [ ] Confirm partner owns KYC, account approval, custody and execution in initial model.
- [ ] Confirm all financial promotions and affiliate copy have been approved and archived.
- [ ] Confirm customer complaints can reach the accountable firm.
- [ ] Confirm market-data and chart redistribution rights.
- [ ] Resolve every critical security defect.
- [ ] Reconcile account, cash, positions and order statuses end-to-end.
- [ ] Confirm production access, monitoring, incident cover and customer support.
- [ ] Pilot with a small invited cohort.
- [ ] Review customer confusion, support volume, failure rates and partner conversion.
- [ ] Expand only after a signed gate review.

## P3 — Ongoing operating cadence

- [ ] Weekly partner status and incident review during initial launch.
- [ ] Monthly licence, permission and link verification for active partners.
- [ ] Quarterly product governance and marketing review.
- [ ] Quarterly access review and secrets rotation review.
- [ ] Monthly reconciliation quality and complaint trend report.
- [ ] Annual privacy, AML, cyber and outsourcing policy review.
- [ ] Retire partner links immediately on licence suspension, contract expiry or unresolved critical issue.
- [ ] Version and archive every policy, disclosure and marketing asset.


## P0 — Kenya virtual-asset regime (separate from securities and CIS)

- [x] Research and document the VASP Act 2025 and VASP Regulations 2026 in the Kenya VASP addendum.
- [ ] Obtain legal classification of each crypto-related VYRA function under the VASP Act and Regulations.
- [ ] Confirm the local and cross-border targeting/revenue implications under Regulation 4.
- [ ] Confirm whether any crypto referral, affiliate or partner-promotion activity would be subject to Regulations 123–132 or other intermediary requirements.
- [ ] Request current CMA VASP broker/exchange licence application instructions and checklist.
- [ ] Request CBK clarification only if wallet-provider, payment-processor or stablecoin activity is proposed.
- [ ] Keep crypto referrals, promotion, wallet custody, exchange routing and live order features disabled until permissions and partner approvals are documented.
- [ ] Do not plan an owned Kenyan VASP broker/exchange licence under the current zero-capital constraint: the published minimum paid-up capital is KSh 10m for a virtual-asset broker and KSh 100m for an exchange, plus required liquid capital and other costs.
- [ ] If a licensed partner model is viable, document marketing responsibility, outsourcing approval, customer asset ownership, KYC/AML, custody, reconciliation, data-sharing, fees and exit arrangements.


## P0 — Hosting decision and safe demo environment

- [x] Research and commit a current zero-cost hosting comparison for Render, Netlify, Cloudflare Workers, Railway, Vercel and Supabase.
- [ ] Select the Render workspace (My Workspace or JOJO) before creating the current demo blueprint.
- [ ] Keep demo traffic paper-only and synthetic; do not host real customer data or live broker credentials on free services.
- [ ] Assess Netlify as an alternate Next.js preview host if Render cannot be used.
- [ ] Assess Cloudflare vinext in a non-destructive branch only; require auth, middleware, API and build compatibility tests before adopting it.


## P1 — Technology vendor due diligence

- [x] Research and commit a brokerage technology vendor map by lifecycle layer.
- [ ] Choose the preferred regulated brokerage/fund partner before selecting separate custody, payment or KYC vendors.
- [ ] Ask the partner which KYC, AML, sanctions, custody, payment and market-data suppliers it already uses and permits.
- [ ] Validate all vendor legal entities, country coverage, permissions, security, data roles, commercial costs and exit terms.
- [ ] Select a chart library only after reviewing licence terms; current default candidate is Lightweight Charts, with no market-data entitlement implied.
- [ ] Keep KYC and money movement within the licensed partner's approved infrastructure unless counsel/regulator authorises another model.


## P0 — Database provider resolution (updated 26 Nov 2026)

- [x] Research PostgreSQL and managed database alternatives, including Neon, Supabase, Aiven, Firebase Firestore, Firebase SQL Connect, Render Postgres, Railway and Turso.
- [x] Select Neon Postgres Free as the preferred isolated development/paper database.
- [x] Record why Firebase Firestore is not a fit for the current relational double-entry ledger and PL/pgSQL design.
- [x] Record Aiven as a genuine PostgreSQL fallback.
- [x] Commit the Neon Managed Better Auth and Data API migration runbook.
- [x] Connect Neon and provision the dedicated `vyra-markets` project in Frankfurt (`dawn-wind-08199003`).
- [x] Create the `vyra` database and verify the main branch.
- [x] Enable Neon Managed Better Auth and the Neon Data API.
- [x] Create `vyra-dev` as an isolated branch from main for validation.
- [x] Inspect actual Better Auth UUID identity, roles, grants and Data API behavior; keep UUID references and use `auth.uid()`.
- [x] Replace the active Supabase runtime path with Neon Auth, Neon Data API and the server-only restricted quote writer.
- [x] Apply the Neon-native migration to the main branch and validate it on `vyra-dev`; never apply the legacy Supabase migration to Neon.
- [x] Enable RLS on all 14 public application tables and verify 19 policies.
- [x] Restrict quote-ingestion to `vyra_quote_ingest`; it cannot mutate customer accounts, orders or ledgers.
- [x] Verify anonymous roles cannot read accounts/orders, cannot open paper accounts, and cannot execute the global order matcher.
- [ ] Run real JWT-backed cross-user isolation tests with two synthetic users across profiles, watchlists, accounts, orders, positions, fills and ledger.
- [ ] Test paper-account opening, market/limit order, duplicate idempotency, cancellation, quote freshness, concurrency, rollback and journal balance using synthetic users.
- [ ] Complete backup export and restore test; Neon Free is for demo/paper only, not a live brokerage book of record.
- [ ] Complete JWT-backed account isolation and application integration testing with two synthetic users. The direct grants/RLS catalogue inspection has passed, but it is not a substitute for session-level tests.
- [ ] Exercise paper account opening, market/limit orders, idempotency retries, cancellation, quote-age rejection, risk limits, concurrent submissions, fill rollback and balanced journal posting against Neon.
- [ ] Complete Neon email OTP delivery, password recovery, session refresh, sign-out and reset-session revocation tests using a controlled test mailbox.
- [ ] Verify all server-side credentials are absent from browser bundles, Git history and API responses.
- [x] Run unit tests, typecheck, lint and production build; all four passed in GitHub Actions on commit `9f0e6d65ceed9a53fdf5457f600d5a67adc37783`.
- [ ] Verify the latest documentation-only CI run completes successfully as well.
- [ ] Test encrypted database export and restoration; keep Neon Free strictly to synthetic development and paper trading, never a live regulated brokerage book of record.
- [x] Leave Supabase projects 9N8 and Space Ledger completely untouched.


## P0 — Hackathon and investor positioning

- [x] Define VYRA's competitive wedge as evidence-backed market access and provider interoperability rather than a generic broker clone.
- [x] Commit hackathon/investor thesis, five-minute demo script, customer model and proof-point roadmap.
- [x] Add a working AccessGraph UI, public API, Kenya source register and default-deny test suite.
- [ ] Capture a real end-to-end demo video from a verified running deployment.
- [ ] Interview at least 15 broker, fund-manager, compliance and operations buyers; record validated pain and willingness to pay.
- [ ] Obtain two written design-partner letters of intent and one signed sandbox/data access agreement.
- [ ] Measure false-block rate, rule-review time, adapter onboarding time, reconciliation mismatches and event-recovery rate in a real partner sandbox.

## P0 — Provider checklist implementation

- [x] Map the supplied third-party Brokerage Launch Checklist to VYRA's actual system state.
- [x] Record the current product as partner-led market access, not an owned brokerage.
- [x] Add VYRA brand/favicon and an installable web manifest.
- [x] Add legal document publication-status routes for AML, payment policy, terms, order execution, privacy and fees; they explicitly do not pretend the missing provider PDFs exist.
- [x] Add an optional Google Tag Manager integration that remains off until a visitor opts into analytics.
- [x] Prepare an App Store listing draft for the paper-only prototype and record Google/Apple financial-app eligibility restrictions.
- [ ] Receive and approve the provider's six legal PDFs before publishing real policies.
- [ ] Select provider, contract and verified initial jurisdiction/product scope.
- [ ] Verify domain ownership, custom business email and social profile URLs.
- [ ] Complete approved app icon, feature graphic, mobile screenshots and native iOS/Android builds.
- [ ] Build and approve affiliate offer, commission, promotion, attribution and payout controls.
- [ ] Implement or integrate provider-owned KYC, AML, billing, liquidity, dealing and reporting modules under contract.
