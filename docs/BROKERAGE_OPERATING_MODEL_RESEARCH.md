# VYRA Brokerage Operating Models — Research and Product Decision

**Research date:** 26 November 2026  
**Decision:** VYRA must keep the legal operating model separate from the technical order-routing or hedging model. The code in this branch is a paper policy engine; it does not establish permission to conduct brokerage activity.

## 1. Why the old A-Book / B-Book / Hybrid labels are incomplete

A-Book, B-Book and Hybrid describe how a provider/broker transfers or retains market risk. They do not tell us, by themselves, who legally contracts with the customer, who is principal, who holds the customer account, who is permitted to market, or which firm is accountable for execution.

VYRA now treats these as two separate classifications:

1. **Operating / counterparty model:** technology partner, agency-routed, matched-principal, market-maker or hybrid.
2. **Execution / risk-transfer model:** straight-through processing, systematic net-residual hedging, partial risk internalisation or risk warehousing.

A model may only be selected by a dated, approved country × client-type policy with documented permissions, venue evidence, conflicts controls and best-execution policy version.

## 2. Operating models compared

| Model | What it means | Main revenue shape | Main constraints and conflicts | VYRA fit |
|---|---|---|---|---|
| **Technology / platform partner** | VYRA supplies approved software, workflow, CRM, analytics or branded interface. A regulated principal owns client onboarding, account, money, contracts and execution. VYRA does not receive or execute client orders unless that activity is separately classified and authorised. | Fixed SaaS / licence fee, integration and support fee; any per-account or referral fee needs local review. | The actual activity matters. Lead generation, solicitation, recommendation, transmission of orders, onboarding decisions or handling money can cross a regulatory boundary. “White label” does not transfer a licence to VYRA. | **Best first-stage model to investigate** because it avoids pretending VYRA can operate as a broker on its current capital and evidence. Needs a written activity/perimeter opinion and an accountable licensed partner. |
| **Agency / non-dealing access** | The licensed intermediary links the client to external FX/CFD markets and earns commission or disclosed spread mark-up without market making. | Transparent commission and/or disclosed spread mark-up, net of LP, bridge and servicing cost. | Agency label is not a universal licence category. In Kenya, the CMA’s non-dealing online FX broker definition is a link between market and client for commission/spread mark-up and does not engage in market-making. The entity performing the activity must hold the relevant authorisation. | A possible later Kenya path, but the original capital and liquid-capital requirements make it a high-capital option rather than a low-cost loophole. |
| **Straight-through processing (STP)** | A technical order-flow arrangement sends each eligible client order to an external venue/provider rather than intentionally retaining that flow internally. | Commission/spread revenue less LP and bridge costs. | STP is an execution workflow, not a substitute for a licence or a guarantee of agency legal status. A broker can still be the client's contractual counterparty even where it hedges externally. | Build as an execution adapter mode only after legal principal, route, data, counterparty and execution policy are identified. |
| **Matched principal / back-to-back** | The firm enters a client-facing transaction and an opposite/similar external transaction, seeking to match market risk. | Usually commission/spread plus execution economics. | This is still principal activity in FCA/MiFID guidance; it is not a safe “agency loophole”. The firm retains timing, basis, execution, counterparty and operational risks. | Do not call this non-dealing. Requires the exact permissions, disclosures, best-execution, conflicts and records. |
| **Market maker / internalised principal** | The broker deals with the client as principal and retains some or all of the exposure internally. | Spread/commission plus principal-book P&L. | Structural client/broker conflict must be managed. Requires authorised dealing activity, capital, independent risk controls, surveillance, dealing governance and transparent client-facing terms. Client losses are not a dependable or acceptable business model. | Not an appropriate starting model for VYRA. Keep paper-only and default denied. |
| **Hybrid** | A regulated principal retains exposure within an explicit risk appetite and externally hedges the residual or excess exposure. | Disclosed spread/commission plus external costs and any retained-book P&L. | The split must follow objective exposure, liquidity, concentration, provider capacity and approved limits—not a client's profitability, win rate, losses or predicted likelihood of loss. Requires both principal/dealing and external hedge permissions plus auditability. | Useful as a future provider-side capability; no live hybrid routing by VYRA. |

### Important FCA distinction

The FCA Handbook says own-account dealing with clients is treated as execution of client orders for best-execution purposes. It also says matched-principal back-to-back execution of different clients' orders is regarded as acting as principal. Best execution takes account of price, costs, speed, execution/settlement likelihood, order size and nature, and the firm must have an order-execution policy. These are UK rules and guidance, not a statement that every market uses identical wording; the key design lesson is to keep “technical hedge” separate from “legal client counterparty”.

## 3. Newer execution and hedge-orchestration patterns

B2BROKER's public B2CONNECT release notes document a useful set of current design patterns. They are vendor product capabilities, not independent proof of performance or permission:

- **Straight-through processing:** standard route for each eligible order to a liquidity provider.
- **Systematic hedging of net residual:** aggregate buy/sell flow by symbol; hedge only the residual net position after a trigger, timer, schedule or approved policy event. This can reduce repeated LP requests under high flow, but increases the importance of accurate aggregate position, restart recovery and exposure alerts.
- **Partial risk internalisation:** split a defined percentage between an internal position and external hedge, with explicit per-symbol controls. This remains principal risk and must not be relabelled agency simply because part of the risk is hedged.
- **Internal risk warehousing:** hold an approved exposure within a maximum retained-risk limit. This is not safe without dealing permissions, capital, conflicts controls and independent exposure monitoring.
- **Tiered margin profiles:** apply a different margin rate to each notional slice, instead of applying one flat leverage across a large position. VYRA's new engine supports explicit marginal tiers and fails on gaps or missing policy.
- **Iterative stop-out liquidation and recovery:** liquidate through an idempotent state machine, wait for final order states, recalculate account risk, resume safely after a restart and stop if the account recovers above the approved threshold.
- **LP resilience:** independently monitor each provider connection, invalidate stale symbols, detect silent drops, reconnect and recover the orders missed during an interruption.

VYRA's paper implementation adds:
- progressive notional-tier margin calculation;
- an explicit technology-partner / agency / matched-principal / market-maker / hybrid policy resolver;
- a multi-factor paper venue ranking model;
- STP, systematic net-residual, partial internalisation and risk-warehousing hedge-plan simulations;
- strict controls against using client profitability or individual client P&L as an input to hedge allocation.

It does **not** include live FIX connectivity, an LP feed, order submission, actual fill recovery or production liquidation.

## 4. Execution quality: compare total expected consideration

A venue should not win only because it shows the smallest headline spread. VYRA's paper ranker estimates:

`estimated_cost_bps = price_impact + venue_fees + expected_slippage + nonfill_penalty + latency_penalty`

Each venue is eligible only when:
- the route and instrument are approved;
- the market session is open;
- the source labels the quote as executable;
- bid/ask is positive and not crossed;
- quote timestamp is within the approved freshness window;
- available depth covers the requested amount;
- venue latency is within policy;
- fee, slippage and fill-probability inputs are present and valid.

The independent benchmark also requires an approved source and fresh timestamp. If no venue passes, the engine fails closed. This model is a decision-support harness, not proof of best execution. Real deployment needs provider quote and order events, fees, fills, rejections, price improvements, slippage, partial fills, execution venue review and jurisdiction-specific order-execution policy.

## 5. Risk-control update from 2026 supervisory work

### ASIC REP 828 (Australia, 20 January 2026)

ASIC reported widespread failures in CFD distribution and controls. The report describes opposing-position “margin discounts” that reduced margin by netting or using only the larger leg. ASIC said these practices could create excessive leverage, increased overnight funding costs, missed close-out protection and sudden margin increases when one leg was closed; issuers were required to remediate affected consumers. It also raised concerns with an exotic barrier-like CFD product and customer outcomes.

**VYRA rule:** gross open-position margin is summed by default. Long and short positions do not automatically cancel each other’s margin. Any risk-offset treatment must be a specific permitted market/client policy, separately reviewed, versioned and evidenced; it cannot be silently inferred by the engine.

### ESMA statement (European Union, 24 February 2026)

ESMA reminded firms that leveraged derivatives marketed as perpetual futures/perpetual contracts may fall within the existing CFD product-intervention perimeter where they meet the CFD definition. It pointed to leverage restrictions, risk warnings, margin close-out, negative-balance protection and inducement restrictions, together with narrow target markets, appropriateness and conflicts controls.

**VYRA rule:** do not assume that changing the label from “CFD” to “perpetual”, “synthetic” or “on-chain” changes the regulatory treatment. Legal classification follows the product's economic substance and distribution activity.

## 6. Kenya-specific findings and limits

The CMA's 2017 Online Foreign Exchange Trading Regulations explicitly include CFDs based on foreign underlyings. They distinguish:
- dealing online FX brokers, acting as principal and market maker; and
- non-dealing online FX brokers, linking a client to the FX market for commission or spread mark-up without market making.

The 2017 regulation's original text sets minimum paid-up capital at KES 50 million for a dealing broker and KES 30 million for a non-dealing broker. It also states liquid-capital requirements for a dealing/non-dealing broker of KES 30 million or 8% of liabilities, whichever is higher. Those figures are quoted from the underlying rules, not presented as a final legal opinion for a 2026 application.

The 2023 Online FX amendment adds an annual fee of 3% of gross trading revenue for both dealing and non-dealing brokers. The 2023 amendment is listed in the CMA regulatory framework. VYRA must reconcile the full operative instruments, 2025 General Licensing Regulations where relevant, current CMA circulars and current application requirements with a Kenyan capital-markets lawyer before making a capital commitment.

On 17 November 2026 the CMA announced new non-dealing online FX broker licences for DOO Securities Kenya Limited and VCG Markets Limited, and described their authorised model as providing regulated access to global FX and CFD markets without taking positions against clients. That announcement demonstrates current regulatory activity in the non-dealing category; it does not make either entity a VYRA partner or imply a licence can be shared.

**VYRA decision:** first investigate the technology/platform-partner relationship with a licensed principal, keeping the principal responsible for the customer contract, account, KYC decisions, client money, risk policy and execution. Get written legal advice on whether VYRA's precise role is technology provision, marketing/introducing, reception/transmission of orders or a regulated activity. A white-label agreement, API integration or vendor statement that “no entity is required” is not a legal permission.

## 7. Commercial model and conduct

Preferred early-stage pricing to investigate:
- fixed implementation/integration fee;
- fixed monthly software and support fee;
- transparent hosting, API, market-data and customer-service cost allocation;
- carefully reviewed per-account software charge where permitted.

Any per-trade, revenue-share or introducer fee needs to be reviewed against the exact legal activity, local inducement rules, conflict policy, agreement and customer disclosures. Do not build revenue around client losses, aggressive deposits, high leverage or trading volume as a proxy for client success. Do not market expected returns.

## 8. VYRA delivery decision

1. Keep the first release partner-led and technology-only; no customer orders or money through VYRA.
2. Build the paper margin, venue-ranking and hedge-orchestration models so they can be conformance-tested before vendor selection.
3. Build the provider adapter around versioned REST/WebSocket/FIX contracts, idempotency keys, sequence/replay, quote invalidation, order-state recovery and reconciliation.
4. Require named liquidity providers, legal entity, licence, country/instrument list, data entitlement, execution terms, price/fill evidence and service levels before any sandbox or production connection.
5. Keep every operating model default denied until its legal evidence, policies and approvals exist.
6. Do not merge this feature branch or apply its migrations to the VYRA main database until review and approval.

## Sources

- CMA, Capital Markets (Online Foreign Exchange Trading) Regulations 2017 (Kenya Law): https://new.kenyalaw.org/akn/ke/act/ln/2017/226/eng%402023-10-06/publication
- CMA, regulatory framework and 2023 Online FX amendment: https://www.cma.or.ke/regulatory-framework/
- CMA, 17 November 2026 licences: https://www.cma.or.ke/?Itemid=295&id=449&option=com_content&view=article
- FCA Handbook, COBS 11 dealing, matched principal and best execution: https://handbook.fca.org.uk/handbook/cobs11
- ASIC, REP 828, 20 January 2026: https://www.asic.gov.au/regulatory-resources/find-a-document/reports/rep-828-risky-business-driving-change-in-cfd-issuers-distribution-practices
- ESMA, CFD product-intervention reminder, 24 February 2026: https://www.esma.europa.eu/press-news/esma-news/esma-reminds-firms-of-their-obligations-under-cfd-product-intervention-measures
- B2BROKER, B2CONNECT release notes (2026): https://docs.b2broker.com/b2connect/release-notes
- B2BROKER product documentation: https://docs.b2broker.com/
