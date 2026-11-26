# VYRA CFD Traderoom — implementation status

**Status:** read-only market-data surface under development on `feat/brokerage-crm-operations-desk`.

## Implemented in this slice

- A dedicated `/cfd` traderoom route and homepage navigation entry.
- A server route that reads only enabled rows from `cfd_contracts` and fresh, database-authorised rows from `cfd_quotes`.
- Contract search and asset-class filtering.
- Bid/ask, provider name, quote classification, observation time and calculated spread in basis points.
- Stale, invalid, missing and future-dated quotes are treated as unavailable.
- An explicit empty state when the contract registry has no enabled instruments.
- No fallback to crypto/spot quotes, demo instruments or invented market prices.
- No customer order, leverage or account mutation endpoint is exposed by this slice.

## Current blockers

The CFD reference migration is still on the feature branch and must be reviewed and applied to the correct Neon environment. The current review database was intentionally tested with zero contracts, zero quotes and zero margin policies. The live/main Neon branch has not been migrated. The traderoom will therefore show a schema-not-ready or empty state until the required migration and provider onboarding are completed.

## Required next build before paper CFD orders

1. Contract import/review workflow with source evidence, provider symbol mapping, contract version history and independent approval.
2. A documented CFD feed adapter with entitlement, source timestamp, quote kind, sequence/duplicate handling, clock skew checks, stale thresholds, outlier checks and a kill switch.
3. A country × customer category × contract × notional-tier margin policy lookup, with approved-by, reviewed-at, evidence URL and effective dates. No global leverage fallback.
4. A separate CFD paper account and append-only paper ledger, distinct from the existing cash/spot paper account.
5. Server-side order acceptance with idempotency, bid/ask execution semantics, margin reservation, execution quality record, position valuation, financing and corporate-action adjustments.
6. Tested partial close, cancellation, gap/slippage, margin call, forced liquidation, price halt, stale feed, negative equity and daily reconciliation cases.
7. A final release gate confirming that all exposed customer routes remain paper-only and no live LP, PSP, deposits or withdrawals are enabled.

## Safety boundary

A quote labelled `executable` by a provider is not evidence that VYRA can execute it. A market-data adapter is not a liquidity bridge. A paper A-Book/B-Book/Hybrid route is not a production dealing configuration. Live trading must remain disabled until legal entity, permissions, client counterparty, provider contracts, market-data rights, capital, client-money safeguards and independent controls are verified.
