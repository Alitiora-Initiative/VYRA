# VYRA — Competitive Strategy, Hackathon Thesis and Investor Brief

**Version:** 1.0  
**Updated:** 26 November 2026  
**Product thesis:** VYRA is building a regulatory-aware access and orchestration layer for multi-provider financial markets. It is not attempting to become an unlicensed global broker.

## 1. The strategic move

Do not win by cloning a broker terminal, adding more asset icons or claiming hundreds of instruments. That is easy to copy, expensive to license and weak as an investor story.

VYRA's proposed wedge is **AccessGraph + Broker Interoperability**:

1. A versioned rules engine maps jurisdiction × customer type × product × actual activity.
2. Every decision is linked to source evidence, the relevant regulator, a provision, a verification date and an accountable human review.
3. A partner capability graph shows which provider is authorised and contractually able to perform each role: account opening, KYC, safeguarding, execution, custody, reporting and complaints.
4. A canonical API normalises the parts of the customer journey a partner expressly permits.
5. A reconciliation layer compares provider-sourced account, order, fill, position and fee events, and opens an exception instead of inventing a status.
6. A clean customer interface can sit over several partner infrastructures without VYRA taking custody or pretending that one licence covers every product and country.

This makes VYRA a software infrastructure and distribution-control company first. A broker-branded consumer platform can come later through a properly appointed principal and approved scope.

## 2. Why this can matter

Financial access is fragmented by geography, product category, intermediary role, onboarding, market-data rights, payment/custody arrangements and customer eligibility. The integration problem is not simply calling an API. It is knowing whether a given provider can legally serve a particular customer for a particular product and activity, and whether every party has agreed to the exact arrangement.

Existing aggregators often optimise for instrument coverage and user interface. VYRA's proposed differentiator is to make the **permission and evidence graph part of the runtime**, then make the same graph govern onboarding, provider routing, promotions and post-trade reconciliation.

The initial target customer is not every retail investor on earth. It is a regulated broker, investment firm, fund manager, fintech or distribution partner that wants a traceable digital front end without building every country/product control from scratch.

## 3. The defensible innovation

### AccessGraph — rules as code with provenance

Each route has a structured key:
jurisdiction + customer_type + product + activity + provider + effective_date.

Each rule stores:
- rule-pack version and last-reviewed date;
- regulator/statutory source and source URL;
- relevant section/provision;
- activity covered and activity explicitly not covered;
- signal (licence route, approval route, promotion rule, data restriction, unresolved);
- evidence completeness and expiry/reverification policy;
- legal/compliance reviewer and approval record;
- default-deny outcome when a dimension is missing.

The engine never answers “legal” or “illegal” as a general statement. It returns the current evidence signal and required review. Unassessed jurisdictions remain blocked. Even a fully completed checklist still requires human go/no-go.

### Partner Capability Graph

The working Provider Graph at `/provider-graph` and `GET /api/provider-graph` is the second half of the wedge. It models eleven supplier/accountability roles and currently shows the five researched provider records as disconnected and unverified; none has a VYRA-confirmed contract, licence, country scope, sandbox or production approval. The system deliberately refuses to infer a service from marketing claims or an available API.

The provider graph is distinct from the legal rule graph. A provider may provide an API but not custody, or may custody assets but not accept customers from the target country. VYRA needs explicit capability records and evidence for each role:
- account and KYC ownership;
- customer type, country and product eligibility;
- assets/currency and account structure;
- order preview, submit, cancel and event lifecycle;
- payment, withdrawal, custody, segregation and reconciliation;
- market-data source, display and redistribution rights;
- statements, complaints, support and incident handling;
- API scopes, sandbox, rate limits, signing, idempotency and production certification.

A provider cannot become "approved" because an employee added a logo or because an endpoint responds.

### Reconciliation as a first-class feature

A trade API response is not the source of truth for settlement. VYRA's integration contract should distinguish accepted, pending, partially filled, filled, cancelled, rejected, settled and reconciled states. Each inbound event is signed, deduplicated and sequenced. Daily statements reconcile cash, positions, fills, fees and corporate actions. A material mismatch disables the affected feature and opens a discrepancy case.

This is more valuable than another pretty chart because it addresses the expensive operational failures of multi-provider finance.

## 4. The lawful route — no regulatory loophole

The commercial shortcut is **partner-led infrastructure**, not evasion:
- VYRA supplies software, neutral discovery, evidence controls and approved hand-off.
- The regulated principal owns the account relationship and the activities it is authorised to perform.
- Customer money and assets stay with the authorised bank/custodian/provider.
- VYRA only transmits orders, displays account data or tracks leads if the exact role is legally classified, contractually permitted and technically approved.
- Every country/product/activity combination remains disabled until evidence is complete.

A sandbox is a possible supervised test route for genuinely innovative work, not a blanket exemption. The CMA's published eligibility page says applicants should be a Kenyan-incorporated company or be licensed by an equivalent securities regulator and intend to provide an innovative service in Kenya after exiting the sandbox. It excludes products, services or business models already clearly addressed under existing laws and regulations. Incorporation, eligibility and a real innovation thesis therefore need to be checked before relying on it.

The Kenya VASP Regulations 2026 are particularly important: regulations 4 and 6 apply to persons offering virtual-asset services in or from Kenya; targeting local consumers or deriving economic benefit/income from Kenya can establish this connection without physical presence. Regulations 123–125 separately address virtual-asset advertising and promotion. An offshore server, foreign broker or affiliate label is not a safe harbour. The AccessGraph maps these rules and keeps crypto services/promotion disabled pending proper classification and approvals.

## 5. Why this is a hackathon-worthy project

Recent fintech hackathon calls commonly assess problem and impact, originality, working functionality, technical execution, feasibility, scalability, customer benefit, business potential and presentation quality. VYRA should demonstrate all of these in a single coherent story.

| Judge question | VYRA proof to show |
|---|---|
| Is the problem real? | Live demo of an unassessed country/product route being blocked and the exact missing evidence displayed |
| Is it original? | Rules-as-code graph connected to partner capability and event/reconciliation graph, not only a trading dashboard |
| Does it work? | Automated tests for Kenya VASP/CIS/securities/forex rules, unassessed foreign markets, missing gates and default-deny |
| Is it technically substantial? | Next.js, Neon Postgres, Neon Auth, RLS, versioned rules, source evidence, provider-neutral contracts and paper order/ledger |
| Is it responsible? | Hard-disabled client-money and live execution paths; no invented licence, partner or source |
| Can it scale? | Add new jurisdiction rule packs and provider adapters without rewriting the customer terminal |
| Is there business potential? | B2B software/API to regulated principals and fund distributors; optional customer-facing access layer only where approved |
| Can the team deliver? | One clear five-minute demo and a working repository with test output, architecture, roadmap and honest limitations |

Do not tell judges that VYRA is a broker, that crypto/forex/securities are cleared, that any provider is connected, or that a regulator has approved the product. The demo is the policy/control platform and paper market workspace.

## 6. Five-minute demo script

**0:00–0:35 — The pain**  
“Market access is fragmented. Connecting a quote or order API is easy compared with proving that this provider can serve this resident, for this product, through this activity, with the right custody and KYC responsibilities.”

**0:35–1:25 — AccessGraph**  
Open `/access-graph`. Choose Kenya + virtual assets + provide a virtual-asset service. Show the mapped 2026 VASP rule, official source, local-targeting/economic-benefit test and the blocked result. Switch to another country; show that the system returns unassessed rather than assuming permission. Switch to Kenya + securities + market information; show that information-only is not a trading permission.

**1:25–2:10 — Provider Graph**  
Open `/provider-graph`. Show that each vendor is unconnected and all eleven roles require evidence. Explain how one provider can offer an API but not own the account, KYC, custody or settlement.

**2:10–2:40 — Customer categories**  
Switch the AccessGraph between retail, professional and institutional investors. Show the customer-type gate and the rulepack’s explicit limitation where its categories are not yet differentiated.

**2:40–3:20 — Partner capability**  
Show that provider records are not automatically approved. An API candidate remains disconnected until legal entity, licence, customer country, product scope, account/KYC ownership, custody, order handling and data rights have dated evidence.

**3:20–4:05 — Market workspace**  
Show provider-sourced quote timestamps, watchlist, USD paper account, paper order, positions and double-entry paper journal. Explain that the simulator tests product UX and order controls, not real trading or returns.

**4:05–4:40 — Reconciliation and failure behaviour**  
Demonstrate tests or a controlled test fixture: duplicate event, stale quote, unknown state or mismatch is rejected/quarantined, not silently marked filled. Show idempotency and append-only journal controls from the code/test report. Do not use fake market prices in the live dashboard.

**4:40–5:00 — Business and ask**  
“VYRA sells infrastructure to regulated firms: evidence-backed market access, partner adapters and reconciled customer journeys. We need one regulated design partner and a scoped pilot, not customer deposits. Our next milestone is a signed sandbox/data agreement and a tested single-country/single-product integration.”

## 7. Investor thesis

### Customer and buyer
- Primary buyer: licensed brokers, investment firms, fund managers, custodians or regulated fintech distributors.
- Secondary buyer: enterprise platforms needing multi-provider market data, account connectivity and reconciliation.
- End user: retail or professional investors only where the principal and local rules permit.

### Revenue hypotheses to validate
1. Annual SaaS/platform licence per regulated institution.
2. Integration and onboarding fee for a new provider or jurisdiction.
3. Usage-based API volume for policy evaluations, partner events and reconciliation.
4. Enterprise premium for audit evidence, monitoring, access-control and branded customer workspace.

Do not build the business around encouraging more trades, deposit sizes or risk-taking. Any referral or distribution fee requires local review, written principal approval and transparent conflict disclosure.

### Defensibility
- Accumulated, reviewed rule/evidence graph across jurisdictions and product categories.
- Certified provider adapter contracts and conformance-test suite.
- Reconciliation and discrepancy history across integrated providers.
- Operational workflow and auditability embedded into the broker's customer journey.
- High switching costs from policy versions, customer event history and reconciliation integrations.

A rules database alone is not a moat. The moat forms only as rule evidence, live partner permissions, production adapter certification, operational data and customer workflows accumulate.

### Evidence investors will demand
- Interviews with 15–20 broker, fund-manager, compliance and operations buyers.
- Two written design-partner letters of intent.
- One signed sandbox or data access agreement.
- One integrated partner sandbox, not just another API candidate.
- Pilot: time to assess a product/country route, onboarding completion, reconciliation mismatch rate, event recovery, false-block rate and partner integration time.
- Security review, tested recovery, privacy/data protection and regulatory legal opinion for the pilot scope.
- Credible pricing willingness and gross-margin model based on actual supplier costs.

Do not claim market size or customer traction until verified. Calculate TAM/SAM/SOM from target institutions and countries with documented sources; do not multiply an arbitrary global retail-investor count by a guessed fee.

## 8. Competitive positioning

| Alternative | Their primary job | VYRA wedge |
|---|---|---|
| Broker's own app | Serve that broker's customers and products | Cross-provider access/evidence controls, if partners permit |
| Trading terminal / white-label platform | Traderoom, CRM, dealing and execution stack | Provider-neutral policy graph and reconciliation layer that can sit beside an existing platform |
| Market-data terminal | Market information and analytics | Country/product/activity launch controls and partner capability evidence |
| Broker comparison / affiliate site | Direct discovery and lead generation | Permission, evidence, custody and execution accountability before activation |
| Generic API aggregator | Normalise data and connectivity | Evidence-linked access decisions plus post-trade reconciliation |

VYRA is not trying to replace an exchange, broker, custodian or enterprise core banking system. It is the interoperable policy and customer-experience layer around authorised providers.

## 9. Roadmap that produces proof rather than slides

### Phase 1 — Demo quality (now)
- AccessGraph interactive simulator, official source register and API.
- Versioned jurisdiction pack with customer-category input and unit tests.
- Provider Graph role/evidence matrix, public API and explicitly disconnected states.
- Market workspace, paper trading and ledger.
- Five-minute demo recording, architecture and short technical report.

### Phase 2 — Design partner (next)
- Interview regulated firms and operations/compliance users.
- Obtain counsel's written classification for one use case.
- Obtain one provider sandbox and data entitlement.
- Build one adapter against that partner's official documentation.
- Test KYC ownership, account link, order preview if permitted, authenticated events, idempotency and statement reconciliation.

### Phase 3 — Controlled pilot
- Written sandbox/pilot approval and defined customer cohort.
- Provider performs KYC and holds assets.
- Smallest approved country × product × customer scope.
- Operations dashboard, incident playbooks, complaints routing and monitored reconciliation.
- Independent security and privacy review.

### Phase 4 — Repeatable infrastructure
- Add the second provider and second jurisdiction only after first-route evidence.
- Measure integration time reduction and operating error rates.
- Convert paid design partners to annual platform contracts.
- Consider customer-facing multi-provider interface only where approved.

## 10. Current verified product baseline

- Next.js 16 / React 19 web application, including AccessGraph and Provider Graph.
- Dedicated Neon Postgres project vyra-markets, Frankfurt; Neon Managed Better Auth and Data API.
- All 14 public VYRA application tables have RLS enabled; dedicated quote-ingestion role cannot mutate customer accounts, orders or ledgers.
- Market-data adapters for CoinGecko and Twelve Data; feeds remain subject to provider terms and commercial redistribution rights.
- Paper accounts, market/limit paper orders, positions, risk limits, order history and double-entry paper journal.
- Provider candidates are research-only; no broker account, production credential or partner appointment is recorded.
- Live execution, customer money, deposits, withdrawals and custody remain disabled.
- A successful GitHub Actions run has passed 16 unit tests, TypeScript, ESLint and production build; further AccessGraph tests and hosted verification remain additional milestones.

## 11. Research and primary sources

- CMA regulatory sandbox: https://www.cma.or.ke/regulatory-sandbox/
- CMA sandbox eligibility: https://www.sandbox.cma.or.ke/index.php/who-is-eligible
- CMA licensing checklists: https://www.cma.or.ke/licensing/
- CMA regulatory framework (including 2025 General Licensing Regulations and 2026 VASP Regulations): https://www.cma.or.ke/regulatory-framework/
- Kenya VASP Regulations 2026, Legal Notice 134: https://www.centralbank.go.ke/wp-content/uploads/2026/11/The-Virtual-Asset-Service-Providers-Regulations-2026.pdf
- CBK/CMA public notice on VASP Regulations: https://www.centralbank.go.ke/wp-content/uploads/2026/11/CBK-CMA-Public-Notice-Operationalisation-of-the-VASP-Regulations-2026-.pdf
- CMA 2023 CIS Regulations, including ISPP: https://www.parliament.go.ke/sites/default/files/2024-03/Capital%20markets%20regulations%2C%202023%20%28LN%20NO.%20170%20OF%202023%2C%20LN%20NO.%20171%20OF%202023%2C%20LN%20NO.%20172%20OF%202023%20AND%20LN%20NO.%20173%20OF%202023%29-compressed.pdf
- Example fintech hackathon criteria: innovation, feasibility, impact, technology and beneficiaries: https://fintech-hackathon.aimit.edu.in/
- Example working-prototype judging criteria: problem/impact, originality, execution, functionality and presentation: https://the-fintech-hackathon.devpost.com/

**Research caveat:** Rules and public checklists change. The rulepack is a product-control prototype, not a comprehensive legal database. Counsel must reconcile the current consolidated statutes, regulator guidance, transitional provisions and the exact facts before any real customer activity.
