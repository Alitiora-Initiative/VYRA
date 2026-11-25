# VYRA architecture

## Product boundary

VYRA is a multi-asset brokerage software foundation with separate market-data and execution adapters for crypto, equities, FX and commodities. It is not a licensed broker, custodian, exchange, money transmitter or investment adviser. Live trading, deposits, withdrawals and custody are disabled.

## Implemented application domains

- Identity: Supabase Auth email/password sign-up, sign-in, callback, sign-out and password recovery; profiles use the authenticated user ID and RLS.
- Instrument catalogue: database-backed catalogue for crypto, equities, FX and metals.
- Market data: CoinGecko crypto snapshots and Twelve Data batch quotes. Providers return their own timestamps; quote freshness is enforced before paper execution. Free-tier caching is intentionally conservative.
- Paper OMS: account creation, market/limit orders, cancellation, UUID client idempotency, stale-quote rejection and user-scoped matching of open paper orders.
- Paper risk: order notional, position exposure, daily realised-loss stop, cash reservations, share reservations and explicit adverse-slippage assumption.
- Paper accounting: append-only double-entry journal, balanced transaction triggers, cash/position/equity/realised-P&L accounts, immutable audit events and user-owned read access. Paper account cash, reservations and positions are aggregated in Postgres to avoid REST row-limit truncation.
- User preferences: user-owned RLS watchlist and display-name profile updates.
- Execution boundary: one provider capability contract per asset class. All live adapters reject execution.

## Request flow

1. Authenticated user submits a paper order with a client-generated UUID idempotency key.
2. API authenticates the user, validates payload, finds an enabled instrument and a fresh stored provider quote.
3. PostgreSQL checks account ownership, USD quote-currency support, order/position/daily-loss risk and existing cash/share reservations.
4. Marketable orders are filled inside a database transaction using the configured slippage assumption; non-marketable limit orders remain open.
5. Each fill writes order state, fill record, position change, balanced ledger journal and immutable audit event in the same transaction.
6. Provider quote refresh can match only the currently signed-in user's own paper account. Public visitors cannot trigger other customers' paper orders.

## Asset-class separation

| Asset class | Data adapter | Execution |
| --- | --- | --- |
| Crypto | CoinGecko | Disabled provider slot |
| Equities | Twelve Data | Disabled provider slot |
| FX | Twelve Data | Disabled provider slot |
| Commodities | Twelve Data | Disabled provider slot |

A symbol being visible does not mean it is supported for paper execution. The first paper ledger is USD-only and rejects quote currencies requiring FX conversion. This avoids silently mixing currencies or presenting a false converted balance.

## Infrastructure

Next.js runs as a Node server. Supabase provides Auth, Postgres and RLS when a dedicated VYRA project is configured. The migration lives in `supabase/migrations`. The Render free blueprint is included for an eventual preview deployment; Vercel linking is not available for this private organisation-owned GitHub repo on the currently connected Hobby team.

## Security requirements before production

Secrets server-side; MFA; recovery controls; origin/CSRF protections; rate limits; signed webhooks; strict validation; role separation; tamper-resistant audit; dependency/secret scans; backup and restore tests; independent security review. Do not expose service-role keys or broker credentials to the browser.

## Execution policy

Paper trading is the only order execution mode. Live order execution remains disabled until jurisdiction-specific legal/regulatory review, provider approval, KYC/AML/sanctions controls, client money/custody architecture, funding, provider conformance tests, settlement/reconciliation, monitoring, incident and kill-switch procedures, security review and production certification are complete.

## Accounting scope

The ledger is a paper ledger only. It is not suitable for customer funds. Multi-currency balances, holds for real settlement, margin, shorting, derivatives, financing, fees, deposits, withdrawals, bank reconciliation and custody are not implemented.
