# VYRA CFD Execution Router and Hedge Models

**Status:** paper-only calculation and control layer; not connected to a broker, FIX bridge, liquidity provider or customer order endpoint.

## 1. Separation of concerns

VYRA must not use A-Book/B-Book/Hybrid as the only model field.

- **Operating model** identifies the service and counterparty structure: technology partner, agency-routed, matched principal, market maker or hybrid.
- **Execution policy** defines eligible venues, price quality, costs, order constraints and client/jurisdiction permissions.
- **Hedge policy** defines how aggregate exposure is routed or retained: straight-through, systematic net residual, partial internalisation or risk warehousing.

The distinction is important: matched principal is still principal activity in FCA guidance, even though the broker attempts to back-to-back hedge the exposure. A technology partner has no customer-order execution route in this model.

## 2. Paper venue ranking

`rankPaperExecutionVenues()` compares eligible venue candidates using:

`price impact (bps) + fees (bps) + expected slippage (bps) + non-fill penalty (bps) + latency penalty (bps)`

The price-impact term compares the selected venue's buy ask or sell bid against a separately sourced reference benchmark. A venue is rejected if it is unapproved, the instrument is not allowed, the session is closed, the quote is not provider-labelled executable, the quote is crossed/stale/future-dated, displayed depth is insufficient, latency breaches policy or cost/fill evidence is invalid.

The policy must be marked approved and include a version, freshness limits, maximum latency and explicit penalty values. The benchmark also needs a source and timestamp. If no venue qualifies, no route is selected.

The score is a deterministic research/test model. It does not guarantee a best result, and it is not a regulatory best-execution report. Real certification requires actual LP quote snapshots, order acknowledgements, fills, rejects, costs, timing, partial fills, market impact, venue review and client-facing execution policy.

## 3. Hedge orchestration models

| Mode | Paper behaviour | Required policy |
|---|---|---|
| `straight_through` | Route the entire eligible amount externally; retain zero simulated exposure. | External route and instrument permission. |
| `systematic_net_residual` | Aggregate symbol exposure and hedge a configured fraction only after a notional trigger; the residual must remain under the retained exposure limit. | Principal-risk permission, external hedge permission, trigger, hedge ratio, maximum retained exposure and restart/reconciliation design. |
| `partial_internalisation` | Split aggregate symbol exposure by an explicit internalisation ratio and hedge the residual externally. | Dealing/principal and hedge permission, ratio, maximum retained exposure, conflicts policy and full audit trail. |
| `risk_warehousing` | Retain the aggregate position only while below its explicit exposure limit. | Dealing/principal permission, conflicts policy, capital/stress limits, monitoring and kill/close-only controls. |

None of the functions accepts client P&L, customer win rate, deposit balance, “profitable trader” tag or loss propensity as an input. Hedge decisions use aggregate symbol exposure and documented route policy only.

These are vendor-inspired technical patterns. They are not regulatory categories, and a broker remains accountable for its legal client counterparty, disclosures, best execution, conflicts, capital and dealing permissions.

## 4. Tiered margin

`calculateTieredCfdMargin()` supports explicit marginal-notional tiers:

`required margin = Σ (notional slice in tier ÷ approved maximum leverage for that tier)`

Tiers must begin at zero, be contiguous, non-overlapping and cover the full notional. A gap or missing method blocks calculation. When order-risk calculation includes tiers, VYRA takes the greater of:
- the margin implied by the client's requested leverage; and
- the approved marginal tier schedule.

No default leverage, fallback tier or cross-client tier borrowing is permitted. Tier definitions and the method must come from the selected broker/provider and the exact country/client policy.

## 5. Margin accounting and offsetting

Open-position margin is summed gross by default. Opposing long and short legs do not automatically cancel each other's margin. Pending-order and other reservations reduce free margin separately. Any legally permitted offset must be an explicit policy with its own evidence, stress test and customer disclosure; do not silently grant a margin discount.

This is a risk control, not an assumption that all regulators use identical rules. ASIC's 2026 REP 828 described harm from opposing-position margin discounts under Australia's CFD product-intervention framework.

## 6. Database policy registry

Migration `20261126000600_vyra_cfd_execution_policies.sql` adds `cfd_execution_policies` for:
- country and client category;
- operating-model classification;
- agency, principal, matched-principal, dealing and external-hedging permission flags;
- best-execution and conflicts-policy versions;
- hedge mode, thresholds, ratios and retained-exposure limit;
- evidence URL/reference, reviewer and effective dates;
- draft/approved/suspended/expired status.

The table is empty by default, RLS is enabled and authenticated/anonymous client access is revoked. A software configuration cannot itself grant a licence; approval requires external legal and governance evidence.

## 7. Remaining implementation before even paper CFD orders

- A separate CFD paper account and immutable journal.
- Server-side order state machine with preview/accept/cancel/partial-fill/reject/expire, idempotency and append-only event history.
- Reservation, release and reconciliation of order margin.
- Provider-sourced contract registry and market feed with sequence numbers, heartbeat, stale-symbol invalidation, source entitlements, clock checks and circuit breakers.
- A conformance-tested adapter for the chosen vendor's API/FIX contract, including reconnect recovery and idempotent replay.
- Partial close, financing calendar, triple swap, dividends, contract roll, price halt/gap and multi-currency conversion.
- Iterative close-out state machine with deterministic ordering, wait-for-final-state, account revaluation, retry/recovery and stop conditions.
- Independent expected-result calculations, replayable execution reports and daily reconciliation.
- Keep all customer routes paper-only; no LP, PSP, deposits or live orders until legal, partner, security and operational release gates pass.

## 8. Validation boundary

The engine and tests in this branch validate mathematical/policy behaviour only. They are not a vendor conformance certificate, penetration test, legal opinion, live-trading certification or evidence of access to executable market data.
