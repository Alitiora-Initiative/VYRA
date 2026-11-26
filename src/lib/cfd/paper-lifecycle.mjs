import { createHash } from 'node:crypto';
import { calculateCfdMarginSnapshot, calculateCfdOrderRisk, validateCfdQuote } from './engine.mjs';

const ZERO_HASH = '0'.repeat(64);
const EPSILON = 1e-8;
const TERMINAL = new Set(['filled', 'cancelled', 'expired', 'rejected']);
const POSITIVE = (value) => Number.isFinite(value) && value > 0;

function fail(code, message, extra = {}) {
  return { ok: false, code, message, ...extra };
}

function round8(value) {
  return Number(Number(value).toFixed(8));
}

function nearlyEqual(a, b) {
  return Math.abs(Number(a) - Number(b)) <= EPSILON;
}

function onIncrement(value, increment) {
  if (!POSITIVE(value) || !POSITIVE(increment)) return false;
  const steps = value / increment;
  return Math.abs(steps - Math.round(steps)) <= 1e-7;
}

function canonical(value) {
  if (Array.isArray(value)) return '[' + value.map(canonical).join(',') + ']';
  if (value && typeof value === 'object') {
    return '{' + Object.keys(value).filter((key) => value[key] !== undefined).sort()
      .map((key) => JSON.stringify(key) + ':' + canonical(value[key])).join(',') + '}';
  }
  return JSON.stringify(value);
}

function digest(value) {
  return createHash('sha256').update(canonical(value)).digest('hex');
}

function validId(value) {
  return typeof value === 'string' && value.trim().length >= 3 && value.length <= 180;
}

function cashBalance(state) {
  return round8(state.ledgerEntries
    .filter((entry) => entry.accountCode === 'paper_cash')
    .reduce((sum, entry) => sum + entry.debit - entry.credit, 0));
}

function activeReservedMargin(state) {
  return round8(state.reservations
    .filter((reservation) => reservation.status === 'active')
    .reduce((sum, reservation) => sum + reservation.remainingAmount, 0));
}

function accountSnapshot(state) {
  return calculateCfdMarginSnapshot({
    balance: cashBalance(state),
    positions: state.positions.filter((position) => position.status === 'open'),
    closeoutLevelPct: state.account.closeoutLevelPct,
    pendingOrderMargin: activeReservedMargin(state),
    otherReservedMargin: 0,
  });
}

function buildEvent(state, { eventId, eventType, orderId = null, payload, now }) {
  if (!validId(eventId) || state.events.some((event) => event.eventId === eventId)) {
    return fail('EVENT_ID_INVALID_OR_DUPLICATE', 'A unique event ID is required for every recorded event.');
  }
  const previousHash = state.events.at(-1)?.eventHash ?? ZERO_HASH;
  const unsigned = {
    eventId,
    accountId: state.account.accountId,
    orderId,
    sequence: state.events.length + 1,
    eventType,
    occurredAt: new Date(now).toISOString(),
    payload,
    previousHash,
  };
  return { ok: true, event: { ...unsigned, eventHash: digest(unsigned) } };
}

function addEvent(state, event) {
  return { ...state, events: [...state.events, event] };
}

function startCommand(state, { idempotencyKey, operation, fingerprint }) {
  if (!validId(idempotencyKey)) return { error: fail('IDEMPOTENCY_KEY_REQUIRED', 'A unique idempotency key is required for every command.') };
  const existing = state.idempotency.find((item) => item.idempotencyKey === idempotencyKey);
  if (!existing) return { idempotencyKey, operation, fingerprint };
  if (existing.operation !== operation || existing.fingerprint !== fingerprint) {
    return { error: fail('IDEMPOTENCY_KEY_REUSE', 'This idempotency key was already used for a different request.') };
  }
  const order = existing.orderId ? state.orders.find((item) => item.orderId === existing.orderId) ?? null : null;
  return {
    replay: {
      ...existing.result,
      state,
      order,
      replayed: true,
      paperOnly: true,
    },
  };
}

function finishCommand(state, command, result) {
  const record = {
    idempotencyKey: command.idempotencyKey,
    operation: command.operation,
    fingerprint: command.fingerprint,
    orderId: result.order?.orderId ?? null,
    result: {
      ok: result.ok,
      code: result.code,
      message: result.message,
      eventId: result.event?.eventId ?? null,
    },
    recordedAt: result.event?.occurredAt ?? new Date().toISOString(),
  };
  const nextState = { ...state, idempotency: [...state.idempotency, record] };
  return { ...result, state: nextState, replayed: false, paperOnly: true };
}

function postJournal(state, { journalId, idempotencyKey, referenceType, referenceId, currency, lines, now }) {
  if (!validId(journalId) || state.journals.some((journal) => journal.journalId === journalId)) {
    return fail('JOURNAL_ID_INVALID_OR_DUPLICATE', 'A unique paper journal ID is required.');
  }
  if (!Array.isArray(lines) || lines.length < 2) {
    return fail('JOURNAL_LINES_INVALID', 'A balanced journal requires at least two ledger lines.');
  }
  let debits = 0;
  let credits = 0;
  for (const line of lines) {
    if (!line || typeof line.accountCode !== 'string' || !line.accountCode.trim() ||
        !Number.isFinite(line.debit) || !Number.isFinite(line.credit) ||
        line.debit < 0 || line.credit < 0 ||
        (line.debit > 0 && line.credit > 0) ||
        (line.debit === 0 && line.credit === 0)) {
      return fail('JOURNAL_LINE_INVALID', 'Each journal line must have one positive debit or credit and a ledger account code.');
    }
    debits += line.debit;
    credits += line.credit;
  }
  if (!nearlyEqual(debits, credits)) {
    return fail('JOURNAL_NOT_BALANCED', 'Total debits must equal total credits before a journal can be posted.');
  }
  const postedAt = new Date(now).toISOString();
  const journal = {
    journalId, idempotencyKey, referenceType, referenceId, currency,
    debitTotal: round8(debits), creditTotal: round8(credits),
    status: 'posted', postedAt,
  };
  const entries = lines.map((line, index) => ({
    journalId,
    lineNumber: index + 1,
    accountCode: line.accountCode,
    debit: round8(line.debit),
    credit: round8(line.credit),
    currency,
    postedAt,
  }));
  return { ok: true, journal, entries };
}

/**
 * Creates a simulation-only account and posts its opening balance using
 * balanced paper-cash and paper-equity entries. No payment rail is involved.
 */
export function createPaperCfdAccountState({ account, openingBalance, openingJournalId, now = Date.now() }) {
  if (!account || !validId(account.accountId)) return fail('ACCOUNT_ID_INVALID', 'A valid paper account ID is required.');
  if (account.mode !== 'paper') return fail('LIVE_ACCOUNT_NOT_SUPPORTED', 'This engine only creates paper CFD accounts.');
  if (!['active', 'suspended', 'closed'].includes(account.status ?? 'active')) {
    return fail('ACCOUNT_STATUS_INVALID', 'Account status must be active, suspended or closed.');
  }
  if (typeof account.currency !== 'string' || !/^[A-Z]{3}$/.test(account.currency)) {
    return fail('ACCOUNT_CURRENCY_INVALID', 'Account currency must be a three-letter uppercase ISO currency code.');
  }
  if (!Number.isFinite(account.closeoutLevelPct) || account.closeoutLevelPct < 0) {
    return fail('CLOSEOUT_POLICY_MISSING', 'An approved non-negative paper margin close-out threshold is required.');
  }
  if (!Number.isFinite(openingBalance) || openingBalance < 0) {
    return fail('OPENING_BALANCE_INVALID', 'Paper opening balance must be finite and non-negative.');
  }

  const state = {
    account: {
      accountId: account.accountId,
      mode: 'paper',
      status: account.status ?? 'active',
      currency: account.currency,
      closeoutLevelPct: account.closeoutLevelPct,
      createdAt: new Date(now).toISOString(),
    },
    orders: [],
    positions: [],
    reservations: [],
    journals: [],
    ledgerEntries: [],
    events: [],
    idempotency: [],
  };

  if (openingBalance > 0) {
    const journal = postJournal(state, {
      journalId: openingJournalId,
      idempotencyKey: 'PAPER_ACCOUNT_OPENING:' + account.accountId,
      referenceType: 'paper_account_opening',
      referenceId: account.accountId,
      currency: account.currency,
      lines: [
        { accountCode: 'paper_cash', debit: round8(openingBalance), credit: 0 },
        { accountCode: 'paper_equity', debit: 0, credit: round8(openingBalance) },
      ],
      now,
    });
    if (!journal.ok) return journal;
    state.journals.push(journal.journal);
    state.ledgerEntries.push(...journal.entries);
  }

  return { ok: true, state, snapshot: accountSnapshot(state), paperOnly: true };
}

export function getPaperCfdAccountSnapshot(state) {
  if (!state || state.account?.mode !== 'paper') return fail('PAPER_ACCOUNT_REQUIRED', 'A paper CFD account state is required.');
  return { ...accountSnapshot(state), cashBalance: cashBalance(state), pendingOrderMargin: activeReservedMargin(state) };
}

function rejectNewOrder(state, command, request, eventId, code, message, now, risk = null) {
  const order = {
    orderId: request.orderId,
    accountId: state.account.accountId,
    instrumentCode: request.contractCode,
    side: request.side,
    orderType: request.orderType,
    lots: Number.isFinite(request.lots) && request.lots > 0 ? round8(request.lots) : 0,
    filledLots: 0,
    remainingLots: Number.isFinite(request.lots) && request.lots > 0 ? round8(request.lots) : 0,
    status: 'rejected',
    reservedAmountRemaining: 0,
    rejectionCode: code,
    rejectionMessage: message,
    createdAt: new Date(now).toISOString(),
    updatedAt: new Date(now).toISOString(),
    risk,
    paperOnly: true,
  };
  const eventResult = buildEvent(state, {
    eventId, eventType: 'ORDER_REJECTED', orderId: order.orderId,
    payload: { code, message, request, risk },
    now,
  });
  if (!eventResult.ok) return eventResult;
  let next = {
    ...state,
    orders: [...state.orders, order],
    reservations: [...state.reservations, {
      reservationId: 'RES:' + order.orderId,
      accountId: state.account.accountId,
      orderId: order.orderId,
      currency: state.account.currency,
      initialAmount: 0,
      remainingAmount: 0,
      status: 'released',
      createdAt: new Date(now).toISOString(),
      updatedAt: new Date(now).toISOString(),
    }],
  };
  next = addEvent(next, eventResult.event);
  return finishCommand(next, command, { ok: false, code, message, order, event: eventResult.event });
}

/** Accepts and reserves a paper order. It never sends an order to a venue. */
export function submitPaperCfdOrder({ state, request, contract, quote, policy, now = Date.now() }) {
  if (!state || state.account?.mode !== 'paper') return fail('PAPER_ACCOUNT_REQUIRED', 'A paper CFD account state is required.');
  if (!request || !validId(request.orderId) || !validId(request.eventId)) {
    return fail('ORDER_IDENTIFIERS_REQUIRED', 'A unique order ID and event ID are required.');
  }
  const fingerprint = digest({ request, contract, quote, policy });
  const command = startCommand(state, {
    idempotencyKey: request.idempotencyKey, operation: 'submit_order', fingerprint,
  });
  if (command.error) return command.error;
  if (command.replay) return command.replay;
  if (state.orders.some((order) => order.orderId === request.orderId)) {
    return fail('ORDER_ID_DUPLICATE', 'Order ID already exists in this paper account.');
  }
  if (state.account.status !== 'active') {
    return fail('ACCOUNT_NOT_ACTIVE', 'Suspended or closed paper accounts cannot accept new orders.');
  }
  if (!['buy', 'sell'].includes(request.side) || !['market', 'limit'].includes(request.orderType)) {
    return fail('ORDER_INSTRUCTIONS_INVALID', 'Order side and type must be explicitly supported.');
  }
  if (request.orderType === 'limit' && !POSITIVE(request.limitPrice)) {
    return fail('LIMIT_PRICE_REQUIRED', 'A positive limit price is required for limit orders.');
  }
  if (!POSITIVE(contract?.tickSize) || !onIncrement(quote?.bid, contract.tickSize) ||
      !onIncrement(quote?.ask, contract.tickSize)) {
    return rejectNewOrder(state, command, request, request.eventId,
      'QUOTE_TICK_SIZE_INVALID', 'The provider quote must conform to the enabled contract tick size.', now);
  }
  if (request.orderType === 'limit' && !onIncrement(request.limitPrice, contract.tickSize)) {
    return rejectNewOrder(state, command, request, request.eventId,
      'LIMIT_PRICE_TICK_INVALID', 'The limit price must conform to the enabled contract tick size.', now);
  }
  if (request.orderType === 'market' && request.limitPrice !== undefined) {
    return fail('MARKET_LIMIT_CONFLICT', 'A market order cannot include a limit price.');
  }
  if (!Number.isFinite(request.estimatedFeeAmount ?? 0) || (request.estimatedFeeAmount ?? 0) < 0) {
    return fail('ESTIMATED_FEE_INVALID', 'Estimated fees must be finite and non-negative.');
  }
  if (!POSITIVE(policy?.maxExecutionDeviationBps) ||
      !POSITIVE(policy?.maxQuoteAgeMs)) {
    return rejectNewOrder(state, command, request, request.eventId,
      'EXECUTION_GUARD_MISSING', 'The approved paper policy must set a positive maximum execution-deviation and quote-age limit.', now);
  }
  if (request.expiresAt !== undefined && !Number.isFinite(Date.parse(request.expiresAt))) {
    return fail('ORDER_EXPIRY_INVALID', 'Order expiry must be a valid timestamp.');
  }
  if (request.expiresAt && Date.parse(request.expiresAt) <= now) {
    return rejectNewOrder(state, command, request, request.eventId,
      'ORDER_ALREADY_EXPIRED', 'Order expiry must be later than its acceptance time.', now);
  }

  const snapshot = accountSnapshot(state);
  if (!snapshot.ok) return snapshot;
  if (snapshot.freeMargin < 0) {
    return rejectNewOrder(state, command, request, request.eventId,
      'ACCOUNT_MARGIN_BREACH', 'The paper account has negative free margin and cannot accept new orders.', now, snapshot);
  }
  const risk = calculateCfdOrderRisk({
    contract, quote, side: request.side, lots: request.lots,
    requestedLeverage: request.requestedLeverage, policy,
    freeMargin: snapshot.freeMargin,
    accountCurrencyRate: request.accountCurrencyRate ?? 1,
    now, maxQuoteAgeMs: policy.maxQuoteAgeMs,
  });
  if (!risk.ok) {
    return rejectNewOrder(state, command, request, request.eventId, risk.code, risk.message, now, risk);
  }

  const estimatedFeeAmount = round8(request.estimatedFeeAmount ?? 0);
  const totalReservation = round8(risk.requiredMargin + estimatedFeeAmount);
  if (totalReservation > snapshot.freeMargin + EPSILON) {
    return rejectNewOrder(state, command, request, request.eventId,
      'INSUFFICIENT_MARGIN_FOR_FEES', 'Required margin plus estimated fees exceeds available free margin.', now, risk);
  }

  const order = {
    orderId: request.orderId,
    clientOrderId: request.clientOrderId ?? null,
    accountId: state.account.accountId,
    contractCode: contract.contractCode,
    contractSize: contract.contractSize,
    side: request.side,
    orderType: request.orderType,
    limitPrice: request.orderType === 'limit' ? request.limitPrice : null,
    lots: round8(request.lots),
    filledLots: 0,
    remainingLots: round8(request.lots),
    requestedLeverage: request.requestedLeverage,
    lotStep: contract.lotStep,
    tickSize: contract.tickSize,
    referencePrice: risk.executionPrice,
    accountCurrencyRate: request.accountCurrencyRate ?? 1,
    referencePriceSide: risk.priceSide,
    marginRequired: risk.requiredMargin,
    marginRemaining: risk.requiredMargin,
    estimatedFeeRemaining: estimatedFeeAmount,
    reservedAmountRemaining: totalReservation,
    maxExecutionDeviationBps: policy.maxExecutionDeviationBps,
    maxQuoteAgeMs: policy.maxQuoteAgeMs,
    quoteSource: quote.source,
    quoteObservedAt: quote.observedAt,
    policyId: policy.policyId ?? null,
    policyVersion: policy.policyVersion ?? null,
    status: 'accepted',
    expiresAt: request.expiresAt ?? null,
    createdAt: new Date(now).toISOString(),
    updatedAt: new Date(now).toISOString(),
    averageFillPrice: null,
    paperOnly: true,
  };
  const eventResult = buildEvent(state, {
    eventId: request.eventId, eventType: 'ORDER_ACCEPTED', orderId: order.orderId,
    payload: {
      orderId: order.orderId, contractCode: order.contractCode, side: order.side,
      orderType: order.orderType, lots: order.lots, limitPrice: order.limitPrice,
      referencePrice: order.referencePrice, quoteSource: order.quoteSource,
      quoteObservedAt: order.quoteObservedAt, marginRequired: order.marginRequired,
      estimatedFeeAmount, totalReservation, policyId: order.policyId, policyVersion: order.policyVersion,
    },
    now,
  });
  if (!eventResult.ok) return eventResult;

  let next = {
    ...state,
    orders: [...state.orders, order],
    reservations: [...state.reservations, {
      reservationId: 'RES:' + order.orderId,
      accountId: order.accountId,
      orderId: order.orderId,
      currency: state.account.currency,
      initialAmount: totalReservation,
      remainingAmount: totalReservation,
      status: 'active',
      createdAt: new Date(now).toISOString(),
      updatedAt: new Date(now).toISOString(),
    }],
  };
  next = addEvent(next, eventResult.event);
  return finishCommand(next, command, { ok: true, order, event: eventResult.event });
}

function validateExecution({ order, execution, now }) {
  if (!execution || !POSITIVE(execution.price) || typeof execution.source !== 'string' ||
      !execution.source.trim() || !execution.quote) {
    return fail('EXECUTION_DETAILS_INVALID', 'A positive fill price, named source and contemporaneous quote are required.');
  }
  const quote = validateCfdQuote(execution.quote, { now, maxAgeMs: order.maxQuoteAgeMs });
  if (!quote.ok) return quote;
  if (!onIncrement(execution.price, order.tickSize) ||
      !onIncrement(execution.quote.bid, order.tickSize) ||
      !onIncrement(execution.quote.ask, order.tickSize)) {
    return fail('EXECUTION_TICK_SIZE_INVALID', 'Execution price and fill quote must conform to the enabled contract tick size.');
  }
  const observedAt = Date.parse(execution.observedAt);
  if (!Number.isFinite(observedAt) || observedAt > now + 30000 || now - observedAt > order.maxQuoteAgeMs) {
    return fail('EXECUTION_TIMESTAMP_INVALID', 'Execution timestamp is invalid, future-dated or stale.');
  }
  const adverseBps = order.side === 'buy'
    ? ((execution.price - order.referencePrice) / order.referencePrice) * 10000
    : ((order.referencePrice - execution.price) / order.referencePrice) * 10000;
  if (adverseBps > order.maxExecutionDeviationBps + EPSILON) {
    return fail('EXECUTION_PRICE_DEVIATION', 'Paper fill exceeds the approved maximum adverse execution deviation.', {
      adverseBps: round8(adverseBps),
      maxExecutionDeviationBps: order.maxExecutionDeviationBps,
    });
  }
  if (order.orderType === 'limit') {
    const limitSatisfied = order.side === 'buy'
      ? execution.price <= order.limitPrice + EPSILON
      : execution.price >= order.limitPrice - EPSILON;
    if (!limitSatisfied) return fail('LIMIT_PRICE_NOT_MET', 'The execution price does not satisfy the client limit price.');
  }
  return { ok: true, adverseBps: round8(adverseBps), quoteObservedAt: quote.observedAt };
}

/** Applies one provider-shaped simulated execution to an accepted paper order. */
export function fillPaperCfdOrder({ state, orderId, fillId, eventId, idempotencyKey, lots, execution, positionId, feeJournalId, now = Date.now() }) {
  if (!state || state.account?.mode !== 'paper') return fail('PAPER_ACCOUNT_REQUIRED', 'A paper CFD account state is required.');
  if (!validId(orderId) || !validId(fillId) || !validId(eventId)) {
    return fail('FILL_IDENTIFIERS_REQUIRED', 'Order, fill and event IDs are required.');
  }
  const fingerprint = digest({ orderId, fillId, eventId, lots, execution, positionId, feeJournalId });
  const command = startCommand(state, { idempotencyKey, operation: 'fill_order', fingerprint });
  if (command.error) return command.error;
  if (command.replay) return command.replay;

  const orderIndex = state.orders.findIndex((item) => item.orderId === orderId);
  if (orderIndex < 0) return fail('ORDER_NOT_FOUND', 'Paper order does not exist.');
  const order = state.orders[orderIndex];
  if (!['accepted', 'partially_filled'].includes(order.status)) {
    return fail('ORDER_NOT_FILLABLE', 'Only accepted or partially filled orders can receive additional fills.');
  }
  if (state.positions.some((position) => position.fillId === fillId)) {
    return fail('FILL_ID_DUPLICATE', 'Fill ID already exists in this paper account.');
  }
  if (!POSITIVE(lots) || lots > order.remainingLots + EPSILON ||
      !onIncrement(lots, order.lotStep)) {
    return fail('FILL_QUANTITY_INVALID', 'Fill quantity must be positive, respect the instrument lot step and not exceed the unfilled order quantity.');
  }
  if (!validId(positionId)) return fail('POSITION_ID_REQUIRED', 'A unique position ID is required for each paper fill.');

  const executionCheck = validateExecution({ order, execution, now });
  if (!executionCheck.ok) {
    const eventResult = buildEvent(state, {
      eventId, eventType: 'FILL_REJECTED', orderId,
      payload: { fillId, lots, code: executionCheck.code, message: executionCheck.message },
      now,
    });
    if (!eventResult.ok) return eventResult;
    const next = addEvent(state, eventResult.event);
    return finishCommand(next, command, {
      ok: false, code: executionCheck.code, message: executionCheck.message,
      order, event: eventResult.event,
    });
  }

  if (!Number.isFinite(execution.feeAmount ?? 0) || (execution.feeAmount ?? 0) < 0) {
    return fail('FILL_FEE_INVALID', 'Actual fill fee must be finite and non-negative.');
  }
  const fillRatio = Math.min(1, lots / order.remainingLots);
  const marginAllocated = round8(Math.min(order.marginRemaining, order.marginRemaining * fillRatio));
  const feeAllowance = round8(Math.min(order.estimatedFeeRemaining, order.estimatedFeeRemaining * fillRatio));
  const actualFee = round8(execution.feeAmount ?? 0);
  if (actualFee > feeAllowance + EPSILON) {
    return fail('FEE_EXCEEDS_RESERVATION', 'Actual fee exceeds the fee allowance reserved for this fill.');
  }
  if (actualFee > 0 && !validId(feeJournalId)) {
    return fail('FEE_JOURNAL_ID_REQUIRED', 'A unique balanced-ledger journal ID is required when a fill charges a fee.');
  }

  const fillLots = round8(lots);
  const remainingLots = round8(Math.max(0, order.remainingLots - fillLots));
  const finalFill = remainingLots <= EPSILON;
  const marginRemaining = finalFill ? 0 : round8(Math.max(0, order.marginRemaining - marginAllocated));
  const estimatedFeeRemaining = finalFill ? 0 : round8(Math.max(0, order.estimatedFeeRemaining - feeAllowance));
  const reservationRemaining = round8(marginRemaining + estimatedFeeRemaining);
  const filledLots = round8(order.filledLots + fillLots);
  const averageFillPrice = round8(((order.averageFillPrice ?? 0) * order.filledLots + execution.price * fillLots) / filledLots);
  const updatedOrder = {
    ...order,
    filledLots,
    remainingLots,
    marginRemaining,
    estimatedFeeRemaining,
    reservedAmountRemaining: reservationRemaining,
    averageFillPrice,
    status: finalFill ? 'filled' : 'partially_filled',
    updatedAt: new Date(now).toISOString(),
  };
  const position = {
    positionId, accountId: state.account.accountId, orderId, fillId,
    contractCode: order.contractCode,
    contractSize: order.contractSize,
    side: order.side === 'buy' ? 'long' : 'short',
    lots: fillLots,
    entryPrice: execution.price,
    marginRequired: marginAllocated,
    unrealizedPnl: 0,
    status: 'open',
    openedAt: new Date(now).toISOString(),
    paperOnly: true,
  };

  let next = { ...state, positions: [...state.positions, position] };
  const nextOrders = [...next.orders];
  nextOrders[orderIndex] = updatedOrder;
  next = { ...next, orders: nextOrders };
  const reservationIndex = next.reservations.findIndex((item) => item.orderId === orderId);
  if (reservationIndex < 0) return fail('MARGIN_RESERVATION_MISSING', 'Accepted paper order has no margin reservation.');
  const reservations = [...next.reservations];
  reservations[reservationIndex] = {
    ...reservations[reservationIndex],
    remainingAmount: reservationRemaining,
    status: reservationRemaining <= EPSILON ? 'consumed' : 'active',
    updatedAt: new Date(now).toISOString(),
  };
  next = { ...next, reservations };

  if (actualFee > 0) {
    const journal = postJournal(next, {
      journalId: feeJournalId,
      idempotencyKey: 'PAPER_FILL_FEE:' + fillId,
      referenceType: 'paper_fill_fee',
      referenceId: fillId,
      currency: state.account.currency,
      lines: [
        { accountCode: 'paper_trading_fees', debit: actualFee, credit: 0 },
        { accountCode: 'paper_cash', debit: 0, credit: actualFee },
      ],
      now,
    });
    if (!journal.ok) return journal;
    next = {
      ...next,
      journals: [...next.journals, journal.journal],
      ledgerEntries: [...next.ledgerEntries, ...journal.entries],
    };
  }

  const eventResult = buildEvent(next, {
    eventId, eventType: 'FILL_APPLIED', orderId,
    payload: {
      fillId, positionId, lots: fillLots, price: execution.price,
      source: execution.source, observedAt: execution.observedAt,
      feeAmount: actualFee, marginAllocated, reservationRemaining,
      adverseBps: executionCheck.adverseBps, externalExecutionId: execution.externalExecutionId ?? null,
      venueId: execution.venueId ?? null,
    },
    now,
  });
  if (!eventResult.ok) return eventResult;
  next = addEvent(next, eventResult.event);
  return finishCommand(next, command, {
    ok: true, order: updatedOrder, position, event: eventResult.event,
    marginAllocated, feeAmount: actualFee,
  });
}

function closeRemainder({ state, orderId, eventId, idempotencyKey, operation, terminalStatus, reason, now = Date.now() }) {
  if (!state || state.account?.mode !== 'paper') return fail('PAPER_ACCOUNT_REQUIRED', 'A paper CFD account state is required.');
  if (!validId(orderId) || !validId(eventId)) return fail('ORDER_EVENT_IDENTIFIERS_REQUIRED', 'Order ID and event ID are required.');
  const fingerprint = digest({ orderId, eventId, terminalStatus, reason: reason ?? null });
  const command = startCommand(state, { idempotencyKey, operation, fingerprint });
  if (command.error) return command.error;
  if (command.replay) return command.replay;
  const orderIndex = state.orders.findIndex((item) => item.orderId === orderId);
  if (orderIndex < 0) return fail('ORDER_NOT_FOUND', 'Paper order does not exist.');
  const order = state.orders[orderIndex];
  if (!['accepted', 'partially_filled'].includes(order.status)) {
    return fail('ORDER_NOT_CANCELLABLE', 'Only accepted or partially filled orders can be cancelled, expired or rejected.');
  }
  const reservationIndex = state.reservations.findIndex((item) => item.orderId === orderId);
  if (reservationIndex < 0) return fail('MARGIN_RESERVATION_MISSING', 'Open paper order has no margin reservation.');
  const releasedAmount = state.reservations[reservationIndex].remainingAmount;
  const updatedOrder = {
    ...order,
    status: terminalStatus,
    marginRemaining: 0,
    estimatedFeeRemaining: 0,
    reservedAmountRemaining: 0,
    terminalReason: reason ?? null,
    updatedAt: new Date(now).toISOString(),
  };
  const orders = [...state.orders];
  orders[orderIndex] = updatedOrder;
  const reservations = [...state.reservations];
  reservations[reservationIndex] = {
    ...reservations[reservationIndex],
    remainingAmount: 0,
    status: 'released',
    updatedAt: new Date(now).toISOString(),
  };
  let next = { ...state, orders, reservations };
  const eventType = terminalStatus === 'cancelled' ? 'ORDER_CANCELLED'
    : terminalStatus === 'expired' ? 'ORDER_EXPIRED' : 'ORDER_REJECTED_BY_PROVIDER';
  const eventResult = buildEvent(next, {
    eventId, eventType, orderId,
    payload: { releasedAmount, remainingLots: order.remainingLots, reason: reason ?? null },
    now,
  });
  if (!eventResult.ok) return eventResult;
  next = addEvent(next, eventResult.event);
  return finishCommand(next, command, {
    ok: true, order: updatedOrder, event: eventResult.event, releasedAmount,
  });
}

export function cancelPaperCfdOrder(input) {
  return closeRemainder({ ...input, operation: 'cancel_order', terminalStatus: 'cancelled' });
}

export function expirePaperCfdOrder(input) {
  const state = input?.state;
  const now = Number.isFinite(input?.now) ? input.now : Date.now();
  const order = state?.orders?.find((item) => item.orderId === input.orderId);
  if (!order) return fail('ORDER_NOT_FOUND', 'Paper order does not exist.');
  if (!order.expiresAt) return fail('ORDER_EXPIRY_NOT_SET', 'This order has no configured expiry timestamp.');
  if (now < Date.parse(order.expiresAt)) return fail('ORDER_NOT_EXPIRED', 'Order cannot expire before its configured expiry time.');
  return closeRemainder({ ...input, now, operation: 'expire_order', terminalStatus: 'expired' });
}

export function rejectPaperCfdOrder(input) {
  if (typeof input?.reason !== 'string' || !input.reason.trim()) {
    return fail('REJECTION_REASON_REQUIRED', 'A provider rejection reason is required.');
  }
  return closeRemainder({ ...input, operation: 'reject_order', terminalStatus: 'rejected' });
}

export function verifyPaperCfdEventChain(events = []) {
  let previousHash = ZERO_HASH;
  for (let index = 0; index < events.length; index += 1) {
    const event = events[index];
    const { eventHash, ...unsigned } = event;
    if (event.sequence !== index + 1 || event.previousHash !== previousHash || digest(unsigned) !== eventHash) {
      return fail('EVENT_CHAIN_INVALID', 'Paper account event history has a missing, reordered or modified event.', { invalidSequence: index + 1 });
    }
    previousHash = eventHash;
  }
  return { ok: true, eventCount: events.length, latestEventHash: previousHash };
}

export function verifyPaperCfdJournals(state) {
  if (!state || !Array.isArray(state.journals) || !Array.isArray(state.ledgerEntries)) {
    return fail('LEDGER_STATE_INVALID', 'Paper journal and ledger-entry arrays are required.');
  }
  for (const journal of state.journals) {
    const entries = state.ledgerEntries.filter((entry) => entry.journalId === journal.journalId);
    const debits = round8(entries.reduce((sum, entry) => sum + entry.debit, 0));
    const credits = round8(entries.reduce((sum, entry) => sum + entry.credit, 0));
    if (journal.status !== 'posted' || entries.length < 2 ||
        !nearlyEqual(debits, credits) ||
        !nearlyEqual(debits, journal.debitTotal) ||
        !nearlyEqual(credits, journal.creditTotal) ||
        entries.some((entry) => entry.currency !== journal.currency ||
          !Number.isFinite(entry.debit) || !Number.isFinite(entry.credit) ||
          entry.debit < 0 || entry.credit < 0 ||
          (entry.debit > 0 && entry.credit > 0) ||
          (entry.debit === 0 && entry.credit === 0))) {
      return fail('JOURNAL_RECONCILIATION_FAILED', 'A posted paper journal is not balanced or has invalid ledger lines.', { journalId: journal.journalId });
    }
  }
  if (state.ledgerEntries.some((entry) => !state.journals.some((journal) => journal.journalId === entry.journalId))) {
    return fail('ORPHAN_LEDGER_ENTRY', 'Ledger contains an entry without a journal header.');
  }
  return { ok: true, journalCount: state.journals.length, ledgerEntryCount: state.ledgerEntries.length };
}

/** Reconciles event hash chain, double-entry journals, fills and open reservations. */
export function reconcilePaperCfdState(state) {
  if (!state || state.account?.mode !== 'paper') return fail('PAPER_ACCOUNT_REQUIRED', 'A paper CFD account state is required.');
  const eventCheck = verifyPaperCfdEventChain(state.events);
  if (!eventCheck.ok) return eventCheck;
  const journalCheck = verifyPaperCfdJournals(state);
  if (!journalCheck.ok) return journalCheck;

  for (const order of state.orders) {
    if (!nearlyEqual(order.filledLots + order.remainingLots, order.lots)) {
      return fail('ORDER_QUANTITY_RECONCILIATION_FAILED', 'Filled and remaining lots do not equal the original order quantity.', { orderId: order.orderId });
    }
    const reservation = state.reservations.find((item) => item.orderId === order.orderId);
    if (!reservation) return fail('ORDER_RESERVATION_MISSING', 'Order does not have a reservation record.', { orderId: order.orderId });
    if (!nearlyEqual(order.reservedAmountRemaining, reservation.remainingAmount)) {
      return fail('ORDER_RESERVATION_MISMATCH', 'Order and reservation remaining amounts do not match.', { orderId: order.orderId });
    }
    if (TERMINAL.has(order.status) && reservation.remainingAmount > EPSILON) {
      return fail('TERMINAL_ORDER_HAS_RESERVATION', 'A terminal order still has reserved margin or fees.', { orderId: order.orderId });
    }
    if (['accepted', 'partially_filled'].includes(order.status) && reservation.status !== 'active') {
      return fail('OPEN_ORDER_RESERVATION_INACTIVE', 'An open order must retain an active margin reservation.', { orderId: order.orderId });
    }
    const filledByPositions = round8(state.positions
      .filter((position) => position.orderId === order.orderId)
      .reduce((sum, position) => sum + position.lots, 0));
    if (!nearlyEqual(filledByPositions, order.filledLots)) {
      return fail('ORDER_POSITION_RECONCILIATION_FAILED', 'Position fills do not equal the order cumulative filled quantity.', { orderId: order.orderId });
    }
  }

  const snapshot = accountSnapshot(state);
  if (!snapshot.ok) return snapshot;
  return {
    ok: true,
    paperOnly: true,
    eventCount: eventCheck.eventCount,
    latestEventHash: eventCheck.latestEventHash,
    journalCount: journalCheck.journalCount,
    ledgerEntryCount: journalCheck.ledgerEntryCount,
    orderCount: state.orders.length,
    openOrderCount: state.orders.filter((order) => ['accepted', 'partially_filled'].includes(order.status)).length,
    positionCount: state.positions.filter((position) => position.status === 'open').length,
    cashBalance: cashBalance(state),
    usedMargin: snapshot.usedMargin,
    pendingOrderMargin: snapshot.pendingOrderMargin,
    freeMargin: snapshot.freeMargin,
    marginBreach: snapshot.freeMargin < 0,
  };
}
