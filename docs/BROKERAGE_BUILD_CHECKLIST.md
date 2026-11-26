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
- [ ] Create a versioned regulatory perimeter register by country, product, customer type and activity.
- [ ] Obtain external Kenyan legal advice on ISPP, broker-dealer, online forex and referral boundaries.
- [ ] Request written CMA classification guidance for VYRA's exact customer journeys.
- [ ] Download and reconcile current 2025 General Licensing Regulations and 2026 CMA ISPP / broker-dealer checklists.
- [ ] Select a single first operating model: information-only hand-off, ISPP, or appointed/introducing partner.
- [ ] Select one starting country and one starting product class.
- [ ] Assign owners for compliance/legal, privacy, security, customer complaints, partner management and reconciliation.
- [ ] Add formal go/no-go and change-approval records.

## P0 — Infrastructure and deployment

- [!] Provision a dedicated VYRA Supabase project. Current organisation is at its two-active-free-project limit.
- [ ] Find another approved organisation with free project capacity, or separately approve a specific project lifecycle change. Never reuse another product database by assumption.
- [ ] Apply the reviewed VYRA database migration only after isolated project provisioning.
- [ ] Verify tables, grants, RLS, RPC permissions, triggers and ownership.
- [ ] Run Supabase security advisors and resolve findings.
- [ ] Configure Auth site URL, redirect allow-list, email delivery and password recovery.
- [!] Create a free Render demo service only after selecting My Workspace or JOJO; neither service has been created.
- [ ] Keep GitHub private; do not buy a Vercel upgrade or make the repository public to bypass current limitations.
- [ ] Add a pinned npm lockfile and use deterministic npm ci in CI.
- [ ] Run GitHub Actions unit tests, typecheck, lint and production build and retain the actual logs.
- [ ] Add secret scanning, dependency auditing and branch protection.
- [ ] Separate health and readiness checks without exposing secrets or infrastructure metadata.
- [ ] Document backups and test restoration before storing any real personal data.

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

- [ ] Build a jurisdiction policy engine with default-deny behaviour for unknown country or customer type.
- [ ] Build a partner capability registry for market data, onboarding, accounts, KYC status, deposits, withdrawals, balances, positions, orders, statements and support.
- [ ] Build a partner directory with legal entity, regulator, licence, category, scope, official register link and evidence date.
- [ ] Build a product catalogue with identifier, legal provider, asset class, issuer/manager, currency, domicile, customer restrictions, fees and risks.
- [ ] Add partner-specific country/product allow-lists and emergency disable switches.
- [ ] Add versioned consent and privacy event history.
- [ ] Add pseudonymous referral events without personal data in URL parameters.
- [ ] Add link versioning, partner approval, attribution expiry, duplicate/referral fraud controls and audit history.
- [ ] Add a provider hand-off screen explaining that account opening takes place with the named partner.
- [ ] Add source timestamps and last-verified dates to data and partner cards.
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
