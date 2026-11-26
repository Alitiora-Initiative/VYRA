# VYRA Markets

VYRA is a multi-asset brokerage software foundation designed around distinct market adapters for crypto, equities, FX and commodities. It is a software project—not a licensed brokerage, custodian, exchange or investment adviser.

## Current build

- Next.js 16 application with Neon Managed Better Auth email/password sign-in and Neon Auth UI.
- Neon PostgreSQL database in an isolated Frankfurt project, with a PostgREST-compatible Data API and RLS.
- Provider-backed market-data adapters: CoinGecko for crypto spot snapshots and Twelve Data for equities, FX and commodities, with free-tier-aware batching/caching.
- Quote API that reports provider errors and does not fall back to invented market values.
- Restricted quote-ingestion database role for market quotes only; it cannot write orders, accounts or ledger entries.
- Database-backed instrument catalogue and market-quote persistence.
- Paper account opening with an illustrative USD 100,000 balance.
- Server-side market/limit paper order lifecycle, UUID idempotency, quote-age checks, cash/share reservations for open limit orders, maximum order/position/daily-realized-loss limits and 5 bps adverse-slippage assumption.
- Immutable double-entry paper ledger with deferred journal-balance checks and realized P&L posting.
- Row Level Security on user-owned records.
- Live execution adapter contracts with a hard-disabled implementation for each asset class.
- VYRA Access Graph: versioned country × product × activity policy evaluator with source-linked Kenya rules, explicit unassessed markets and twelve default-deny launch evidence gates including customer classification.
- Interactive route simulator at /access-graph and public source/evidence API at GET /api/access-graph. The rulepack is a product-control aid, not legal advice or an authorisation.

## Not yet live

VYRA is currently a paper-trading prototype, not the live turnkey brokerage described by some white-label providers. It has no signed broker/provider agreement, production brokerage authorisation, funding rail, custody, dealing/liquidity provider, KYC programme, final legal PDFs, paid affiliate offer or native mobile apps. The supplied provider onboarding checklist is mapped in [Provider Brokerage Launch Checklist](docs/PROVIDER_BROKERAGE_LAUNCH_CHECKLIST.md).

No broker account is connected. No deposits, withdrawals, custody, live trades, real client balances, production suitability/KYC/AML workflow or regulated brokerage operations are enabled. Broker provider slots are architectural boundaries, not working connections. Do not place real broker credentials into the app.

## Database and authentication

The dedicated Neon project is `vyra-markets` in `aws-eu-central-1` (Frankfurt), project ID `dawn-wind-08199003`, database `vyra`, main branch `br-tiny-lake-bhoos1ij`. Neon Managed Better Auth and the Neon Data API are enabled. The Neon-specific SQL migration is committed at `neon/migrations/20261126000100_vyra_core.sql` and has been applied to the main branch.

VYRA's user IDs remain UUIDs: the inspected Managed Better Auth user table uses UUID IDs, and Neon exposes `auth.uid()` as the UUID-compatible helper. The adapted migration references `neon_auth."user"(id)`; it does not add triggers to Neon-managed auth tables. Profiles are created lazily when the signed-in user updates their profile.

The original `supabase/migrations/20261126000100_vyra_core.sql` is retained as migration history/reference; do not apply it to Neon. Use the Neon-specific migration for Neon.

## Deployment blueprint

A free Render Node web-service blueprint is included in `render.yaml` (Frankfurt region, auto-deploy from `main`, readiness check `/api/ready`). The required Neon secrets are declared as manual environment variables. Choose the intended Render workspace before creating the service. The Vercel Git integration was checked but this private organisation-owned GitHub repository cannot be linked while the connected Vercel team is on the Hobby plan; Vercel reported that a Pro upgrade is required. The repository has not been made public to work around that restriction.

## Local setup

1. Install Node.js 22 or later and npm.
2. Copy `.env.example` to `.env.local`.
3. Set the Neon values below. Keep all secrets server-side and out of Git.
4. Install dependencies with `npm install`.
5. Configure `TWELVEDATA_API_KEY` to enable shares, FX and metals quotes. Crypto spot quotes use CoinGecko and may require `COINGECKO_DEMO_API_KEY` if rate-limited.
6. Run `npm run dev`.

Required Neon environment:

- `NEON_AUTH_BASE_URL` — Managed Better Auth endpoint.
- `NEON_AUTH_COOKIE_SECRET` — random secret of at least 32 characters.
- `NEON_DATA_API_URL` — Neon Data API endpoint for the `vyra` database.
- `NEON_MARKET_DATA_DATABASE_URL` — pooled PostgreSQL connection string for the restricted `vyra_quote_ingest` role. It can select/insert/update market quotes only; never replace it with the database owner URL.
- `NEXT_PUBLIC_GTM_ID` — optional Google Tag Manager container ID. GTM loads only after analytics consent; no container ID is currently configured.

The current Neon Auth settings require email verification for new email/password accounts, use the shared Neon email provider and allow localhost development. Before staging, add the exact deployed origin to Neon Auth's trusted origins and verify verification/reset email delivery end to end. The password-reset views are handled through Neon Auth UI.

The SQL migration sets current paper defaults to USD 100,000 starting cash, $10,000 maximum order notional, $25,000 maximum position notional, $1,000 daily realised-loss stop and 5 basis points assumed adverse slippage. Existing VYRA users/password hashes did not exist in Supabase, so no user migration was needed; the first real users must register with Neon Auth.

## Main endpoints

| Endpoint | Purpose |
| --- | --- |
| `GET /api/health` | Liveness response for the running Node service |
| `GET /api/ready` | Dependency readiness: Neon Auth, Data API, database and quote-writer configuration; returns 503 until app dependencies are ready |
| `GET /api/execution/readiness` | Provider slots and live execution lock |
| `GET /api/access-graph` | Versioned public jurisdiction/product/activity rulepack and evidence sources |
| `GET /api/provider-graph` | Provider-role requirements and verified/unverified relationship state |
| `GET /api/partners` | Research-only broker candidates; referrals remain disabled |
| `GET /api/markets` | Provider quotes, timestamps, quote persistence and scoped limit matching |
| `GET /api/instruments` | Neon-backed instrument catalogue |
| `GET /api/me` | Current authenticated user |
| `GET/PATCH /api/account/profile` | Read/update display name |
| `GET/POST/DELETE /api/watchlist` | User-owned instrument watchlist |
| `GET /api/trading/paper/ledger` | Read immutable paper journal |
| `GET/POST /api/trading/paper/accounts` | Read aggregated account balances/reservations or open a paper account |
| `GET/POST /api/trading/paper/orders` | List or submit paper orders |
| `POST /api/trading/paper/orders/:id/cancel` | Cancel an open paper order |
| `POST /api/logout` | Same-origin-protected Neon Auth sign-out |
| `/legal/aml`, `/legal/payment_policy`, `/legal/term`, `/legal/order_execution`, `/legal/privacy`, `/legal/general_fees` | Publication-status notices only; provider/counsel PDFs have not been supplied |

## Development checks

- `npm test` — paper-risk, partner-eligibility and AccessGraph default-deny/source-mapping unit tests.
- `npm run typecheck` — TypeScript check.
- `npm run lint` — lint.
- `npm run build` — production Next.js build.

## Architecture and launch gates

See `docs/ARCHITECTURE.md`, `docs/PRODUCT.md`, `docs/SECURITY.md`, `docs/LEDGER.md`, `docs/PROVIDERS.md` and `docs/REGULATORY.md`. Live execution must stay disabled until jurisdiction-specific legal review, broker/provider due diligence and approval, client asset/custody design, KYC/AML/sanctions controls, independent security review, reconciliation, monitoring, incident procedures and production certification are complete.

## Brokerage master plan and execution backlog

VYRA is being developed first as a **partner-led market-access platform**, not as an unlicensed broker. The intended first model is for regulated partners to own the customer brokerage/fund account, onboarding and KYC decisions, customer money, custody and execution, while VYRA provides approved software, discovery and hand-off functions. This is a target model, not a signed agreement or regulatory approval.

- [Hackathon and investor thesis](docs/HACKATHON_AND_INVESTOR_THESIS.md) — product wedge, AccessGraph and Provider Graph, five-minute demo script, customer model, investor proof points and roadmap. — product wedge, AccessGraph moat, five-minute demo script, customer model, investor proof points and roadmap.
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
- [Neon migration runbook](docs/NEON_MIGRATION_RUNBOOK.md) — provisioned Neon infrastructure, SQL migration, app integration, security boundaries and remaining tests.
- [Provider brokerage launch checklist](docs/PROVIDER_BROKERAGE_LAUNCH_CHECKLIST.md) — maps the supplied white-label brokerage checklist to VYRA's real state and launch evidence.
- [App Store listing draft](docs/APP_STORE_LISTING_DRAFT.md) — truthful paper-prototype listing copy and the missing store-eligibility evidence.
- [GitHub implementation issues](https://github.com/Alitiora-Initiative/VYRA/issues) — trackable delivery backlog.

**Current infrastructure truth:** Neon Postgres, Managed Better Auth and the Data API are provisioned; the adapted SQL schema is applied to the dedicated VYRA main branch. The app's active auth/data code uses Neon. The free Render paper-demo service is not yet created. The original Supabase projects 9N8 and Space Ledger remain untouched. Real-money features remain disabled.
