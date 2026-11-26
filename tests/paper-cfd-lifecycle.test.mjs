import test from 'node:test';
import assert from 'node:assert/strict';
import {
  cancelPaperCfdOrder,
  closePaperCfdPosition,
  createPaperCfdAccountState,
  expirePaperCfdOrder,
  fillPaperCfdOrder,
  getPaperCfdAccountSnapshot,
  reconcilePaperCfdState,
  rejectPaperCfdOrder,
  submitPaperCfdOrder,
  verifyPaperCfdEventChain,
  verifyPaperCfdJournals,
} from '../src/lib/cfd/paper-lifecycle.mjs';

const NOW = Date.parse('2026-11-26T10:00:00.000Z');
const contract = {
  contractCode: 'EURUSD', contractSize: 100000, minLots: 0.01,
  maxLots: 100, lotStep: 0.01, tickSize: 0.00001,
  maxLeverage: 100, enabled: true,
};
const quote = {
  bid: 1.1001, ask: 1.1002, source: 'paper-feed-a',
  observedAt: new Date(NOW - 200).toISOString(),
};
const policy = {
  maxLeverage: 20,
  maxExecutionDeviationBps: 25,
  maxQuoteAgeMs: 2000,
  policyId: 'policy-gb-retail',
  policyVersion: '2026-11-v1',
};
function makeState({ balance = 50000, status = 'active' } = {}) {
  const result = createPaperCfdAccountState({
    account: {
      accountId: 'paper-account-001', mode: 'paper', status,
      currency: 'USD', closeoutLevelPct: 50,
    },
    openingBalance: balance,
    openingJournalId: 'journal-opening-001',
    now: NOW,
  });
  assert.equal(result.ok, true);
  return result.state;
}
function orderRequest(overrides = {}) {
  return {
    orderId: 'order-001',
    eventId: 'event-submit-001',
    idempotencyKey: 'idem-submit-001',
    side: 'buy',
    orderType: 'market',
    lots: 1,
    requestedLeverage: 20,
    estimatedFeeAmount: 10,
    ...overrides,
  };
}
function submit(state, overrides = {}, q = quote, p = policy) {
  return submitPaperCfdOrder({
    state, request: orderRequest(overrides), contract, quote: q, policy: p, now: NOW,
  });
}
function execution(overrides = {}) {
  const freshQuote = {
    bid: 1.1002, ask: 1.1003, source: 'paper-feed-a',
    observedAt: new Date(NOW - 100).toISOString(),
  };
  return {
    price: 1.10025,
    source: 'paper-fill-simulator',
    observedAt: new Date(NOW - 100).toISOString(),
    quote: freshQuote,
    feeAmount: 4,
    externalExecutionId: 'paper-exec-001',
    venueId: 'paper-venue-a',
    ...overrides,
  };
}
function createAndSubmit(overrides = {}, opts = {}) {
  const state = makeState(opts);
  const result = submit(state, overrides);
  assert.equal(result.ok, true, result.message);
  return result;
}

test('creates a paper-only CFD account with a balanced opening journal', () => {
  const state = makeState();
  assert.equal(state.account.mode, 'paper');
  assert.equal(getPaperCfdAccountSnapshot(state).cashBalance, 50000);
  assert.equal(state.journals.length, 1);
  assert.equal(state.ledgerEntries.length, 2);
  assert.equal(verifyPaperCfdJournals(state).ok, true);
  assert.equal(reconcilePaperCfdState(state).ok, true);
});

test('refuses to create a live-account state through the paper engine', () => {
  const result = createPaperCfdAccountState({
    account: { accountId: 'live-account-001', mode: 'live', currency: 'USD', closeoutLevelPct: 50 },
    openingBalance: 10000, openingJournalId: 'journal-live-001', now: NOW,
  });
  assert.equal(result.code, 'LIVE_ACCOUNT_NOT_SUPPORTED');
});

test('accepts a paper order and reserves margin plus estimated fees', () => {
  const result = submit(makeState());
  assert.equal(result.ok, true);
  assert.equal(result.order.status, 'accepted');
  assert.equal(result.order.marginRequired, 5501);
  assert.equal(result.order.reservedAmountRemaining, 5511);
  assert.equal(getPaperCfdAccountSnapshot(result.state).pendingOrderMargin, 5511);
  assert.equal(result.paperOnly, true);
  assert.equal(result.state.orders.length, 1);
});

test('same idempotency key and same submit payload do not create a second order', () => {
  const first = submit(makeState());
  const second = submit(first.state);
  assert.equal(second.ok, true);
  assert.equal(second.replayed, true);
  assert.equal(second.state.orders.length, 1);
  assert.equal(second.state.events.length, 1);
  assert.equal(second.state.reservations.length, 1);
});

test('idempotency key cannot be reused with a different submit request', () => {
  const first = submit(makeState());
  const second = submit(first.state, { lots: 2 });
  assert.equal(second.code, 'IDEMPOTENCY_KEY_REUSE');
  assert.equal(first.state.orders.length, 1);
});

test('rejects and records stale quote orders without reserving margin', () => {
  const stale = { ...quote, observedAt: new Date(NOW - 10000).toISOString() };
  const result = submit(makeState(), {}, stale);
  assert.equal(result.ok, false);
  assert.equal(result.code, 'QUOTE_STALE');
  assert.equal(result.order.status, 'rejected');
  assert.equal(result.state.reservations[0].remainingAmount, 0);
  assert.equal(reconcilePaperCfdState(result.state).ok, true);
});

test('rejects orders whose margin and estimated fees exceed free margin', () => {
  const result = submit(makeState({ balance: 100 }));
  assert.equal(result.ok, false);
  assert.equal(result.code, 'INSUFFICIENT_FREE_MARGIN');
  assert.equal(result.order.status, 'rejected');
  assert.equal(getPaperCfdAccountSnapshot(result.state).pendingOrderMargin, 0);
});

test('requires explicit execution-deviation and quote-freshness controls', () => {
  const result = submit(makeState(), {}, quote, { maxLeverage: 20 });
  assert.equal(result.ok, false);
  assert.equal(result.code, 'EXECUTION_GUARD_MISSING');
});

test('suspended and closed accounts cannot accept new orders', () => {
  const result = submit(makeState({ status: 'suspended' }));
  assert.equal(result.code, 'ACCOUNT_NOT_ACTIVE');
  assert.equal(result.state, undefined);
});

test('limit orders retain their limit instructions for fill validation', () => {
  const result = submit(makeState(), {
    orderType: 'limit', limitPrice: 1.1003,
  });
  assert.equal(result.ok, true);
  assert.equal(result.order.orderType, 'limit');
  assert.equal(result.order.limitPrice, 1.1003);
});

test('market order cannot carry a conflicting limit price', () => {
  const result = submit(makeState(), { limitPrice: 1.1003 });
  assert.equal(result.code, 'MARKET_LIMIT_CONFLICT');
});

test('partial fills convert reserved margin into position margin and post fee journals', () => {
  const accepted = createAndSubmit();
  const result = fillPaperCfdOrder({
    state: accepted.state, orderId: 'order-001', fillId: 'fill-001',
    eventId: 'event-fill-001', idempotencyKey: 'idem-fill-001',
    positionId: 'position-001', feeJournalId: 'journal-fee-001',
    lots: 0.5, execution: execution(), now: NOW,
  });
  assert.equal(result.ok, true);
  assert.equal(result.order.status, 'partially_filled');
  assert.equal(result.order.filledLots, 0.5);
  assert.equal(result.order.remainingLots, 0.5);
  assert.equal(result.position.side, 'long');
  assert.equal(result.position.marginRequired, 2750.5);
  assert.equal(result.state.reservations[0].remainingAmount, 2755.5);
  assert.equal(getPaperCfdAccountSnapshot(result.state).cashBalance, 49996);
  assert.equal(verifyPaperCfdJournals(result.state).ok, true);
  assert.equal(reconcilePaperCfdState(result.state).ok, true);
});

test('a second fill completes the order and consumes the remaining reservation', () => {
  const accepted = createAndSubmit();
  const first = fillPaperCfdOrder({
    state: accepted.state, orderId: 'order-001', fillId: 'fill-001',
    eventId: 'event-fill-001', idempotencyKey: 'idem-fill-001',
    positionId: 'position-001', feeJournalId: 'journal-fee-001',
    lots: 0.5, execution: execution(), now: NOW,
  });
  const second = fillPaperCfdOrder({
    state: first.state, orderId: 'order-001', fillId: 'fill-002',
    eventId: 'event-fill-002', idempotencyKey: 'idem-fill-002',
    positionId: 'position-002', feeJournalId: 'journal-fee-002',
    lots: 0.5, execution: execution({ feeAmount: 5, externalExecutionId: 'paper-exec-002' }), now: NOW + 100,
  });
  assert.equal(second.ok, true);
  assert.equal(second.order.status, 'filled');
  assert.equal(second.order.remainingLots, 0);
  assert.equal(second.state.reservations[0].remainingAmount, 0);
  assert.equal(second.state.reservations[0].status, 'consumed');
  assert.equal(reconcilePaperCfdState(second.state).ok, true);
});

test('fill commands are idempotent and do not duplicate positions or fees', () => {
  const accepted = createAndSubmit();
  const input = {
    state: accepted.state, orderId: 'order-001', fillId: 'fill-001',
    eventId: 'event-fill-001', idempotencyKey: 'idem-fill-001',
    positionId: 'position-001', feeJournalId: 'journal-fee-001',
    lots: 0.5, execution: execution(), now: NOW,
  };
  const first = fillPaperCfdOrder(input);
  const retry = fillPaperCfdOrder({ ...input, state: first.state });
  assert.equal(retry.ok, true);
  assert.equal(retry.replayed, true);
  assert.equal(retry.state.positions.length, 1);
  assert.equal(retry.state.journals.length, 2);
  assert.equal(retry.state.events.length, 2);
});

test('a reused fill idempotency key with a changed fill is rejected', () => {
  const accepted = createAndSubmit();
  const input = {
    state: accepted.state, orderId: 'order-001', fillId: 'fill-001',
    eventId: 'event-fill-001', idempotencyKey: 'idem-fill-001',
    positionId: 'position-001', lots: 0.5, execution: execution(), now: NOW,
  };
  const first = fillPaperCfdOrder(input);
  const retry = fillPaperCfdOrder({ ...input, state: first.state, lots: 0.25 });
  assert.equal(retry.code, 'IDEMPOTENCY_KEY_REUSE');
});

test('rejects excessive adverse execution deviation and records the rejected fill event', () => {
  const accepted = createAndSubmit();
  const result = fillPaperCfdOrder({
    state: accepted.state, orderId: 'order-001', fillId: 'fill-bad-001',
    eventId: 'event-fill-bad-001', idempotencyKey: 'idem-fill-bad-001',
    positionId: 'position-bad-001', lots: 0.5,
    execution: execution({ price: 1.102 }), now: NOW,
  });
  assert.equal(result.ok, false);
  assert.equal(result.code, 'EXECUTION_PRICE_DEVIATION');
  assert.equal(result.state.positions.length, 0);
  assert.equal(result.state.events.at(-1).eventType, 'FILL_REJECTED');
  assert.equal(reconcilePaperCfdState(result.state).ok, true);
});

test('rejects fill when its quote is stale', () => {
  const accepted = createAndSubmit();
  const staleQuote = { ...execution().quote, observedAt: new Date(NOW - 10000).toISOString() };
  const result = fillPaperCfdOrder({
    state: accepted.state, orderId: 'order-001', fillId: 'fill-stale-001',
    eventId: 'event-fill-stale-001', idempotencyKey: 'idem-fill-stale-001',
    positionId: 'position-stale-001', lots: 0.5,
    execution: execution({ quote: staleQuote }), now: NOW,
  });
  assert.equal(result.code, 'QUOTE_STALE');
  assert.equal(result.state.positions.length, 0);
});

test('limit order fill cannot execute at a worse price than the client limit', () => {
  const accepted = createAndSubmit({ orderType: 'limit', limitPrice: 1.1002 });
  const result = fillPaperCfdOrder({
    state: accepted.state, orderId: 'order-001', fillId: 'fill-limit-001',
    eventId: 'event-fill-limit-001', idempotencyKey: 'idem-fill-limit-001',
    positionId: 'position-limit-001', lots: 0.5,
    execution: execution({ price: 1.10025 }), now: NOW,
  });
  assert.equal(result.code, 'LIMIT_PRICE_NOT_MET');
  assert.equal(result.state.positions.length, 0);
});

test('fill cannot exceed remaining lots', () => {
  const accepted = createAndSubmit();
  const result = fillPaperCfdOrder({
    state: accepted.state, orderId: 'order-001', fillId: 'fill-too-large',
    eventId: 'event-fill-too-large', idempotencyKey: 'idem-fill-too-large',
    positionId: 'position-too-large', lots: 1.1, execution: execution(), now: NOW,
  });
  assert.equal(result.code, 'FILL_QUANTITY_INVALID');
});

test('actual fill fees cannot exceed their reserved allowance', () => {
  const accepted = createAndSubmit({}, {});
  const result = fillPaperCfdOrder({
    state: accepted.state, orderId: 'order-001', fillId: 'fill-fee-001',
    eventId: 'event-fill-fee-001', idempotencyKey: 'idem-fill-fee-001',
    positionId: 'position-fee-001', lots: 0.5,
    execution: execution({ feeAmount: 6 }), now: NOW,
    feeJournalId: 'journal-fee-too-high',
  });
  assert.equal(result.code, 'FEE_EXCEEDS_RESERVATION');
  assert.equal(result.state, undefined);
});

test('partial fill followed by cancellation releases only the unfilled reservation', () => {
  const accepted = createAndSubmit();
  const first = fillPaperCfdOrder({
    state: accepted.state, orderId: 'order-001', fillId: 'fill-001',
    eventId: 'event-fill-001', idempotencyKey: 'idem-fill-001',
    positionId: 'position-001', feeJournalId: 'journal-fee-001',
    lots: 0.25, execution: execution({ feeAmount: 2 }), now: NOW,
  });
  const cancelled = cancelPaperCfdOrder({
    state: first.state, orderId: 'order-001', eventId: 'event-cancel-001',
    idempotencyKey: 'idem-cancel-001', reason: 'client_requested', now: NOW + 100,
  });
  assert.equal(cancelled.ok, true);
  assert.equal(cancelled.order.status, 'cancelled');
  assert.equal(cancelled.order.filledLots, 0.25);
  assert.equal(cancelled.order.remainingLots, 0.75);
  assert.equal(cancelled.releasedAmount, first.state.reservations[0].remainingAmount);
  assert.equal(cancelled.state.reservations[0].remainingAmount, 0);
  assert.equal(cancelled.state.positions.length, 1);
  assert.equal(reconcilePaperCfdState(cancelled.state).ok, true);
});

test('cancelling a fully filled order is rejected', () => {
  const accepted = createAndSubmit();
  const filled = fillPaperCfdOrder({
    state: accepted.state, orderId: 'order-001', fillId: 'fill-001',
    eventId: 'event-fill-001', idempotencyKey: 'idem-fill-001',
    positionId: 'position-001', feeJournalId: 'journal-fee-001',
    lots: 1, execution: execution({ feeAmount: 10 }), now: NOW,
  });
  const result = cancelPaperCfdOrder({
    state: filled.state, orderId: 'order-001', eventId: 'event-cancel-001',
    idempotencyKey: 'idem-cancel-001', now: NOW + 1,
  });
  assert.equal(result.code, 'ORDER_NOT_CANCELLABLE');
});

test('order expiry is blocked before the deadline and releases reservation at expiry', () => {
  const accepted = submit(makeState(), {
    expiresAt: new Date(NOW + 60000).toISOString(),
  });
  assert.equal(accepted.ok, true);
  const early = expirePaperCfdOrder({
    state: accepted.state, orderId: 'order-001', eventId: 'event-expire-early',
    idempotencyKey: 'idem-expire-early', now: NOW + 30000,
  });
  assert.equal(early.code, 'ORDER_NOT_EXPIRED');
  const expired = expirePaperCfdOrder({
    state: accepted.state, orderId: 'order-001', eventId: 'event-expire-final',
    idempotencyKey: 'idem-expire-final', now: NOW + 60000,
  });
  assert.equal(expired.ok, true);
  assert.equal(expired.order.status, 'expired');
  assert.equal(expired.state.reservations[0].remainingAmount, 0);
  assert.equal(reconcilePaperCfdState(expired.state).ok, true);
});

test('provider rejection releases the remaining reservation and records the reason', () => {
  const accepted = createAndSubmit();
  const rejected = rejectPaperCfdOrder({
    state: accepted.state, orderId: 'order-001', eventId: 'event-provider-reject',
    idempotencyKey: 'idem-provider-reject', reason: 'venue_rejected', now: NOW + 100,
  });
  assert.equal(rejected.ok, true);
  assert.equal(rejected.order.status, 'rejected');
  assert.equal(rejected.order.terminalReason, 'venue_rejected');
  assert.equal(rejected.state.reservations[0].remainingAmount, 0);
});

test('event hash chain detects changed event payloads', () => {
  const accepted = createAndSubmit();
  const changed = structuredClone(accepted.state.events);
  changed[0].payload.lots = 90;
  assert.equal(verifyPaperCfdEventChain(changed).code, 'EVENT_CHAIN_INVALID');
});

test('paper journal verifier detects altered debit or credit entries', () => {
  const state = makeState();
  const changed = structuredClone(state);
  changed.ledgerEntries[0].debit += 1;
  assert.equal(verifyPaperCfdJournals(changed).code, 'JOURNAL_RECONCILIATION_FAILED');
});

test('reconciliation detects order-to-reservation drift', () => {
  const accepted = createAndSubmit();
  const changed = structuredClone(accepted.state);
  changed.reservations[0].remainingAmount -= 1;
  assert.equal(reconcilePaperCfdState(changed).code, 'ORDER_RESERVATION_MISMATCH');
});

test('event chain remains valid after accept, partial fill and cancel', () => {
  const accepted = createAndSubmit();
  const filled = fillPaperCfdOrder({
    state: accepted.state, orderId: 'order-001', fillId: 'fill-001',
    eventId: 'event-fill-001', idempotencyKey: 'idem-fill-001',
    positionId: 'position-001', feeJournalId: 'journal-fee-001',
    lots: 0.2, execution: execution({ feeAmount: 2 }), now: NOW + 10,
  });
  const cancelled = cancelPaperCfdOrder({
    state: filled.state, orderId: 'order-001', eventId: 'event-cancel-001',
    idempotencyKey: 'idem-cancel-001', now: NOW + 20,
  });
  assert.equal(verifyPaperCfdEventChain(cancelled.state.events).ok, true);
  assert.equal(reconcilePaperCfdState(cancelled.state).ok, true);
});

test('fill quantities must respect the contract lot step', () => {
  const accepted = createAndSubmit();
  const result = fillPaperCfdOrder({
    state: accepted.state, orderId: 'order-001', fillId: 'fill-off-step',
    eventId: 'event-fill-off-step', idempotencyKey: 'idem-fill-off-step',
    positionId: 'position-off-step', lots: 0.015, execution: execution(), now: NOW,
  });
  assert.equal(result.code, 'FILL_QUANTITY_INVALID');
});

test('fill prices and quote prices must respect the CFD contract tick size', () => {
  const accepted = createAndSubmit();
  const result = fillPaperCfdOrder({
    state: accepted.state, orderId: 'order-001', fillId: 'fill-off-tick',
    eventId: 'event-fill-off-tick', idempotencyKey: 'idem-fill-off-tick',
    positionId: 'position-off-tick', lots: 0.5,
    execution: execution({ price: 1.100255 }), now: NOW,
  });
  assert.equal(result.code, 'EXECUTION_TICK_SIZE_INVALID');
  assert.equal(result.state.positions.length, 0);
});

test('limit price must respect the enabled contract tick size', () => {
  const result = submit(makeState(), {
    orderType: 'limit', limitPrice: 1.100205,
  });
  assert.equal(result.ok, false);
  assert.equal(result.code, 'LIMIT_PRICE_TICK_INVALID');
  assert.equal(result.order.status, 'rejected');
});


function closeExecution({ bid = 1.101, ask = 1.1011, price = bid, feeAmount = 3 } = {}) {
  const freshQuote = {
    bid, ask, source: 'paper-feed-a',
    observedAt: new Date(NOW - 100).toISOString(),
  };
  return {
    price, source: 'paper-close-simulator',
    observedAt: new Date(NOW - 100).toISOString(),
    quote: freshQuote, feeAmount,
  };
}

function filledPosition() {
  const accepted = createAndSubmit();
  const result = fillPaperCfdOrder({
    state: accepted.state, orderId: 'order-001', fillId: 'fill-close-001',
    eventId: 'event-fill-close-001', idempotencyKey: 'idem-fill-close-001',
    positionId: 'position-close-001', feeJournalId: 'journal-fee-open-001',
    lots: 1, execution: execution({ feeAmount: 4 }), now: NOW,
  });
  assert.equal(result.ok, true);
  return result;
}

test('partially closes a long CFD position, releases margin and books realised profit and fees', () => {
  const filled = filledPosition();
  const result = closePaperCfdPosition({
    state: filled.state, positionId: 'position-close-001',
    closeId: 'position-close-event-001', eventId: 'event-position-close-001',
    idempotencyKey: 'idem-position-close-001', lots: 0.5,
    pnlJournalId: 'journal-realised-profit-001',
    feeJournalId: 'journal-close-fee-001',
    execution: closeExecution({ bid: 1.101, ask: 1.1011, price: 1.10099, feeAmount: 3 }),
    now: NOW + 100,
  });
  assert.equal(result.ok, true);
  assert.equal(result.position.status, 'open');
  assert.equal(result.position.remainingLots, 0.5);
  assert.equal(result.position.closedLots, 0.5);
  assert.equal(result.position.marginRequired, 2750.5);
  assert.equal(result.positionClose.realisedPnl, 37);
  assert.equal(result.releasedMargin, 2750.5);
  assert.equal(result.state.positionCloses.length, 1);
  assert.equal(getPaperCfdAccountSnapshot(result.state).cashBalance, 50030);
  assert.equal(result.state.journals.length, 3);
  assert.equal(reconcilePaperCfdState(result.state).ok, true);
});

test('fully closes a long CFD position, realises a loss and removes used margin', () => {
  const firstClose = closePaperCfdPosition({
    state: filledPosition().state, positionId: 'position-close-001',
    closeId: 'position-close-profit-001', eventId: 'event-position-close-profit-001',
    idempotencyKey: 'idem-position-close-profit-001', lots: 0.5,
    pnlJournalId: 'journal-profit-first-001',
    execution: closeExecution({ bid: 1.101, ask: 1.1011, price: 1.101, feeAmount: 0 }),
    now: NOW + 100,
  });
  const finalClose = closePaperCfdPosition({
    state: firstClose.state, positionId: 'position-close-001',
    closeId: 'position-close-loss-001', eventId: 'event-position-close-loss-001',
    idempotencyKey: 'idem-position-close-loss-001', lots: 0.5,
    pnlJournalId: 'journal-loss-second-001',
    execution: closeExecution({ bid: 1.099, ask: 1.0991, price: 1.099, feeAmount: 0 }),
    now: NOW + 200,
  });
  assert.equal(finalClose.ok, true);
  assert.equal(finalClose.position.status, 'closed');
  assert.equal(finalClose.position.remainingLots, 0);
  assert.equal(finalClose.position.marginRequired, 0);
  assert.equal(finalClose.positionClose.realisedPnl, -62.5);
  assert.equal(getPaperCfdAccountSnapshot(finalClose.state).usedMargin, 0);
  assert.equal(reconcilePaperCfdState(finalClose.state).ok, true);
});

test('position close commands are idempotent and do not double-post realised P&L', () => {
  const filled = filledPosition();
  const input = {
    state: filled.state, positionId: 'position-close-001',
    closeId: 'position-close-idem-001', eventId: 'event-position-close-idem-001',
    idempotencyKey: 'idem-position-close-idem-001', lots: 1,
    pnlJournalId: 'journal-realised-idem-001',
    feeJournalId: 'journal-close-fee-idem-001',
    execution: closeExecution({ bid: 1.101, ask: 1.1011, price: 1.101, feeAmount: 2 }),
    now: NOW + 100,
  };
  const first = closePaperCfdPosition(input);
  const retry = closePaperCfdPosition({ ...input, state: first.state });
  assert.equal(retry.ok, true);
  assert.equal(retry.replayed, true);
  assert.equal(retry.position.status, 'closed');
  assert.equal(retry.state.positionCloses.length, 1);
  assert.equal(retry.state.journals.length, 3);
  assert.equal(retry.state.events.length, 2);
});

test('blocks position closes with stale quotes and excessive adverse price deviation', () => {
  const filled = filledPosition();
  const stale = closePaperCfdPosition({
    state: filled.state, positionId: 'position-close-001',
    closeId: 'position-stale-001', eventId: 'event-position-stale-001',
    idempotencyKey: 'idem-position-stale-001', lots: 1,
    pnlJournalId: 'journal-stale-001',
    execution: {
      ...closeExecution(),
      quote: { ...closeExecution().quote, observedAt: new Date(NOW - 10000).toISOString() },
    },
    now: NOW,
  });
  assert.equal(stale.code, 'QUOTE_STALE');
  const adverse = closePaperCfdPosition({
    state: filled.state, positionId: 'position-close-001',
    closeId: 'position-adverse-001', eventId: 'event-position-adverse-001',
    idempotencyKey: 'idem-position-adverse-001', lots: 1,
    pnlJournalId: 'journal-adverse-001',
    execution: closeExecution({ bid: 1.101, ask: 1.1011, price: 1.09, feeAmount: 0 }),
    now: NOW + 100,
  });
  assert.equal(adverse.code, 'CLOSE_EXECUTION_DEVIATION');
});

test('position close quantity must respect the CFD lot step and minimum partial volume', () => {
  const filled = filledPosition();
  const offStep = closePaperCfdPosition({
    state: filled.state, positionId: 'position-close-001',
    closeId: 'position-off-step-001', eventId: 'event-position-off-step-001',
    idempotencyKey: 'idem-position-off-step-001', lots: 0.015,
    execution: closeExecution(), now: NOW + 100,
  });
  assert.equal(offStep.code, 'POSITION_CLOSE_QUANTITY_INVALID');
  const belowMinimum = closePaperCfdPosition({
    state: filled.state, positionId: 'position-close-001',
    closeId: 'position-min-001', eventId: 'event-position-min-001',
    idempotencyKey: 'idem-position-min-001', lots: 0.005,
    execution: closeExecution(), now: NOW + 100,
  });
  assert.equal(belowMinimum.code, 'POSITION_CLOSE_QUANTITY_INVALID');
});

test('tampered closed-position lot history fails reconciliation', () => {
  const filled = filledPosition();
  const closed = closePaperCfdPosition({
    state: filled.state, positionId: 'position-close-001',
    closeId: 'position-tamper-001', eventId: 'event-position-tamper-001',
    idempotencyKey: 'idem-position-tamper-001', lots: 0.5,
    pnlJournalId: 'journal-tamper-001',
    execution: closeExecution({ feeAmount: 0 }), now: NOW + 100,
  });
  const changed = structuredClone(closed.state);
  changed.positions[0].remainingLots = 0.25;
  assert.equal(reconcilePaperCfdState(changed).code, 'POSITION_CLOSE_RECONCILIATION_FAILED');
});
