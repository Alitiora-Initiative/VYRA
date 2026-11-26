# VYRA — Neon Postgres + Managed Better Auth Migration Runbook

**Status:** Database provisioned and migrated; app port committed; end-to-end auth/provider tests and final CI remain open.  
**Provider:** Neon Postgres Free for synthetic development and paper trading only.  
**Project:** `vyra-markets`, Frankfurt (`aws-eu-central-1`).  
**Database:** `vyra`; main branch `br-tiny-lake-bhoos1ij`.  
**Main migration:** `neon/migrations/20261126000100_vyra_core.sql`.

## 1. Current infrastructure state

Neon is connected and a dedicated project has been created. Neon Managed Better Auth and the Neon Data API are enabled. The adapted core SQL migration was applied to both an isolated validation branch and the main branch. The validation branch was deleted after successful testing.

The main branch currently contains:
- 14 VYRA public tables, with RLS enabled on all 14;
- 19 public row-level security policies;
- 69 validated database constraints;
- UUID business identifiers and UUID user references to Neon Managed Auth;
- paper order, fill, ledger, risk-limit, audit and quote routines;
- enabled-instrument catalogue rows, but no test/customer accounts, orders, fills or market-quote rows.

All unrelated Supabase projects remain untouched. The original Supabase SQL file remains only as a migration-history reference. Never apply it to Neon.

## 2. Verified auth schema and RLS contract

The inspected Neon Managed Auth table `neon_auth."user"` has a UUID primary key (`id`), text name/email and Better Auth timestamp fields. Neon also exposes `auth.uid()` returning UUID, `auth.user_id()` returning text and `auth.jwt()` returning JSONB. The VYRA user references therefore remain UUID; the earlier generic runbook assumption that all Better Auth IDs would be text is not used in the applied migration.

The Neon migration:
- references `neon_auth."user"(id)` for user-owned records;
- does not install triggers on Neon-managed auth tables;
- uses `auth.uid()` for user-ownership checks;
- creates profiles lazily through the authenticated profile API;
- preserves UUID account/order/instrument/ledger identifiers;
- retains RLS on all VYRA public tables.

The managed roles `anonymous` and `authenticated` are non-login roles with RLS enabled. Owner policies are scoped to `auth.uid()`. The global matcher is deliberately non-executable by anonymous and authenticated roles. Public market matching is a disabled server-only stub; `process_my_paper_quote` validates ownership of an active paper account before processing that user's orders.

## 3. Privileged quote ingestion

A dedicated `vyra_quote_ingest` PostgreSQL login role was created for the quote writer. It is not a superuser and does not bypass RLS. Its grants are limited to quote ingestion; it has no permission to mutate orders, trading accounts, positions, balances, ledger entries or auth records. This role is the only account to use in `NEON_MARKET_DATA_DATABASE_URL`.

Never place the database owner connection string, Neon API key, Auth server secret or this quote-writer password in Git, browser bundles, `NEXT_PUBLIC_*` variables or generic user-facing API code. The quote writer uses a pooled connection and prepared parameters, validates positive prices and timestamps, and only overwrites a stored quote with an equal/newer observation.

## 4. Application migration status

The active Next.js app has been moved from Supabase SSR to Neon:
- `src/lib/neon/auth.ts`: Neon Managed Better Auth server integration and signed session cookies.
- `src/lib/neon/auth-client.ts`: Neon Auth browser client.
- `src/lib/neon/server.ts`: request-scoped Neon Data API client using the validated Neon Auth session token.
- `src/lib/neon/market-writer.ts`: server-only pooled quote writer using the restricted role.
- `src/app/api/auth/[...path]/route.ts`: Neon Auth request handler with Next.js route context.
- `src/app/auth/[path]/page.tsx`: Neon Auth UI routes.
- `src/app/api/me`, profile, watchlist, paper account, paper order, order cancellation and ledger routes: Neon Data API.
- `src/app/api/markets` and `src/app/api/instruments`: Neon-backed catalogue and quote persistence.
- `proxy.ts`: Neon middleware integration for protected settings.
- The old `src/lib/supabase/*`, Supabase middleware and Supabase PKCE callback runtime files have been removed.

The app uses pinned Next.js 16 and the Neon SDK packages. Neon Auth UI `0.4.0-beta` publishes an exact `0.6.0-beta` peer dependency while VYRA uses Auth `0.7.0-beta`; the repository includes a package override to keep Auth UI on the app's Auth version instead of allowing a second nested SDK copy. This must be revisited when Neon republishes compatible package versions.

## 5. Environment variables

Required for the web app:
- `NEON_AUTH_BASE_URL` — Managed Better Auth base URL for this branch.
- `NEON_AUTH_COOKIE_SECRET` — server-only random secret, minimum 32 characters.
- `NEON_DATA_API_URL` — Neon Data API endpoint for the `vyra` database.
- `NEON_MARKET_DATA_DATABASE_URL` — pooled PostgreSQL URL for the restricted `vyra_quote_ingest` role.
- `TWELVEDATA_API_KEY` — optional provider key for shares/FX/commodities; without it those provider classes remain unavailable.
- `COINGECKO_DEMO_API_KEY` — optional provider key if CoinGecko rate limits the demo.
- `NEXT_PUBLIC_GTM_ID` — optional GTM container; no ID is currently configured and the script does not load until the visitor opts into analytics.

The actual secrets belong in the target hosting provider's environment store. Never commit real values into `.env.example` or GitHub.

## 6. Managed Auth settings

Neon Auth is branded as VYRA Markets. Email/password sign-up is enabled; new accounts must complete email verification using an OTP before sign-in. The shared Neon email provider is selected. The app's auth UI uses Neon Auth's supported sign-in, sign-up, forgot-password and reset-password views.

Not yet certified:
- deliverability for verification emails;
- end-to-end OTP confirmation;
- password reset email receipt and completion;
- session refresh across browser reloads and app restarts;
- logout invalidation;
- trusted-domain redirect behavior on the deployed host.

Localhost is allowed for development. Add the exact final staging/production origin to Neon Auth trusted domains when the host URL exists. Never use an open wildcard for production redirect origins.

## 7. RLS, order and ledger verification

The applied schema was inspected directly. Verified facts:
- RLS enabled on all 14 public tables.
- 19 public RLS policies exist.
- 69 constraints are validated.
- authenticated/anonymous roles cannot execute the global `process_market_quote(uuid)` matcher.
- authenticated users can call only the user-scoped `process_my_paper_quote(uuid,uuid)` flow, whose private function checks that the account belongs to the JWT user and is an active paper account.
- unauthenticated paper-account opening is rejected with `AUTH_REQUIRED`.
- `vyra_quote_ingest` cannot mutate orders/accounts/ledger records.

Still required using two synthetic signed-in users:
1. Verify each can read only their own profile, accounts, positions, fills, orders, risk limits, watchlist and ledger.
2. Attempt cross-account access by guessing a second user's UUIDs; every read/write must fail or return no rows.
3. Verify anonymous users can only read enabled instruments and market quotes.
4. Create paper account; check initial journal debits/credits balance.
5. Submit market and non-marketable limit orders with unique client-order IDs.
6. Verify matching, reservations, partial state if implemented, cancellation and duplicate idempotent retry.
7. Verify no fill is written for stale/future quotes or rejected orders.
8. Verify ledger updates are immutable and balance checks reject unbalanced journal transactions.
9. Confirm failed RPCs roll back all side effects.

## 8. CI and production-build status

The repository's previous GitHub workflow runs recorded 16/16 unit tests passing and TypeScript passing after the auth-handler route signature was corrected. The old ESLint legacy compatibility wrapper then failed with a circular-configuration error; it has been replaced with Next.js's native flat configs at `eslint.config.mjs`.

**Do not claim CI complete until one current main-branch run passes all four stages:** unit tests, TypeScript, lint and production build. The final build can still expose package/export/runtime issues that TypeScript alone does not catch.

## 9. Deployment state

The Render account has two empty workspaces, `My Workspace` and `JOJO`; no VYRA Render service has been created. A free Render web service may host the paper demo once CI and runtime checks pass. It is not a suitable production brokerage host or production financial book of record.

After creating the demo service:
- set the four required Neon variables in Render's secret store;
- add the exact `https://<service>.onrender.com` origin to Neon Auth trusted domains;
- test sign-up, verification, sign-in, sign-out, API health, quote refresh, paper account, order and ledger flows;
- do not use real customer information or money;
- do not deploy a live trading interface.

## 10. Rollback

If the Neon app integration fails:
- keep the dedicated Neon project and migration intact for diagnosis;
- revert the app commit to a known passing build;
- keep live execution disabled;
- do not use another product's Supabase database as a fallback;
- preserve the original Supabase migration only for historical reference.

## 11. Remaining launch blockers

- [ ] Complete CI: tests, typecheck, lint and Next.js production build on one current commit.
- [ ] End-to-end Neon Auth email verification/reset and session tests.
- [ ] Two-user RLS and complete paper order/ledger integration tests.
- [ ] Verify live quote API against each provider; obtain commercial market-data rights before any public redistribution.
- [ ] Provision a Render paper-demo service and set Neon secrets securely.
- [ ] Confirm staging trusted origin and verify security headers, logs and backup restore.
- [ ] Choose one provider, one first market/jurisdiction and one operating model; obtain written partner and legal approvals.
- [ ] Keep all live brokerage activity disabled until regulated partner integration and formal certification.
