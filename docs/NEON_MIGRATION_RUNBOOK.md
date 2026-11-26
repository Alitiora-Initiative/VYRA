# VYRA — Neon Postgres + Managed Better Auth Migration Runbook

**Status (26 Nov 2026):** Neon Free project and Managed Auth/Data API are provisioned. The PostgreSQL schema has been applied and inspected on an isolated test branch. Application migration is in GitHub branch `feat/neon-backend`; it is not yet merged, CI-green or deployed.  
**Chosen provider:** Neon Postgres Free for development and paper trading.  
**Source:** existing Supabase-oriented VYRA application and SQL migration.

## 1. Why this migration is viable

VYRA uses Supabase Auth and PostgREST-style queries. Neon provides a PostgREST-compatible Data API plus Managed Better Auth and a Supabase-compatible auth adapter. The existing query-builder style can largely remain, while the actual authentication, session and database configuration changes.

This is not a base-URL swap. The user identifier type, auth schema references, RLS helpers, cookie/session integration, password-recovery flow and privileged server role must all be adapted and tested.

## 2. Current data/user situation

No dedicated VYRA Supabase project has been created, and the VYRA migration has never been applied. No production VYRA users, passwords, orders or paper ledgers are known to exist. There is therefore no VYRA database to dump or migrate and no existing password hashes to carry over.

Neon states that password hashes cannot be transferred into Managed Better Auth. If users had already existed, they would need to re-register or use an approved social sign-in transition. This is the cleanest point to choose Neon before any VYRA accounts exist.

## 3. Supabase-specific code inventory

Current modules requiring migration:
- src/lib/supabase/browser.ts — browser auth/data client.
- src/lib/supabase/server.ts — server cookie client.
- src/lib/supabase/admin.ts — privileged service-role client.
- middleware.ts — Supabase claims refresh and cookies.
- src/app/api/me/route.ts — getUser().
- src/app/api/account/profile/route.ts — profile access.
- src/app/login/page.tsx — email/password register and sign-in.
- src/app/forgot-password/page.tsx — request reset link.
- src/app/reset-password/page.tsx — password update.
- src/app/auth/callback/route.ts — Supabase PKCE callback.
- src/app/auth/signout/route.ts — sign out.
- Paper account, paper order, ledger and watchlist routes — auth plus PostgREST / RPC.
- src/app/api/instruments/route.ts and src/app/api/markets/route.ts — privileged DB operations.
- supabase/migrations/20261126000100_vyra_core.sql — Supabase auth.users, auth.uid(), auth.jwt() and service_role assumptions.

## 4. Target SDK and environment layout

The Neon SDK documents a Supabase-compatible adapter. The pattern below is illustrative and must be checked against the connected Neon SDK version:

    import { createClient, SupabaseAuthAdapter } from '@neondatabase/neon-js';

    export const neon = createClient({
      auth: {
        adapter: SupabaseAuthAdapter(),
        url: process.env.NEXT_PUBLIC_NEON_AUTH_URL!,
      },
      dataApi: {
        url: process.env.NEON_DATA_API_URL!,
      },
    });

For Next.js server-side authentication use the documented Neon Next.js server integration. Use a server-only pooled Postgres URL for privileged database operations and migrations.

Required secrets/settings once provisioned:
- NEON_AUTH_BASE_URL
- NEON_AUTH_COOKIE_SECRET (random 32+ character secret)
- NEXT_PUBLIC_NEON_AUTH_URL only if the selected client adapter requires it
- NEON_DATA_API_URL
- DATABASE_URL (server-only pooled database connection)
- NEON_API_KEY (administration/provisioning only, never browser)
- existing market-data API keys

Never expose DATABASE_URL, Neon API keys, database-owner credentials or server-side tokens in frontend bundles, NEXT_PUBLIC_ environment variables or GitHub commits.

## 5. SQL identity and RLS conversion

Neon Managed Better Auth stores users in `neon_auth."user"`. Inspection of this project confirms UUID user IDs and a UUID-returning `auth.uid()` helper (the separate `auth.user_id()` helper returns TEXT). Preserve the existing VYRA identity model: `profiles.id`, `user_watchlist.user_id`, `trading_accounts.user_id`, `audit_events.actor_id` and `provider_connections.user_id` remain UUID foreign keys to `neon_auth."user"(id). Keep business resource IDs as UUID.

Use `auth.uid()` for RLS and security-sensitive functions so existing UUID ownership checks remain type-safe. Do not change the user IDs to TEXT for this inspected project.

The `neon_auth` schema and `neon_auth."user"` table are owned by Neon; the VYRA database role cannot create a trigger on that table. Do not attach triggers to Managed Auth tables. Instead, provision the VYRA profile with a self-scoped insert/upsert on the authenticated profile endpoint, protected by the profile INSERT policy and grants.

Do not overwrite Neon's auth helper schema or invent a custom identity claim. Apply GRANTs and RLS for the exact roles used by the Neon Data API. Unknown or missing JWT roles must not gain authenticated privileges.

## 6. Privileged server operations

The prior application used a Supabase service-role client to list instruments and persist market quotes. Neon has no Supabase `service_role` equivalent in this project; use the dedicated server-only PostgreSQL owner connection for the narrowly defined instrument read and quote-write tasks only.

Create a dedicated server-only Neon PostgreSQL module for privileged jobs:
- use a pooled connection string only on server code;
- separate read-only catalogue tasks from quote persistence and maintenance;
- use database roles with only required privileges;
- do not make an owner/BYPASSRLS key available to generic user-facing routes;
- do not create or grant a synthetic `service_role`; revoke Data API execution of the global order-matching function;
- ensure public quote refresh cannot match or execute another user's orders;
- keep user paper-order matching scoped to the user's own active account.

The user-scoped Data API client and the server-only administrative DB client must be separate modules with separate environment variables and tests.

## 7. Authentication flows to re-implement and verify

| Existing flow | Required Neon work |
|---|---|
| Email/password sign-up | Use the supported Supabase-compatible adapter or direct Managed Better Auth API |
| Password sign-in | Verify signInWithPassword against actual Neon Auth |
| Current user/session | Validate server-side; never trust client metadata |
| Sign out | Clear Managed Better Auth session cookies |
| Forgot password | Replace resetPasswordForEmail with the supported Managed Better Auth reset endpoint |
| Reset password | Replace updateUser({ password }) with the supported Better Auth reset-password method |
| OAuth | Configure provider in Neon Auth and test callback, redirect allow-list and cookie flow |
| Middleware | Use Neon's documented Next.js middleware/server integration |
| Protected API routes | Resolve a validated server session on each protected request; retain origin/CSRF protections |

Important: Neon docs warn that Supabase-style updateUser() is not a full replacement for Supabase password/email changes. Password reset must not be declared ready until the actual email and reset workflow succeeds end to end. Email confirmation and reset email delivery must also be tested against the active Neon Auth configuration.

A cookie-presence-only check may be used for optimistic UI redirection; it is not sufficient authorisation. Every protected query and mutation must validate the user and rely on RLS.

## 8. Development branch migration and test plan

Apply the Neon migration to a development branch first. Use synthetic accounts only.

### Authentication tests
- Create a new test user.
- Confirm email verification behavior.
- Sign in and retrieve a server-side session.
- Refresh the browser and verify session persistence.
- Sign out and verify session invalidation.
- Request a password reset, complete it, and verify the new password.
- Reject unapproved redirects.
- Reject invalid, expired or replayed session/callback state.
- Confirm secrets and token payloads are absent from logs and browser bundles.

### RLS / tenant isolation tests
Use two test users, A and B, and an anonymous client:
- A can read only A's profile, watchlist, account, orders, positions and ledger.
- A cannot read/update/delete B's records by guessing IDs.
- B cannot access A's data.
- Anonymous can only read explicitly granted instrument catalogue and market data.
- Missing, expired, malformed or wrong-role JWTs are denied.
- Verify Data API role claims and GRANTs, not merely the validity of JWT signature.

### Ledger and order tests
- Opening paper balance posts balanced journal entries.
- Buy fill debits position and credits cash.
- Sell fill releases basis and posts correct realised P&L.
- A failure mid-fill rolls back all related changes.
- Idempotent order retry cannot create a duplicate order or journal.
- Order, position and daily-loss risk limits are enforced.
- Cash/share reservations and cancellation remain balanced.
- Immutable ledger/audit triggers reject mutation.
- Stale and future quote timestamps are rejected.
- Limit order matching is scoped to the authenticated user's own paper account.

### Full application tests
- Unit tests.
- TypeScript typecheck.
- ESLint.
- Next.js production build.
- E2E sign-up/sign-in/sign-out/reset.
- Watchlist isolation.
- Paper account creation.
- Paper market/limit order, fill, cancel and ledger flows.
- Verify exact runtime/browser bundle contains no admin credentials.
- All GitHub Actions green on the intended release commit.

## 9. Cutover and rollback

There is no production VYRA Supabase database to cut over. Keep current Supabase files until the Neon implementation passes tests. Migrate the code and environment as one reviewed release. If Neon provisioning or integration fails, revert the application commit; do not use another product's Supabase database as a fallback.

If production VYRA customers or real partner records are ever added, provider changes require a proper data export, schema and ID mapping, downtime/dual-run plan, reconciliation and tested restore. Never switch a live financial book casually.

## 10. External blockers

- [x] Connect the Neon service and provision the isolated Free project `vyra-markets`.
- [x] Enable Managed Better Auth and the Data API.
- [x] Inspect actual Neon Auth schema, role configuration and helper functions.
- [x] Apply and inspect the SQL schema on the isolated Neon development branch.
- [ ] Store branch-matched Auth URL, Data API URL, pooled PostgreSQL URL and app cookie secret in the deployment secret store.
- [ ] Complete the application migration, CI and end-to-end RLS/auth/ledger tests.
- [ ] Apply the approved schema to the default paper branch only after the migration PR passes.

**Current truth (26 Nov 2026):** the Neon project `vyra-markets` is active on Free, and its VYRA test branch has the schema applied and introspected. The repository app migration is under review in `feat/neon-backend`; it has not been merged or deployed. No production environment secrets have been set. Supabase projects 9N8 and Space Ledger remain untouched.
