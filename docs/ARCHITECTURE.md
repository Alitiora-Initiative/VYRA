# VYRA Markets — Architecture

**Status:** paper-trading prototype / partner-integration foundation.  
**Last verified:** 26 November 2026.

## Product boundary

VYRA is a multi-asset market-information and paper-trading software foundation for crypto, equities, FX and commodities. It is not currently a licensed broker, custodian, exchange, investment adviser, money transmitter, VASP or fund distributor.

The only order execution mode available is simulated paper trading. Real customer balances, deposits, withdrawals, custody, margin, shorting, derivatives, broker execution and paid customer referrals are not enabled. No regulated partner contract, broker production credential or country/product approval is currently recorded.

The intended first commercial model is partner-led: an appropriately authorised principal owns the brokerage or investment account, onboarding and KYC decisions, client assets, funding, execution, clearing, settlement and regulated customer relationship. VYRA may provide only software, market information and those hand-off/data-view functions that counsel and the partner approve in writing. This is a target operating model, not an appointed or approved relationship.

## Application architecture

- **Web app:** Next.js 16 / React 19, Node runtime, responsive dashboard and Neon Auth UI.
- **Identity:** Neon Managed Better Auth email/password. The browser uses `src/lib/neon/auth-client.ts`; server routes use `src/lib/neon/auth.ts` and resolve the current session before protected access.
- **User-scoped data:** `src/lib/neon/server.ts` creates a request-scoped Neon Data API client and passes a JWT from the validated Neon Auth session. Anonymous tokens are used only for routes whose Postgres grants and RLS policies allow public catalogue/quote reads.
- **Privileged quote writer:** `src/lib/neon/market-writer.ts` uses a server-only pooled PostgreSQL connection with the dedicated `vyra_quote_ingest` role. This role can write market quotes only; it cannot place orders or change accounts, positions or ledgers.
- **Market data:** CoinGecko adapter for crypto snapshots and Twelve Data adapter for equities, FX and commodities. Providers must supply actual price values and observation timestamps. Missing, invalid or stale data is reported as unavailable; the app must not create substitute/demo prices.
- **Catalogue:** instruments are stored in Neon Postgres. The seed migration creates catalogue entries, not seeded prices.
- **Paper order management:** protected API routes validate input and invoke Postgres functions for account creation, order submission, matching and cancellation.
- **Risk controls:** order notional, position notional, daily realised-loss limits, available cash/share reservations, quote freshness, UUID idempotency and an adverse-slippage assumption are checked in the paper workflow.
- **Accounting:** append-only paper double-entry journal with deferred balance checks, immutable ledger/audit triggers and account-level aggregate snapshots.
- **Partner access:** candidate list and eligibility logic are research-only. Unknown, expired, suspended or unapproved partners/countries/products fail closed.
- **Privacy:** optional Google Tag Manager loads only after consent and only if `NEXT_PUBLIC_GTM_ID` is valid. No container ID is currently configured.
- **Legal pages:** `/legal/*` routes are publication-status notices, not provider-issued terms, AML or execution policies. The six requested PDFs have not been supplied.

## Request and paper-order lifecycle

1. A signed-in user requests market data or submits a paper order.
2. The server retrieves provider-sourced data and requires a usable observation timestamp.
3. The app resolves the matching enabled instrument in the Neon catalogue.
4. Quotes are written by the restricted quote-ingestion role; the writer cannot access customer money, accounts or orders.
5. The user order API validates symbol, order type, quantity, account identifier and client idempotency UUID, then checks a fresh quote and account-level risk limits.
6. Postgres verifies ownership, account state, currency, available cash/shares, reservations and configured limits inside the transaction.
7. Marketable paper orders are filled with the paper slippage assumption; non-marketable limit orders remain open until a later fresh quote matches.
8. Fill, position, balanced ledger entries and audit event are written transactionally. Cancellation is account-scoped.
9. Quote refresh can match only the currently authenticated user's own active paper account. A public visitor cannot trigger other users' limit orders.

A paper fill is not a broker execution, market fill, promise of execution quality or record of client assets. The initial paper ledger is USD-only and rejects instruments requiring FX conversion.

## Neon infrastructure

- **Project:** `vyra-markets`
- **Region:** Frankfurt (`aws-eu-central-1`)
- **Project ID:** `dawn-wind-08199003`
- **Database:** `vyra`
- **Main branch:** `br-tiny-lake-bhoos1ij`
- **Isolated validation branch:** `vyra-dev` (`br-lively-morning-bhf3wagy`)
- **Migration of record:** `neon/migrations/20261126000100_vyra_core.sql`

Neon Managed Better Auth and the Neon Data API are enabled. The migration is applied to the main branch; `vyra-dev` was created from main for isolated validation. The original Supabase migration is retained as history/reference only and must not be applied to Neon.

The Managed Better Auth `neon_auth."user"` primary key is UUID. VYRA user-reference columns therefore remain UUID and policies use `auth.uid()` (UUID); the separate `auth.user_id()` helper returns text. The migration does not modify Neon-managed auth tables or install triggers on them.

All 14 VYRA public application tables have RLS enabled. Anonymous reads are limited to enabled instruments and quotes. Authenticated direct write grants on orders and ledger tables are not exposed; order/account mutations use narrowly granted Postgres functions with server-side ownership checks. The global matcher is not executable by anonymous or authenticated roles.

### Required server environment

- `NEON_AUTH_BASE_URL`
- `NEON_AUTH_COOKIE_SECRET` (server-only, at least 32 characters)
- `NEON_DATA_API_URL`
- `NEON_MARKET_DATA_DATABASE_URL` (pooled connection for `vyra_quote_ingest`, never the owner role)

Optional provider and analytics settings:
- `TWELVEDATA_API_KEY`
- `COINGECKO_DEMO_API_KEY`
- `NEXT_PUBLIC_GTM_ID` (only after an approved container and consent/legal setup exist)

Secrets must live only in the host secret store. They must never be committed, returned by public APIs or exposed with `NEXT_PUBLIC_*`.

### Authentication configuration

Email/password sign-up is enabled. Email verification is now required using OTP; verification emails are configured to send on sign-up and sign-in, automatic sign-in after verification is enabled, and password-reset session revocation is enabled. The email application name is VYRA Markets.

The shared Neon sender is still in use. Email deliverability, OTP confirmation, password reset and session invalidation have not yet been certified end to end. Localhost remains enabled for development. The final exact staging origin must be added to the Neon Auth trusted-origin list when a host exists; do not use a wildcard.

## Main API surface

| Route | Function |
|---|---|
| `GET /api/health` | Runtime, auth, database, market-data and execution-gate status |
| `GET /api/execution/readiness` | Live provider slots and hard-disabled live execution |
| `GET /api/markets` | Provider quotes, timestamps, quote persistence and user-scoped limit matching |
| `GET /api/instruments` | Enabled Neon instrument catalogue |
| `GET /api/me` | Current authenticated user |
| `GET/PATCH /api/account/profile` | User profile |
| `GET/POST/DELETE /api/watchlist` | User-owned watchlist |
| `GET/POST /api/trading/paper/accounts` | Paper-account snapshot and account opening |
| `GET/POST /api/trading/paper/orders` | Paper orders |
| `POST /api/trading/paper/orders/:id/cancel` | Account-scoped paper order cancellation |
| `GET /api/trading/paper/ledger` | Immutable paper journal |
| `GET /api/partners` | Research-only candidates; no customer referral actions |
| `POST /api/logout` | Same-origin protected sign-out |

## Execution adapter boundary

Each asset class has a capability/adapter contract, but the live implementation rejects execution. A provider candidate or API interface does not mean an account, API permission, order route, exchange membership or contract exists.

| Asset class | Market-data adapter | Live execution |
|---|---|---|
| Crypto | CoinGecko | Disabled |
| Equities | Twelve Data | Disabled |
| FX | Twelve Data | Disabled |
| Commodities | Twelve Data | Disabled |

Commercial display and redistribution rights for the prototype market-data feeds are not evidenced. Public data display must remain within provider terms until rights are confirmed.

## Reliability, security and production requirements

Before handling real users or partner production traffic, VYRA and the regulated principal must complete:

- two-user and anonymous RLS tests against real signed JWTs;
- email verification, recovery and session lifecycle tests;
- transactional ledger, idempotency, rollback, concurrency and reconciliation tests;
- supported database plan, backup/restore testing, explicit RPO/RTO and operational monitoring;
- independent security assessment, access reviews, MFA, secret rotation, rate limiting, origin/CSRF protections and incident response;
- signed and replay-protected partner webhooks, idempotent order submission and kill switches;
- provider contract, production credentials, scope certification, market-data rights and country/product approval;
- KYC/AML/sanctions responsibilities, client-asset safeguarding, funding/withdrawal rails, complaints and customer disclosures owned by the correct authorised entity;
- jurisdiction-specific legal and regulator review, including any licensing, appointment, outsourcing, affiliate and financial-promotion requirements.

## Deployment state

A free Render web-service blueprint is committed in `render.yaml` for a non-production paper demo in Frankfurt. No VYRA Render service has yet been created because the account has two workspaces and the target workspace has not been selected. The free Render tier is for a prototype/demo, not a live financial production system.

The connected Vercel Hobby team cannot currently link this private organisation-owned repository. The repo remains private; do not publish it or purchase a paid Vercel plan as a workaround.

## Accounting limitations

The journal and balances are simulation-only. Multi-currency accounting, settlement holds, margin, shorting, financing, real fees, deposits, withdrawals, custody, bank reconciliation and client-money accounting are not implemented. Never repurpose the paper ledger for real customer funds.
