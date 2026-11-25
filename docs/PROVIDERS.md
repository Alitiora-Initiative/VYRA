# Provider strategy

Provider selection is intentionally pending. Evaluate and contract providers per asset class, jurisdiction and feature:

- Crypto: exchange API or regulated intermediary; account permissions, custody, order types, fee structure and regional availability.
- Equities/ETFs: brokerage partner with suitable licensing, fractional support and custody arrangements.
- FX/CFDs: appropriately regulated provider; carefully assess leverage and product restrictions.
- Commodities: determine whether access is spot, derivatives, ETFs or another instrument and its applicable rules.
- Market data: rights, display, redistribution, latency, licensing and exchange fees.

Keep adapters separate. Test sandboxes first; use credentials with least privilege and no withdrawal permission where possible. No provider is currently connected.
