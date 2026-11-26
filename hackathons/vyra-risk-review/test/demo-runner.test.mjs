import test from 'node:test';
import assert from 'node:assert/strict';
import { VYRAOfflineInferenceRunner } from '../src/demo-runner.mjs';

test('assigns offline agent roles from message context rather than call order', async () => {
  const runner = new VYRAOfflineInferenceRunner({ delayMs: 0 });
  const analyst = await runner.run({
    model: 'test-model',
    context: { instructions: 'ROLE: route-analyst' },
  });
  const scout = await runner.run({
    model: 'test-model',
    context: { instructions: 'ROLE: evidence-scout' },
  });
  const auditor = await runner.run({
    model: 'test-model',
    context: { instructions: 'Audit the two concurrent analyst reports' },
  });

  assert.equal(analyst.rowResponse.role, 'route-analyst');
  assert.equal(scout.rowResponse.role, 'evidence-scout');
  assert.equal(auditor.rowResponse.role, 'independent-auditor');
});

test('uses the latest role marker in the full request when memory contains old roles', async () => {
  const runner = new VYRAOfflineInferenceRunner({ delayMs: 0 });
  const result = await runner.run({
    context: {
      earlierMessages: ['ROLE: evidence-scout', 'ROLE: route-analyst'],
      currentTask: 'ROLE: route-analyst',
    },
  });
  assert.equal(result.rowResponse.role, 'route-analyst');
});

test('records offline provider-call and concurrency metrics without duplicate fields', async () => {
  const runner = new VYRAOfflineInferenceRunner({ delayMs: 5 });
  await Promise.all([
    runner.run({ context: 'ROLE: evidence-scout' }),
    runner.run({ context: 'ROLE: route-analyst' }),
  ]);
  await runner.run({ context: 'Audit the two concurrent analyst reports' });

  const snapshot = runner.snapshot();
  assert.equal(snapshot.mode, 'offline-scripted-demo');
  assert.equal(snapshot.modelProviderCalls, 0);
  assert.equal(snapshot.completedCalls, 3);
  assert.equal(snapshot.maxConcurrentCalls, 2);
  assert.equal(snapshot.timeline.length, 6);
  const completedRoles = snapshot.timeline
    .filter((entry) => entry.event === 'completed')
    .map((entry) => entry.role);
  assert.deepEqual(completedRoles.slice(0, 2).sort(), ['evidence-scout', 'route-analyst']);
  assert.equal(completedRoles[2], 'independent-auditor');
});
