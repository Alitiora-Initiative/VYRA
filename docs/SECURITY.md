# Security baseline

- Do not put credentials, signing keys, access tokens, PII or production data in git.
- Live trading is disabled in this codebase.
- Before production: threat model, security review, MFA, robust session management, secret rotation, webhook signature verification, authorization matrix, abuse throttling, encrypted data, backup/restore, incident response, penetration testing and vulnerability disclosure process.
- Order submission must be server-side, idempotent, validated and logged; never trust client price, balance or position claims.
- Require multi-step authorization for withdrawals and sensitive administrative actions.
