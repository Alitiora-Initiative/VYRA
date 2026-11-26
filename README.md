# VYRA Markets

VYRA is a multi-asset brokerage software foundation designed around distinct market adapters for crypto, equities, FX and commodities. It is a software project—not a licensed brokerage, custodian, exchange or investment adviser.

## Current build

- Next.js application with Supabase SSR email/password authentication.
- Provider-backed market-data adapters: CoinGecko for crypto spot snapshots and Twelve Data for equities, FX and commodities, with free-tier-aware batching/caching.
- Quote API that reports provider errors and does not fall back to invented market values.
- Database-backed instrument catalogue and market-quote persistence.
- Paper account opening with an illustrative USD 100,000 balance.
- Server-side market/limit paper order lifecycle, UUID idempotency, quote-age checks, cash/share reservations for open limit orders, maximum order/position/daily-realized-loss limits and 5 bps adverse-slippage assumption.
- Immutable double-entry paper ledger with deferred journal-balance checks and realized P&L posting.
- Row Level Security on user-owned records.
- Live execution adapter contracts with a hard-disabled implementation for each asset class.

## Not yet live

No broker account is connected. No deposits, withdrawals, custody, live trades, real client balances, production suitability/KYC/AML workflow or regulated brokerage operations are enabled. Broker provider slots are architectural boundaries, not working connections. Do not place real broker credentials into the app.

## Deployment blueprint

A free Render Node web-service blueprint is included in `render.yaml` (Frankfurt region, auto-deploy from `main`, health check `/api/health`). Choose the intended Render workspace before creating the service. The Vercel Git integration was checked but this private organisation-owned GitHub repository cannot be linked while the connected Vercel team is on the Hobby plan; Vercel reported that a Pro upgrade is required. The repository has not been made public to work around that restriction.

## Local setup

1. Install Node.js 22 or later and npm.
2. Copy `.env.example` to `.env.local`.
3. Configure the VYRA Supabase URL and publishable key, plus the server-only service role key.
4. Apply `supabase/migrations/20261126000100_vyra_core.sql` to the dedicated VYRA Supabase project.
5. In Supabase API settings, expose the `public` schema to PostgREST. The 2026 default no longer automatically exposes new public tables; keep RLS enabled and preserve the grants/policies in this migration.
6. Configure `TWELVEDATA_API_KEY` to enable shares, FX and metals quotes. Crypto spot quotes use CoinGecko and may require `COINGECKO_DEMO_API_KEY` if rate-limited.
7. Set the Supabase Auth site URL and allowed redirect URLs to include `/auth/callback` and `/reset-password` on your local/deployed origin.
8. Install dependencies and run `npm run dev`.

The SQL migration sets the current paper defaults to USD 100,000 starting cash, $10,000 maximum order notional, $25,000 maximum position notional, $1,000 daily realised-loss stop and 5 basis points assumed adverse slippage. Passwords can be recovered with the email reset flow once Supabase email delivery and redirect URLs are configured. The service role key must remain server-side and must never use a `NEXT_PUBLIC_` prefix. Keep secrets in your hosting provider's environment-variable store, not Git.

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

**Current database decision:** Supabase project creation was blocked by the available account's two-active-free-project limit. Neon Postgres Free is now the selected alternative, but the Neon service still needs to be connected and a dedicated project provisioned. Existing Supabase projects 9N8 and Space Ledger remain untouched. See the database decision and migration runbook. A Render demo service also awaits workspace selection. Real-money features remain disabled.
