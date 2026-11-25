# Build sequence

## Implemented in code
1. Multi-asset Next.js foundation and responsive market console.
2. Supabase SSR authentication wiring and callback flow.
3. Provider-backed market data adapters for crypto, equities, FX and metals; no hardcoded prices.
4. Supabase migration with profiles, instrument catalogue, accounts, risk limits, quotes, orders, fills, positions, ledger, audit and provider connection records.
5. RLS, private paper RPC functions, idempotent market/limit paper orders, cancellation and market quote matching.
6. Paper risk gates and immutable balanced ledger postings.
7. Provider-specific execution contract boundary with all live execution hard-disabled.
8. Unit tests and deployment workflow.

## Infrastructure still to configure
1. Provision a dedicated VYRA Supabase project and apply the migration.
2. Set the Supabase Data API exposed schema and verify RLS / grants.
3. Set Vercel environment variables and confirm the deploy build.
4. Add a Twelve Data key if equities, FX and commodity quotes are required; configure CoinGecko demo key if rate limits require it.
5. Configure email provider, allowed redirect URLs, CAPTCHA and MFA policy.

## Before real-money operations
1. Select and contract asset-class-specific execution/custody providers.
2. Complete legal/regulatory review for every intended market and customer jurisdiction.
3. Implement provider adapters, sandbox tests, order-state reconciliation, fees, settlement and failure recovery.
4. Build KYC/AML/sanctions, client-asset controls, deposits/withdrawals and independent reconciliation.
5. Complete security audit, penetration testing, incident response, monitoring and kill-switch certification.
6. Run internal staff tests, then a limited approved pilot, then staged production rollout only after all sign-offs.

The roadmap is a gating plan, not a claim that these integrations or approvals already exist.
