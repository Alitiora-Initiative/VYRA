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
