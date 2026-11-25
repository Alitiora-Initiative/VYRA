# Build sequence

## Implemented in code

1. Multi-asset Next.js application and responsive dashboard.
2. Supabase SSR authentication wiring: sign-up, sign-in, email confirmation callback, sign-out, password recovery and profile settings.
3. Provider market-data adapters: CoinGecko and Twelve Data, batch requests, free-tier-aware caching and honest source timestamps.
4. Supabase migration: profiles, instruments, accounts, risk limits, quotes, orders, fills, positions, ledger, audit and provider connection records.
5. RLS and authenticated private RPC functions.
6. Paper OMS: idempotent market/limit orders, cancellation, quote-age checks, open-order matching scoped to the authenticated account.
7. Paper risk controls: max order, per-instrument position, daily realised-loss stop, cash and share reservations, adverse slippage.
8. Double-entry immutable paper ledger, balanced posting triggers and visible account journal.
9. Asset-class-specific execution contracts with live execution hard-disabled.
10. Unit tests, GitHub Actions validation workflow and Dependabot update configuration.

## Zero-capital setup still required

1. Choose a hosting workspace for the free Render web-service blueprint. Two workspaces are available; no service has been created yet.
2. Provision a dedicated VYRA database/Auth project on a free plan. The two currently connected Supabase projects belong to other products and are not being reused or modified.
3. Apply the migration, expose the public schema to the Supabase Data API where needed, and configure RLS/redirects.
4. Configure the public Supabase URL/publishable key and server-only service-role key on the chosen host.
5. Add a Twelve Data Basic key for equities/FX/metals. Its current free allowance is limited, so quote batching/caching is deliberately slow. Crypto uses CoinGecko's public endpoint and optional demo key.
6. Run CI, build, database/RLS verification and a paper-account smoke test before sharing a public preview.

## Before real-money operations

1. Select and contract asset-class-specific execution/custody providers.
2. Complete legal/regulatory review for every intended market and customer jurisdiction.
3. Implement provider adapters, sandbox tests, order-state reconciliation, fees, settlement and failure recovery.
4. Build KYC/AML/sanctions, client-asset controls, deposits/withdrawals and independent reconciliation.
5. Complete security audit, penetration testing, incident response, monitoring and kill-switch certification.
6. Run internal staff tests, then a limited approved pilot, then staged production rollout only after all sign-offs.

The roadmap is a gating plan, not a claim that missing infrastructure, broker integrations or approvals already exist.
