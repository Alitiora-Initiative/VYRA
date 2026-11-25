import test from 'node:test';
import assert from 'node:assert/strict';
import { applySlippage, validatePaperOrder } from '../src/lib/trading/paper-risk.mjs';

const limits = { maxOrderNotional: 10000 };

test('accepts a valid market buy below risk limit', () => {
  assert.equal(validatePaperOrder({ side: 'buy', type: 'market', quantity: 2, referencePrice: 100 }, limits).ok, true);
});

test('rejects zero quantity and an order above the notional cap', () => {
  assert.equal(validatePaperOrder({ side: 'buy', type: 'market', quantity: 0, referencePrice: 10 }, limits).ok, false);
  assert.equal(validatePaperOrder({ side: 'buy', type: 'market', quantity: 101, referencePrice: 100 }, limits).ok, false);
});

test('requires a positive limit price for a limit order', () => {
  assert.equal(validatePaperOrder({ side: 'sell', type: 'limit', quantity: 1 }, limits).ok, false);
});

test('applies adverse slippage in the correct direction', () => {
  assert.equal(applySlippage(100, 'buy', 10), 100.1);
  assert.equal(applySlippage(100, 'sell', 10), 99.9);
});
