# VYRA Paper CFD Ledger and Order Lifecycle

**Status:** domain engine and persistence schema committed on the brokerage feature branch. This is a paper-only implementation layer. It is not wired to the CFD traderoom/API, has not been applied to the main Neon database, and is not a live execution service.

## 1. Research translated into engineering requirements

### Kenya

The Capital Markets (Online Foreign Exchange Trading) Regulations, 2017:

- include CFDs based on foreign underlyings in the online foreign-exchange trading definition;
- require accurate, current books and records, including daily order records, cash books, journals and ledgers;
- require daily reconciliation between the designated client bank account and individual client ledgers;
- require client-money segregation and prohibit the use of client funds for margining, hedging or as company assets;
- require a minimum seven-year retention period for books and documents; and
- require governance, risk management, stop-loss, negative-account, margin-call and close-out procedures.

These are requirements for a licensed Kenyan online FX broker, not a statement that VYRA is licensed or that a software supplier automatically falls within every broker obligation. The current operative rule set, amendments, CMA circulars and VYRA's precise activity perimeter still need Kenyan legal review.

### Order records and protocol design

FCA COBS 11.5A is used as a comparative record-design reference, not as Kenyan law. It expects initial-order and order-processing records to capture the client, instrument, side, quantity, price, order type, timestamps and processing/venue information. FIX Execution Report conventions distinguish current order state from the event being reported; a cancellation request or pending-cancel state is not the same as a confirmed cancellation. The VYRA state machine therefore records acceptance, fills, cancellation, expiry and rejection as separate append-only events.

## 2. Paper-account model

The createPaperCfdAccountState function creates only a paper-mode state. It rejects any request to create a live account.

The opening balance is synthetic and is posted as a balanced journal:

| Ledger account | Debit | Credit |
|---|---:|---:|
| paper_cash | opening balance | 0 |
| paper_equity | 0 | opening balance |

The displayed cash balance is derived from paper_cash ledger entries, not an independently mutable balance field. A fill fee posts a second balanced journal: debit paper_trading_fees and credit paper_cash. Posted journals are immutable; corrections should use a reversing journal.

## 3. Order state machine

| Current state | Event | Next state | Margin treatment |
|---|---|---|---|
| none | valid order accepted | accepted | Reserve margin plus estimated fees |
| accepted | execution smaller than remaining size | partially_filled | Convert filled slice to position margin; retain reservation for remainder |
| accepted / partially_filled | remaining size executed | filled | Consume remaining reservation |
| accepted / partially_filled | client cancellation confirmed | cancelled | Release all remaining reservation |
| accepted / partially_filled | expiry reached and processed | expired | Release all remaining reservation |
| accepted / partially_filled | provider rejection confirmed | rejected | Release all remaining reservation |
| terminal state | any new fill/cancel | blocked | No new reservation or fill |

A partially filled order can end in cancelled, expired or rejected while retaining the already-created position slices. The unfilled quantity remains visible as remainingLots; it is not silently erased.

## 4. Acceptance controls

The submitPaperCfdOrder function:

1. requires an active paper account and an explicit market or limit instruction;
2. validates instrument specification, lot size, leverage, quote source, quote timestamp and available free margin through the existing CFD risk engine;
3. requires a configured maximum adverse execution deviation and quote-age threshold;
4. reserves calculated margin plus estimated fees before returning accepted;
5. records the approved policy reference/version, accepted quote source/time and price side; and
6. rejects the order if the account is suspended, margin is insufficient, the quote is stale or a required policy guard is missing.

Rejected risk checks are retained as rejected order records where a valid order/event identity exists. Structurally invalid commands are returned as validation errors before any order is persisted.

## 5. Fill, fees and partial execution

The fillPaperCfdOrder function accepts a fill only when:

- the order is accepted or partially filled;
- the fill ID is unique and the filled quantity does not exceed the remainder;
- the execution price, source, timestamp and fresh quote are present;
- the adverse difference from the accepted reference price is within the order's recorded limit;
- a limit order is filled at or better than its limit; and
- actual fees do not exceed the estimated fee allocation reserved for that fill.

Each accepted fill creates its own paper position slice. The engine converts the corresponding margin reservation into position margin, charges an actual fee using a balanced journal, and updates the remaining order quantity. A fill retry with the same idempotency key returns the prior result without making a second position or fee posting.

## 6. Cancellation, expiry and rejection

The cancelPaperCfdOrder function records a cancellation only when the order is still accepted or partially filled. It releases the unfilled reservation but never reverses a fill already recorded.

The expirePaperCfdOrder function blocks expiry before the stored deadline. At or after the deadline, it releases the unfilled reservation and appends an expiry event.

The rejectPaperCfdOrder function requires a reason and applies only to a still-open order. A rejection does not delete earlier fills.

All three terminal events are distinct and have independent idempotency keys. There is no ambiguous "cancel requested therefore cancelled" shortcut.

## 7. Position closure and realised P&L

The closePaperCfdPosition function supports full or partial position closure:

- verifies a fresh, source-labelled bid/ask quote and execution timestamp;
- enforces contract tick size, volume step and minimum partial-close quantity;
- checks adverse close-price deviation from the executable close side (bid for a long, ask for a short);
- realises P&L using the position's stored contract size and account-currency conversion rate;
- releases the corresponding fraction of the position's used margin;
- posts realised profit or loss through a balanced P&L journal and posts close fees separately;
- re-marks any remaining position using the latest close quote; and
- leaves an immutable close record and a POSITION_PARTIALLY_CLOSED or POSITION_CLOSED event.

A partially closed position retains its original opened lot quantity; remaining and cumulative closed lots are tracked independently. Reconciliation verifies that remaining lots plus all recorded close slices equal the original opened lots. The engine does not yet calculate overnight financing, dividends, corporate actions or tax.

## 8. Audit, idempotency and reconciliation

The domain module includes:

- per-command idempotency keyed by account and command key, with a request fingerprint to reject key reuse for different inputs;
- append-only account-sequenced events, each SHA-256-linked to the previous event;
- double-entry paper journals with debit/credit equality checks;
- explicit per-order reservations and reservation status;
- reconciliation across event-chain hashes, journal lines, filled/remaining lots, positions and reservations; and
- account snapshots derived from posted paper cash, open-position margin and remaining order reservations.

The SQL migration 20261126000700_vyra_paper_cfd_ledger.sql adds private paper account, order, position, reservation, journal, order-event, idempotency and reconciliation tables. Migration 20261126000800_vyra_paper_cfd_position_close.sql adds tick/volume metadata, position remaining/closed lots and immutable position-close records. Both migrations enable RLS and revoke client-role access; triggers prevent edits to events/idempotency/close records and posted ledger entries, and defer the double-entry balance check until journal posting.

The JavaScript module is a deterministic paper domain layer. Production integration must use server-side database transactions, row locks (or equivalent concurrency control), the database uniqueness constraints and a trusted execution adapter. An in-memory state object is not a substitute for concurrency-safe persistence.

## 8. Explicitly not implemented

This increment does not provide:

- an authenticated CFD paper-order API or traderoom submit/cancel buttons;
- a transactionally integrated Neon repository/service layer;
- an authenticated CFD paper-order API or traderoom submit/cancel buttons;
- account mark-to-market refresh, swaps/financing, dividends or corporate actions;
- margin-call and iterative stop-out liquidation;
- feed ingestion, FIX connectivity, LP venue execution, live order submission or real account balances; or
- a legal opinion, broker licence, best-execution certification, vendor conformance certificate or live-trading approval.

These remain the next required increments. In particular, the CFD traderoom must remain read-only until a transactional Neon service persists these domain decisions atomically, database concurrency/replay tests pass, and account valuation/financing/close-out have been implemented and tested together.

## Sources

- Kenya Law, [Capital Markets (Online Foreign Exchange Trading) Regulations, 2017](https://new.kenyalaw.org/akn/ke/act/ln/2017/226/eng%402023-10-06/publication), especially regulations 2–3, 15–16 and 21–23.
- FCA Handbook, [COBS 11.5A — Record keeping: client orders and transactions](https://handbook.fca.org.uk/handbook/cobs11/cobs11s12).
- FIX Trading Community, [FIX Latest Specification — Trade / Execution Report](https://www.fixtrading.org/wp-content/uploads/download-manager-files/FIX-Latest-Specification-Trade.pdf).
