# VYRA Database Provider Decision — Zero-Capital Options

**Research date:** 26 November 2026  
**Constraint:** zero capital, private GitHub repository, existing PostgreSQL schema and Next.js application.  
**Decision:** Neon Postgres Free is provisioned and selected for the isolated development and paper-trading database. The schema is applied; application integration and end-to-end release tests are still in progress. No real customer money or live brokerage activity may use a free-tier database.

## 1. Executive decision

The database issue is solvable without touching the two existing Supabase projects. Neon Postgres is the best current match, not Firebase Firestore.

VYRA already has a relational PostgreSQL design with foreign keys, transactional PL/pgSQL functions, ledger posting, deferred journal-balance checks, advisory locks, immutable audit triggers, row-level security and PostgREST-style queries. These safeguards are central to the financial simulation. Moving to a document database would require a broad rewrite.

Neon provides managed PostgreSQL, a PostgREST-compatible Data API, PostgreSQL RLS/JWT integration and Managed Better Auth. Neon also publishes a Supabase-compatible auth adapter. This offers a practical path to keep the existing query-builder style while replacing Supabase-specific hosting and authentication. It is not a zero-change URL swap: user IDs, auth flows, roles, SQL helper functions and privileged server access must be adapted and tested.

### Recommended stack

- Database: provisioned Neon Postgres Free project `vyra-markets` in Frankfurt, database `vyra`, branch `br-tiny-lake-bhoos1ij`.
- Authentication: provisioned Neon Managed Better Auth with verified email required; the Next.js integration is committed, but email delivery and recovery need end-to-end tests.
- Data access: provisioned Neon Data API, with the Neon SDK Data API client in the Next.js app.
- Privileged server operations: dedicated quote-ingestion role for market quotes only; database owner credentials are never passed to the browser.
- App host: Render or Netlify for paper-demo use only; separate from database.
- Source of truth: reviewed SQL migrations in the private GitHub repository.

Neon Free is appropriate for development, synthetic data, paper accounts and partner sandbox testing. It is not an approved live brokerage book of record: compute can suspend when quotas are exhausted, it scales to zero, and the free plan does not supply the support, resilience, backup and recovery commitments required for regulated financial production.

## 2. Provider comparison

| Provider | Current free offer checked 26 Nov 2026 | PostgreSQL compatible? | VYRA assessment |
|---|---|---|---|
| Neon Postgres | 1 GB/project, 100 CU-hours/project/month, up to 100 projects, 10 branches/project, 5 GB public transfer/project/month; scale-to-zero after 5 min; Managed Better Auth up to 60,000 MAU | Yes, native managed Postgres | First choice |
| Supabase Free | 500 MB, 50,000 MAU, 5 GB egress, 1 GB file storage; two active free projects across all organisations where user is owner/admin; low-activity projects can pause after 7 days | Yes, native Postgres + Auth + PostgREST + RLS | Excellent stack fit, but current account quota is full and unrelated projects must remain untouched |
| Aiven PostgreSQL Free | 1 CPU, 1 GB RAM, 1 GB disk, single-node; no connection pooler; max 20 connections; no 99.99% SLA; may power off after inactivity | Yes, native Postgres | Second choice / fallback |
| Firebase Firestore Spark | 1 GiB stored, 50,000 reads/day, 20,000 writes/day, 20,000 deletes/day, 10 GiB monthly transfer; one free database/project; backups/PITR/restore billed | No, document database | Not suitable as VYRA's core DB without a major ledger and API rewrite |
| Firebase SQL Connect / Cloud SQL Postgres | One 3-month free-trial Cloud SQL PostgreSQL instance; after trial standard charges begin (Firebase currently lists from about $9.37/month depending on setup); trial instance is archived if not upgraded | Yes, Postgres | Technically compatible, but not a permanent zero-cost route |
| Render Postgres Free | 1 GB but database expires after 30 days; 14-day upgrade grace before deletion | Yes, Postgres | Temporary testing only, not durable |
| Railway Free | $1 monthly usage credit, Postgres service with 0.5 GB volume; services sleep when idle and stop if credit is exhausted | Yes, Postgres | Sandbox only; tiny resource allowance |
| Turso Free | 5 GB, high read quota and 10 million writes/month on current pricing | SQLite/libSQL, not Postgres | Would require rewriting SQL functions, triggers, RLS and transaction logic |
| MongoDB Atlas M0 | Small free shared cluster; document model | No | Not a good match for the existing relational journal and SQL procedures |

### Primary sources

- Neon Free limits and quotas: https://neon.com/docs/introduction/plans
- Neon announcement of 1 GB Free storage per project (2 Oct 2026): https://neon.com/blog/neon-free-plan-1-gb-per-project
- Neon Managed Better Auth / Data API: https://neon.com/docs/auth and https://neon.com/docs/data-api
- Neon Data API security and RLS: https://neon.com/docs/data-api/access-control
- Neon Supabase-compatible auth adapter: https://github.com/neondatabase/neon-js/tree/main/packages/auth
- Supabase Free project limit: https://supabase.com/docs/guides/platform/billing-on-supabase
- Supabase inactivity pausing: https://supabase.com/docs/guides/platform/free-project-pausing
- Firebase Firestore pricing: https://firebase.google.com/docs/firestore/pricing
- Firebase SQL Connect pricing: https://firebase.google.com/docs/sql-connect/pricing
- Aiven Free PostgreSQL: https://aiven.io/docs/products/postgresql/concepts/pg-free-tier
- Render Free: https://render.com/docs/free
- Railway Free: https://docs.railway.com/pricing/free-plan
- Turso pricing: https://turso.tech/pricing

## 3. Why Neon is the best fit

### 3.1 Preserve the existing financial data model

VYRA uses foreign keys between accounts, instruments, orders, fills, positions, ledger accounts, journal entries and audit events. It uses transactional PL/pgSQL functions, advisory locks, deferred balance checks, immutable audit triggers, numeric, jsonb and timestamptz. Neon is PostgreSQL, so these database features can remain with a carefully reviewed identity/role conversion.

### 3.2 Keep the PostgREST query pattern

Current VYRA routes use the Supabase query builder for operations such as selecting rows, filtering by owner, ordering, upserting watchlist items and calling stored procedures with RPC. Neon's Data API implements a PostgREST-compatible interface. The Neon SDK's Supabase adapter aims to preserve the familiar auth method surface.

This reduces the code rewrite, but does not prove every query relationship, response type, error code or RPC behaviour will be identical. All existing endpoints must be run against a real Neon test project.

### 3.3 Retain PostgreSQL RLS

Neon's Data API delegates security to PostgreSQL table grants and RLS policies. Neon documents a JWT authenticated role and the helper auth.user_id() (text user identity); auth.uid() is available for UUID-form subjects. VYRA should use auth.user_id() for owner checks and change owner columns to TEXT rather than assume a Better Auth ID is UUID-form.

A signed JWT alone is not enough: the correct database role claim, GRANTs and RLS policies must all be configured. Never expose a database-owner or RLS-bypass credential to the browser.

### 3.4 Authentication is included, with migration caveats

Neon Free includes Managed Better Auth up to 60,000 monthly active users. User and session data live in the database's neon_auth schema. The Neon SDK offers a Supabase-style adapter for familiar operations such as password sign-in, sign-up, session lookup, sign-out and auth-state notifications.

The cutover still has limits:
- Password hashes cannot be transferred into Neon Managed Better Auth.
- Do not promise user IDs, sessions or account links remain unchanged.
- The Supabase-style updateUser() is not equivalent for changing passwords/emails on Managed Auth.
- Password-reset/change must be rebuilt using the supported Better Auth reset endpoints and tested end to end.
- Email verification and reset delivery must be checked against the Managed Auth configuration; do not claim these flows work before testing.
- Managed Better Auth exposes a supported subset of Better Auth plugins. Confirm every desired login method before selecting it.

At the time this provider comparison was first written, VYRA had not yet provisioned a dedicated database. The decision has since been implemented: the isolated Neon project `vyra-markets` is provisioned and its Neon-native schema is applied. No previous production user accounts or passwords needed migration. The unrelated Supabase projects remain untouched.

## 4. Why not Firebase Firestore?

Firestore is strong for document-centric applications, realtime sync and offline clients. VYRA's current financial model is relational and transaction-centric.

Switching to Firestore would require:
- redesigning foreign keys and joins as document references/subcollections;
- recreating account, position, order, fill and ledger consistency across documents;
- replacing SQL stored procedures, advisory locks, triggers and deferred journal checks with trusted server transaction handlers;
- rebuilding the double-entry ledger and immutable audit controls;
- creating a new authorisation layer with Firebase Authentication claims and Security Rules;
- rewriting all route queries and adding a new reconciliation/test suite.

Firestore's free reads/writes do not compensate for the rewrite and integrity risks. It should not be the main VYRA ledger.

### Firebase SQL Connect is not a permanent free Postgres solution

Firebase SQL Connect uses Cloud SQL for PostgreSQL, so its relational model is technically closer. However, the current free instance is a three-month trial, not a permanent zero-cost database. Standard Cloud SQL charges begin after the trial. It therefore does not solve the long-term zero-capital constraint.

## 5. Why Aiven is the fallback

Aiven's Free PostgreSQL is time-unlimited and can be created without a credit card. It includes 1 GB RAM, 1 CPU and 1 GB disk, plus monitoring and backups. However, it has no connection pooling, a 20-connection maximum, no 99.99% SLA and can power down after inactivity. Aiven also does not include Neon-style Managed Better Auth and PostgREST Data API in this Free plan.

Use Aiven if Neon provisioning or the Managed Better Auth route is unavailable and VYRA is comfortable retaining a separate auth service plus direct PostgreSQL access. Keep connection pooling and connection counts under explicit control.

## 6. Provisioned Neon environment

- One isolated project named vyra-markets.
- One database named vyra.
- Root/production branch for the paper environment.
- Development branch for schema migration, RLS tests and synthetic users.
- Separate disposable branches for pull-request or integration tests as needed.
- No shared database with Space Ledger, 9N8 or other products.
- PostgreSQL Data API for user-scoped requests, backed by JWT, grants and RLS.
- Pooled PostgreSQL connection for server-only migrations and restricted maintenance.
- All credentials stored as host secrets; never committed to Git.

The active VYRA application currently uses these environment settings:
- `NEON_AUTH_BASE_URL`
- `NEON_AUTH_COOKIE_SECRET` (32+ random characters; server-only)
- `NEON_DATA_API_URL`
- `NEON_MARKET_DATA_DATABASE_URL` (pooled URL for the restricted `vyra_quote_ingest` role, server-only)
- optional `TWELVEDATA_API_KEY` and `COINGECKO_DEMO_API_KEY`
- optional `NEXT_PUBLIC_GTM_ID`, loaded only after analytics consent

Do not add a generic database-owner `DATABASE_URL`, Neon admin API key or owner connection string to public application routes. Provisioning is managed through Neon separately; the runtime quote writer must use its restricted role.

## 7. Implemented migration and remaining verification

The original numbered sequence below has been completed in substance and superseded by the active runbook. Current implementation:
1. Provisioned the dedicated Neon project `vyra-markets` and database `vyra` in Frankfurt.
2. Enabled Neon Managed Better Auth and the Neon Data API.
3. Created isolated branch `vyra-dev` from main.
4. Inspected actual Managed Better Auth schema and confirmed UUID identity. Existing VYRA user references remain UUID; the active policies use `auth.uid()`.
5. Applied `neon/migrations/20261126000100_vyra_core.sql` to the development branch and the main paper branch.
6. Replaced the active Supabase application runtime with Neon Auth, Neon Data API and a restricted server-only quote-writer connection.
7. Enabled RLS on all 14 public VYRA tables and inspected the 19 policies and database grants.
8. Restricted the quote writer so it cannot access or change customer accounts, orders, positions or ledger records.
9. Enabled mandatory email OTP verification and session revocation on password reset.
10. Passed a full GitHub Actions run covering 16 unit tests, TypeScript, ESLint and the production Next.js build.

Remaining work:
- two-user signed-JWT cross-tenant isolation tests;
- end-to-end signup/OTP/password-reset/session/logout testing with a controlled mailbox;
- paper account/order/fill/cancel/ledger concurrency and rollback testing against Neon;
- encrypted export and tested restore;
- hosted paper-demo runtime verification.

See `docs/NEON_MIGRATION_RUNBOOK.md` for the exact branch IDs, verified roles, auth settings and release gates.

## 8. Reliability and production boundary

Neon Free provides a short instant-restore history window and constrained compute/network usage. It is not equivalent to a paid support, high-availability or long-retention backup contract. Keep the paper environment synthetic and maintain periodic encrypted exports outside Git with a tested restore procedure.

Before any future regulated production use, VYRA and its licensed partner must establish supported backups, tested disaster recovery, explicit RPO/RTO, failover and monitoring, audit evidence, access reviews, key management, incident response, data location and cross-border safeguards, and sufficient capacity. Do not use any Free database as the authoritative book of record for live customers.

## 9. Actual provisioned state (26 November 2026)

- Dedicated Neon project: `vyra-markets`, Frankfurt (`aws-eu-central-1`), project ID `dawn-wind-08199003`.
- Database: `vyra`; main branch: `br-tiny-lake-bhoos1ij`; isolated validation branch: `vyra-dev` (`br-lively-morning-bhf3wagy`).
- Neon Managed Better Auth and the Neon Data API are enabled on main.
- The Neon-specific migration `neon/migrations/20261126000100_vyra_core.sql` is applied to main and the validation branch.
- The inspected Managed Better Auth user table uses UUID IDs. VYRA retains UUID user references and uses `auth.uid()`; it does not modify Neon-managed auth tables.
- Verified on the validation branch: 14 public VYRA tables, all 14 with RLS enabled, 19 public RLS policies, and narrow role/function privileges. Anonymous users cannot read accounts/orders; authenticated users cannot directly insert orders or execute the global matcher.
- The restricted `vyra_quote_ingest` role is used only for quote persistence; it cannot modify user accounts, orders, positions or ledger records.
- The active Next.js application uses Neon Managed Better Auth, Neon Data API and a server-only PostgreSQL quote writer. The old Supabase runtime path is no longer active. Existing Supabase projects 9N8 and Space Ledger remain untouched.
- Email/password sign-up is enabled and email verification is required using OTP. Verification emails are configured for sign-up/sign-in; password resets revoke sessions. Email delivery and reset completion still need end-to-end testing.
- GitHub Actions completed successfully on commit `9f0e6d65ceed9a53fdf5457f600d5a67adc37783`: 16 unit tests, TypeScript, ESLint and production build all passed. A later documentation-only run is being checked separately.
- No VYRA Render service exists. A paper-demo service remains blocked only by workspace choice and subsequent secret configuration.
- Two-user JWT-backed RLS tests, full paper OMS/ledger integration tests, backup/restore evidence, and deployed auth tests remain outstanding.
- No signed broker contract, provider-supplied legal PDFs, country/product approvals, funding rail, KYC provider, liquidity/dealing connection, native mobile application or affiliate programme exists.

**Decision:** Neon Postgres Free is the chosen isolated development and paper-trading database. Keep Aiven as a fallback. Do not use Firestore as the core ledger. Do not use a Free database as the authoritative book of record for live brokerage customers.
