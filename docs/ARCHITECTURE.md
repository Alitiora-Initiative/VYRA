# VYRA architecture (initial)

## Principle
VYRA is a multi-asset brokerage software prototype. It must not imply that it is licensed, connected to real execution, or displaying live data until those claims are independently verified.

## Domains
- Identity and account profile (auth provider to be selected; MFA and recovery required)
- Instrument catalogue and provider-backed market data
- Order management system (OMS), immutable order lifecycle
- Pre-trade risk: limits, asset eligibility, stale-data rejection, idempotency and kill switch
- Execution adapters: separately scoped provider integrations for crypto, equities, FX and commodities
- Double-entry ledger, settlement/reconciliation and withdrawal controls
- Audit trail, monitoring, incident response and admin console

## Security requirements
Secrets only server-side; encrypted storage; signed webhooks; rate limits; strict validation; CSRF protection; secure sessions; MFA; access roles; tamper-resistant audit; dependency scans; backup and restore tests. No client-side API secrets or privileged signing keys.

## Execution policy
Paper trading is the default. Live order execution stays disabled until legal/regulatory review, provider approval, KYC/AML requirements, funding, custody, execution tests, monitoring, and incident/kill-switch procedures are validated. Never represent paper results as real fills.

## Provider interface
Provider adapters should implement capabilities rather than pretend all asset classes share the same order types, session hours, custody, settlement or market-data semantics.
