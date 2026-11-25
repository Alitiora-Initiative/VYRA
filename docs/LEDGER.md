# VYRA paper ledger

## Chart of accounts

Each simulated account receives four USD ledger accounts:
- `cash` — debit-normal cash balance.
- `positions` — debit-normal position book value.
- `equity` — credit-normal paper opening capital.
- `realized_pnl` — credit-normal gains / debit-normal losses.

## Posting rules

The opening paper balance posts debit cash / credit equity for USD 100,000. A paper buy posts debit positions / credit cash. A paper sale posts debit cash, credits positions at average book cost, and recognises the difference in realised P&L. Each journal is required to balance before commit.

Ledger transaction and entry rows are append-only. Corrections must be compensating transactions, never updates/deletes. Orders and fills are linked to ledger references and carry UUID client idempotency keys.

## Scope and limitations

This ledger is a paper-account book, not a production client-money ledger. It does not handle real deposits, withdrawals, multi-currency cash, FX conversion, settlement holds, margin, financing, corporate actions, derivatives variation margin, chargebacks, custody or bank reconciliation. These require separate asset-class and jurisdiction designs, external control accounts, reconciliation jobs and audited exception workflows.

## Reconciliation requirements before live launch

- Daily per-provider trade/fee/settlement reconciliation.
- Per-currency control accounts and settlement receivables/payables.
- Cash and position control totals with independent source statements.
- Compensating journal flow with approval and immutable audit event.
- Segregated client-money rules and custody controls determined by counsel and applicable regulator.
- Independent accounting review and end-of-day sign-off.
