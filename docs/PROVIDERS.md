# Provider integration matrix

VYRA separates market data from execution. A market-data API key does not create a broker relationship and does not authorize trading.

## Free-tier request budget

Twelve Data's Basic tier currently documents 8 API credits per minute and an 800-credit daily cap; the quote endpoint consumes one credit per symbol and multi-symbol batch requests still consume one credit per symbol. VYRA therefore batches its eight non-crypto symbols into one API call and caches that result for 15 minutes. This is a best-effort zero-cost development allowance, not a real-time market-data SLA. Do not increase the refresh frequency on the Basic key without recalculating daily credits. See [Twelve Data batch request guidance](https://support.twelvedata.com/en/articles/5203360-batch-api-requests), [credits](https://support.twelvedata.com/en/articles/5615854-credits) and [pricing](https://twelvedata.com/pricing).

## Implemented market data

| Asset class | Adapter | State | Scope |
| --- | --- | --- | --- |
| Crypto | CoinGecko | Code implemented | BTC, ETH and SOL USD spot snapshots; public endpoint with optional demo API key |
| Equities | Twelve Data | Code implemented, key required | AAPL, NVDA and MSFT quote snapshots |
| FX | Twelve Data | Code implemented, key required | EUR/USD, GBP/USD and USD/JPY quote snapshots |
| Commodities | Twelve Data | Code implemented, key required | XAU/USD and XAG/USD quote snapshots |

The API preserves each provider's returned time for Twelve Data. CoinGecko's simple-price endpoint does not return a quote timestamp, so VYRA records the retrieval time for that provider and should not describe it as an exchange timestamp. The API never fills missing instruments with sample prices.

## Execution adapter slots

The TypeScript execution contract exists, but all four asset-class adapters are hard-disabled. There are no broker credentials, OAuth flows, account links, order routes or provider certification in the current build.

Candidate provider due diligence (not an endorsement or connection):
- Crypto: Coinbase Advanced Trade or a venue/provider approved for the operating jurisdiction.
- Equities/ETFs: Interactive Brokers or Alpaca where eligibility and jurisdiction allow.
- FX: OANDA or another properly licensed FX provider.
- Commodities: regulated futures/CFD venue or broker according to the product and country; spot metal data does not imply commodity execution.

Before selecting an execution provider, compare legal entity, jurisdictions accepted, client-money and custody model, instrument coverage, market hours, order types, fractional support, shorting/margin, API permissions, idempotency, webhook signatures, rate limits, sandbox, fee schedule, settlement, reconciliation and incident SLAs.

## Adding a real provider

Each adapter must have:
1. Server-side secret storage and credential rotation.
2. OAuth or API-key scope minimisation; withdrawal permission must not be requested for trading.
3. Provider-specific instrument and order-type mapping.
4. Signed webhook verification and replay protection.
5. Idempotent submit/cancel/replace handling and status reconciliation.
6. Provider sandbox/conformance tests, rate-limit handling and an explicit kill switch.
7. A feature flag defaulting off, and production approval separate from code deployment.

Do not reuse crypto spot semantics for FX, listed securities or derivatives. These classes have different sessions, settlement, market rules and risk.
