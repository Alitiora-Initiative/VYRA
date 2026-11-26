import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateCfdQuote } from '../src/lib/cfd/market.mjs';

const NOW = Date.parse('2026-11-26T10:00:00.000Z');

test('accepts a valid fresh bid/ask quote and calculates spread in basis points', () => {
  const result = evaluateCfdQuote({
    bid: 1.0800,
    ask: 1.0802,
    observedAt: new Date(NOW - 1000).toISOString(),
  }, { now: NOW });

  assert.equal(result.available, true);
  if (result.available) {
    assert.equal(result.ageMs, 1000);
    assert.equal(result.spreadBps, 1.8519);
  }
});

test('rejects a missing quote', () => {
  assert.deepEqual(evaluateCfdQuote(null, { now: NOW }), {
    available: false,
    reason: 'A valid positive bid and ask are required.',
  });
});

test('rejects zero, negative and non-numeric prices', () => {
  for (const quote of [
    { bid: 0, ask: 1, observedAt: new Date(NOW).toISOString() },
    { bid: 1, ask: -1, observedAt: new Date(NOW).toISOString() },
    { bid: 'bad', ask: 2, observedAt: new Date(NOW).toISOString() },
  ]) {
    assert.equal(evaluateCfdQuote(quote, { now: NOW }).available, false);
  }
});

test('rejects an inverted market', () => {
  const result = evaluateCfdQuote({
    bid: 1.2, ask: 1.1, observedAt: new Date(NOW).toISOString(),
  }, { now: NOW });
  assert.equal(result.available, false);
  assert.match(result.reason, /ask price is below/);
});

test('rejects a stale quote', () => {
  const result = evaluateCfdQuote({
    bid: 1.08, ask: 1.0802, observedAt: new Date(NOW - 30001).toISOString(),
  }, { now: NOW, maxAgeMs: 30000 });
  assert.equal(result.available, false);
  assert.equal(result.reason, 'The quote is stale.');
});

test('rejects a quote too far in the future', () => {
  const result = evaluateCfdQuote({
    bid: 1.08, ask: 1.0802, observedAt: new Date(NOW + 30001).toISOString(),
  }, { now: NOW, maxFutureSkewMs: 30000 });
  assert.equal(result.available, false);
  assert.match(result.reason, /ahead/);
});

test('rejects an invalid timestamp', () => {
  const result = evaluateCfdQuote({ bid: 1.08, ask: 1.0802, observedAt: 'not-a-date' }, { now: NOW });
  assert.equal(result.available, false);
  assert.equal(result.reason, 'The quote timestamp is invalid.');
});
