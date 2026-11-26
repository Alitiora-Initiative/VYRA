# VYRA Markets

VYRA is a multi-asset brokerage software foundation designed around distinct market adapters for crypto, equities, FX and commodities. It is a software project—not a licensed brokerage, custodian, exchange or investment adviser.

## Current build

- Next.js 16 application using Neon Managed Better Auth for email/password sessions.
- Provider-backed market-data adapters: CoinGecko for crypto spot snapshots and Twelve Data for equities, FX and commodities, with free-tier-aware batching/caching.
- Quote API that reports provider errors and does not fall back to invented market values.
- Database-backed instrument catalogue and market-quote persistence.
- Paper account opening with an illustrative USD 100,000 balance.
- Server-side market/limit paper order lifecycle, UUID idempotency, quote-age checks, cash/share reservations for open limit orders, maximum order/position/daily-realized-loss limits and 5 bps adverse-slippage assumption.
- Immutable double-entry paper ledger with deferred journal-balance checks and realized P&L posting.
- Neon Data API with PostgreSQL Row Level Security on user-owned records; server-only PostgreSQL access is isolated for provider quote persistence.
- Live execution adapter contracts with a hard-disabled implementation for each asset class.

## Not yet live

No broker account is connected. No deposits, withdrawals, custody, live trades, real client balances, production suitability/KYC/AML workflow or regulated brokerage operations are enabled. Broker provider slots are architectural boundaries, not working connections. Do not place real broker credentials into the app.

## Deployment blueprint

A free Render Node web-service blueprint is included in `render.yaml` (Frankfurt region, auto-deploy from `main`, health check `/api/health`). Choose the intended Render workspace before creating the service. The Vercel Git integration was checked but this private organisation-owned GitHub repository cannot be linked while the connected Vercel team is on the Hobby plan; Vercel reported that a Pro upgrade is required. The repository has not been made public to work around that restriction.

## Local setup

1. Install Node.js 22 or later and npm.
2. Copy `.env.example` to `.env.local`.
3. Configure `NEON_AUTH_BASE_URL`, `NEON_AUTH_COOKIE_SECRET`, `NEON_DATA_API_URL` and the server-only `NEON_DATABASE_URL` for the same VYRA Neon branch/database. Keep the database URL and cookie secret out of browser variables and Git.
4. The VYRA schema is already applied to the dedicated Neon project's default `vyra` database branch. It contains no user/customer records. Use `neon/migrations/20261126000100_vyra_core.sql` as the source of truth for future environments; test subsequent schema changes on a separate Neon branch before production use.
5. Ensure the Neon Data API exposes only the `public` schema, uses Managed Better Auth, and has the `anonymous` and `authenticated` grants/RLS policies from the migration. The `private` schema must remain unexposed.
6. Configure `TWELVEDATA_API_KEY` to enable shares, FX and metals quotes. Crypto spot quotes use CoinGecko and may require `COINGECKO_DEMO_API_KEY` if rate-limited.
7. Add the local application origin to Neon Auth trusted domains if it is not already allowed. Test sign-up, sign-in, session persistence, sign-out and password recovery before inviting users.
8. Install dependencies and run `npm run dev`.

The SQL migration sets the current paper defaults to USD 100,000 starting cash, $10,000 maximum order notional, $25,000 maximum position notional, $1,000 daily realised-loss stop and 5 basis points assumed adverse slippage. The Neon owner connection is used only in server-side routes for catalogue reads and market-quote persistence; it is never passed to the browser or user-scoped query client. The user-scoped Data API requests carry the Managed Better Auth JWT and remain subject to RLS. Keep all secrets in your hosting provider's environment-variable store, not Git.
## Main endpoints

| Endpoint | Purpose |
| --- | --- |
| `GET /api/health` | Runtime configuration and execution gates |
| `GET /api/execution/readiness` | Provider slots and live execution lock |
| `GET /api/partners` | Research-only broker candidates; referrals remain disabled |
| `GET /api/markets` | Provider quotes, timestamps and provider availability |
| `GET /api/instruments` | Database-backed instrument catalogue |
| `GET /api/me` | Current authenticated user |
| `GET/PATCH /api/account/profile` | Read/update display name |
| `GET/POST/DELETE /api/watchlist` | User-owned instrument watchlist |
| `GET /api/trading/paper/ledger` | Read immutable paper journal |
| `GET/POST /api/trading/paper/accounts` | Read aggregated account balances/reservations or open a paper account |
| `GET/POST /api/trading/paper/orders` | List or submit paper orders |
| `POST /api/trading/paper/orders/:id/cancel` | Cancel an open paper order |

## Development checks

- `npm test` — paper-risk unit tests.
- `npm run typecheck` — TypeScript check.
- `npm run lint` — lint.
- `npm run build` — production Next.js build.

## Architecture and launch gates

See `docs/ARCHITECTURE.md`, `docs/PRODUCT.md`, `docs/SECURITY.md`, `docs/LEDGER.md`, `docs/PROVIDERS.md` and `docs/REGULATORY.md`. Live execution must stay disabled until jurisdiction-specific legal review, broker/provider due diligence and approval, client asset/custody design, KYC/AML/sanctions controls, independent security review, reconciliation, monitoring, incident procedures and production certification are complete.


## Brokerage master plan and execution backlog

VYRA is being developed first as a **partner-led market-access platform**, not as an unlicensed broker. The intended first model is for regulated partners to own the customer brokerage/fund account, onboarding and KYC decisions, customer money, custody and execution, while VYRA provides approved software, discovery and hand-off functions. This is a target model, not a signed agreement or regulatory approval.

- [Brokerage master plan](docs/BROKERAGE_MASTER_PLAN.md) — detailed operating model, Kenya and international regulatory analysis, broker and institutional fund-platform comparisons (including alternatives/hedge funds), architecture, document pack, risk register and phased roadmap.
- [Brokerage flowcharts](docs/BROKERAGE_FLOWCHARTS.md) — regulatory gates, customer hand-off, future order lifecycle, data/privacy boundary, reconciliation and deployment.
- [Brokerage build checklist](docs/BROKERAGE_BUILD_CHECKLIST.md) — staged engineering, legal, partner and launch tasks.
- [Partner and regulation research register](docs/BROKERAGE_RESEARCH_REGISTER.md) — primary-source links, due-diligence questions and known evidence gaps.
- [Kenya VASP 2026 addendum](docs/KENYA_VASP_2026_ADDENDUM.md) — crypto-specific licensing, territorial scope, promotions and paid-up/liquid capital requirements.
- [Partner outreach pack](docs/PARTNER_OUTREACH_PACK.md) — contact approach, discovery messages, regulator inquiry and due-diligence questions.
- [Regulatory document register](docs/REGULATORY_DOCUMENT_REGISTER.md) — all corporate, legal, compliance, privacy, operational and partner documents with honest status tracking.
- [Hosting and infrastructure options](docs/HOSTING_AND_INFRASTRUCTURE_OPTIONS.md) — current zero-cost comparison of Render, Netlify, Cloudflare Workers, Railway, Vercel and Supabase constraints.
- [Brokerage technology vendor map](docs/BROKERAGE_TECH_VENDOR_MAP.md) — brokerage rails, fund/hedge-fund distribution, KYC/AML, custody, data, charting and operational tooling.
- [Database provider decision](docs/DATABASE_PROVIDER_DECISION.md) — compares Neon, Supabase, Aiven, Firebase, Render, Railway and Turso, with a zero-cost recommendation.
- [Neon migration runbook](docs/NEON_MIGRATION_RUNBOOK.md) — step-by-step authentication, identity, RLS, data-access and migration test plan.
- [GitHub implementation issues](https://github.com/Alitiora-Initiative/VYRA/issues) — trackable delivery backlog.

**Current database status (26 Nov 2026):** Neon is connected and the dedicated `vyra-markets` Free project is provisioned in Frankfurt, with PostgreSQL 17, database `vyra`, Managed Better Auth and the PostgreSQL Data API enabled. The Neon-specific schema has been applied and inspected on the dedicated project's default database branch (`main`): 14 VYRA tables, 20 foreign keys, 19 RLS policies, and the ledger safeguards are present; Neon Auth currently has zero users. The application migration is being developed in GitHub PR #18 (`feat/neon-backend`); CI and end-to-end auth/RLS checks must pass before deploying the app. Supabase projects 9N8 and Space Ledger remain untouched. A Render demo service still awaits workspace selection. Real-money features remain disabled.
