# Security baseline

## Implemented in this repository

- Supabase SSR Auth uses cookie-backed sessions and refreshes claims in Next.js middleware.
- Authenticated endpoints call `auth.getUser()` before exposing or mutating user data.
- Account, order, profile, watchlist and sign-out mutations reject cross-origin Origin headers; absent Origin headers remain accepted for non-browser callers.
- The service-role key is read only by a server-only helper and is not exposed to the browser.
- User-owned rows use RLS policies keyed to `auth.uid()`.
- Ledger tables have no client write grants, are append-only, and use deferred balance triggers to ensure debits equal credits.
- Privileged paper-account/order functions validate `auth.uid()`, use a fixed search path and are placed in a non-exposed `private` schema. Public RPC wrappers are explicitly granted only to authenticated users.
- Quote freshness, order size, position exposure, daily realised loss and idempotency are checked server-side.
- Live execution adapters reject every live request. The client cannot toggle this gate.

## Required before production

- Apply and test migrations in a dedicated non-production Supabase project first.
- Enable MFA, secure recovery, email deliverability, CAPTCHA and rate limiting for sign-in/signup.
- Review Supabase exposed schemas. New Supabase projects created after the October 2026 Data API change do not automatically expose new public tables; explicitly expose `public` only where required, and keep RLS enabled.
- Configure strict CSP, trusted origins, CSRF protections for any future cookie-authenticated mutation beyond the same-origin API pattern, request limits, structured redacted logs and alerting.
- Use Vercel protected environments and least-privilege team access; set secrets per environment.
- Run dependency, secret, static-analysis and DAST scans; commission an independent penetration test.
- Test backup restoration, database point-in-time recovery (if provisioned), incident response, key rotation, access revocation, reconciliation and audit retention.
- Never place service-role keys, broker secrets, wallet seed phrases, private keys or withdrawal-capable credentials in client code, logs, GitHub Actions output or source control.

This is an engineering baseline, not a security certification.
