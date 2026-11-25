# Ledger design notes

Production accounting must use immutable double-entry postings and an explicit chart of accounts, currency precision, transaction lifecycle, holds/reservations, settlement, reversals, reconciliation and idempotency. Balances should be derived from postings or reconciled materialized views. Never mutate ledger history; correct via compensating entries. Ledger implementation is not yet present.
