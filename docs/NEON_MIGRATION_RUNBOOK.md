# VYRA — Neon Postgres + Managed Better Auth Runbook

**Status:** Neon is provisioned, the migration is applied to the main branch, and the Next.js app is using Neon. End-to-end authentication, signed-user isolation, full paper-ledger verification and hosted deployment remain open.  
**Use:** isolated synthetic development and paper trading only; not a live financial book of record.  
**Project:** `vyra-markets`, Frankfurt (`aws-eu-central-1`), ID `dawn-wind-08199003`.  
**Database:** `vyra`; main branch `br-tiny-lake-bhoos1ij`.  
**Development branch:** `vyra-dev`, ID `br-lively-morning-bhf3wagy` (branched from main on 26 Nov 2026).  
**Migration of record:** `neon/migrations/20261126000100_vyra_core.sql`.

## 1. Actual infrastructure state

Neon is connected to the VYRA project. Neon Managed Better Auth and the Neon Data API are enabled on main. The Neon-specific core migration is applied to main. The isolated `vyra-dev` branch was created from main after migration so that subsequent checks can run without changing the main paper branch.

Verified on the development branch:
- database `vyra` exists and is owned by `vyra_owner`;
- 14 VYRA application tables exist in `public`;
- 9 Neon Managed Better Auth tables exist in `neon_auth`;
- the restricted quote-ingestion table exists in `market_ingestion`;
- all 14 VYRA public tables have RLS enabled;
- 19 public RLS policies were inspected;
- UUID user references and the paper-order/ledger functions exist;
- no seeded customer account, order, fill or market quote was found in the main application dataset at the time of inspection.

The development branch is not a deleted temporary branch; it is the active isolated validation branch. Do not drop it while it is used for testing. Unrelated Supabase projects (9N8 and Space Ledger) have not been touched. The legacy Supabase migration is retained only for history; never apply it to Neon.

## 2. Auth identity and RLS contract

The actual Neon Managed Auth table `neon_auth."user"` has a UUID primary key (`id`). Neon exposes `auth.uid()` as UUID and `auth.user_id()` as text. VYRA keeps its user-reference columns as UUID and uses `auth.uid()` in ownership policies. The migration does not install triggers on or alter Neon-managed auth tables.

The database access pattern is:
- user requests use the Neon Data API with a JWT from the current Neon Auth session;
- anonymous requests receive only the privileges explicitly granted to the `anonymous` role;
- the Data API exposes the `public` schema and uses Neon Auth as its JWT provider;
- RLS policies scope user-owned records to the signed-in UUID;
- authenticated users can read allowed data but cannot directly insert orders or journal entries;
- account/order creation and user-scoped matching are performed through narrowly granted PostgreSQL functions.

Observed access checks on `vyra-dev`:
- anonymous role cannot select `trading_accounts` or `orders`;
- authenticated role can select orders but cannot insert orders directly;
- anonymous cannot execute `open_paper_account()`;
- authenticated can execute `open_paper_account()` and the ownership-checked `process_my_paper_quote(uuid,uuid)`;
- authenticated cannot execute the global `process_market_quote(uuid)` matcher.

RLS being enabled does not replace signed-session tests. Two real synthetic users (A and B) still need to be tested with valid Neon Auth JWTs.

## 3. Restricted quote ingestion

A dedicated PostgreSQL login role `vyra_quote_ingest` is used only by the market quote writer. It is not the database owner and has no permission to mutate accounts, orders, positions, fills, ledger records or auth tables. Its application connection is stored only in `NEON_MARKET_DATA_DATABASE_URL`.

The app module `src/lib/neon/market-writer.ts` validates positive prices, timestamps, instrument IDs and source labels; it uses parameterised SQL and only updates a stored quote when the incoming observation is not older.

Never put the owner URL, Neon API key, Auth cookie secret or quote-writer password in Git, browser bundles, logs, `NEXT_PUBLIC_*` variables or generic user-facing routes.

## 4. Active application integration

The Next.js application now uses Neon instead of the former Supabase SSR/auth runtime:
- `src/lib/neon/auth.ts`: Neon Managed Better Auth server integration and signed session cookies.
- `src/lib/neon/auth-client.ts`: browser auth client.
- `src/lib/neon/server.ts`: request-scoped Neon Data API client using the validated current session token.
- `src/lib/neon/market-writer.ts`: server-only PostgreSQL writer using the restricted quote-ingestion role.
- `src/app/api/auth/[...path]/route.ts`: Neon Auth request handler with Next.js route context.
- `src/app/auth/[path]/page.tsx`: Neon Auth UI routes.
- `src/app/api/me`, profile, watchlist, paper account, paper order, cancellation and ledger routes: Neon Data API.
- `src/app/api/markets` and `src/app/api/instruments`: provider quote/catalogue API and persistence.
- `proxy.ts`: Neon middleware integration.

The original Supabase migration and documentation remain as historical references where useful; do not connect the VYRA app to the other Supabase products.

## 5. Server environment

Required:
- `NEON_AUTH_BASE_URL` — Managed Better Auth endpoint for the branch used by the app.
- `NEON_AUTH_COOKIE_SECRET` — server-only random secret of at least 32 characters.
- `NEON_DATA_API_URL` — Neon Data API endpoint for database `vyra`.
- `NEON_MARKET_DATA_DATABASE_URL` — pooled URL for the restricted `vyra_quote_ingest` role.

Optional:
- `TWELVEDATA_API_KEY` — provider key for equities, FX and commodities. Without it, those classes remain unavailable.
- `COINGECKO_DEMO_API_KEY` — optional if CoinGecko rate limits the paper demo.
- `NEXT_PUBLIC_GTM_ID` — optional analytics container; no ID is configured and GTM is consent-gated.

Credentials must be set in the selected host's encrypted secret store. Do not store production secrets in GitHub Actions logs, code, issue comments or public environment variables.

## 6. Neon Auth settings

Neon Auth email application name is set to **VYRA Markets** on main and `vyra-dev`.

Verified on both branches:
- email/password authentication is enabled;
- sign-up is enabled;
- email verification is required;
- OTP is the email-verification method;
- verification emails are configured to send on sign-up and sign-in;
- automatic sign-in after successful verification is enabled;
- sessions are revoked on password reset;
- localhost is allowed for local development;
- no custom trusted production origin has yet been added.

The shared Neon email provider is still configured. The sender has not yet been replaced with a VYRA-owned custom-domain mailbox.

Not yet certified end-to-end:
- verification OTP delivery and completion;
- password-reset email delivery and reset completion;
- session persistence across reloads;
- logout/session invalidation;
- password-reset revocation;
- redirect behavior on the eventual hosted origin.

When a staging host is created, add only its exact HTTPS origin to Neon Auth trusted domains. Do not use a wildcard. Disable localhost on the production branch only after the final hosting and local development split is agreed and verified.

## 7. RLS, paper order and ledger verification

Direct inspection verified:
- RLS is enabled on all 14 VYRA public application tables;
- account, order, fill, position, risk-limit and ledger reads have user/account-owner policies;
- anonymous users have catalogue and market-quote reads only;
- client roles cannot mutate the financial tables directly;
- the quote-ingestion role can write quotes but not accounts, orders or ledgers;
- the global matcher is not executable by anonymous/authenticated roles;
- the user-scoped matcher verifies the authenticated user owns the active paper account.

Still required with synthetic signed-in users A and B:
1. Verify A can read only A's profile, accounts, watchlist, orders, positions, fills and ledger.
2. Attempt cross-account reads and mutations using B's UUIDs from A's session; they must fail or return no rows.
3. Verify anonymous access is limited to enabled catalogue entries and public quotes.
4. Open a paper account and confirm balanced opening journal entries.
5. Submit market and non-marketable limit paper orders with a reused client idempotency UUID on retries.
6. Verify quote age, notional/position/daily-loss limits and cash/share reservations.
7. Verify fills, cancellations and failed transactions preserve ledger balance and transaction atomicity.
8. Verify audit and ledger mutation triggers reject update/delete.
9. Test simultaneous/replayed order submissions and rollback behavior.

## 8. Continuous integration

The GitHub Actions workflow runs unit tests, TypeScript, ESLint and a production Next.js build. The last completed full workflow before the latest fixes reported all 16 unit tests passing and TypeScript passing, but lint failures prevented the production build. The observed lint issues were corrected in subsequent commits (Next.js internal links and the dashboard initial-load effect).

**Do not mark CI green until a current main-branch workflow completes with success for every stage.** If lint passes, require the production build to finish rather than infer success from tests or typecheck.

## 9. Hosting state

The repository contains a free Render Node web-service blueprint in Frankfurt with `/api/health` as the health check. No VYRA Render service has been created. The connected Render account has two workspaces, `My Workspace` and `JOJO`; the workspace for VYRA has not been selected.

The connected Vercel Hobby team cannot currently link this private organisation-owned GitHub repository; VYRA has no Vercel project. Do not make the repository public or upgrade Vercel to bypass this.

After the owner selects the Render workspace and the service is created:
- set all four required Neon values in the Render secret store;
- set optional provider keys only when available;
- add the exact `https://<service>.onrender.com` origin to Neon Auth;
- run the health endpoint and test all sign-in, quote, account, order and ledger flows;
- keep all test data synthetic and paper-only.

Render Free is acceptable for a non-production demo only. It is not approved hosting for a live brokerage or customer-money system.

## 10. Rollback and non-negotiable boundary

If the Neon integration fails, revert the application deployment to the last known passing commit while retaining the isolated database branch for diagnosis. Do not use another product's database as a fallback. Keep the live execution adapters hard-disabled.

A real brokerage launch remains blocked on a signed provider agreement, regulator/legal classification, country/product scope, client asset/funding/custody responsibilities, KYC/AML/sanctions, approved disclosures, provider API certification, operational resilience, reconciliation, monitoring, independent security review and formal go/no-go evidence.
