import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createReviewSession } from '../src/mozaik-team.mjs';
import { createOfflineInferenceRunnerConfig } from '../src/demo-runner.mjs';

async function loadJson(path) {
  return JSON.parse(await readFile(new URL(path, import.meta.url), 'utf8'));
}

test('full Mozaik review runs two analysts concurrently, then an auditor, and stays blocked', async () => {
  const route = await loadJson('../data/synthetic-route.json');
  const evidence = await loadJson('../data/kenya-evidence.json');
  const offline = createOfflineInferenceRunnerConfig({ delayMs: 35 });
  const session = createReviewSession({
    route,
    sources: evidence.sources,
    model: 'gpt-5.5',
    timeoutMs: 8000,
    inferenceRunnerConfig: offline.inferenceRunnerConfig,
  });

  session.submit();

  let timeoutHandle;
  const timeout = new Promise((_, reject) => {
    timeoutHandle = setTimeout(() => reject(new Error('Mozaik review timed out in integration test.')), 9000);
  });

  try {
    const outcome = await Promise.race([session.completion, timeout]);
    assert.equal(outcome.status, 'BLOCKED_PENDING_EVIDENCE');
    assert.deepEqual(Object.keys(session.state.reports).sort(), [
      'evidence-scout',
      'independent-auditor',
      'route-analyst',
    ]);
    assert.equal(outcome.missingReports.length, 0);
    assert.equal(outcome.actions.liveExecution, false);
    assert.equal(outcome.actions.customerMoney, false);

    const analystCompletions = session.state.auditTrail
      .filter((entry) => entry.type === 'agent.completed' && ['evidence-scout', 'route-analyst'].includes(entry.role));
    const auditorStart = session.state.auditTrail.find(
      (entry) => entry.type === 'agent.started' && entry.role === 'independent-auditor'
    );
    assert.equal(analystCompletions.length, 2);
    assert.ok(auditorStart);
    assert.ok(analystCompletions.every((entry) => entry.at <= auditorStart.at));

    const metrics = offline.runner.snapshot();
    assert.equal(metrics.completedCalls, 3);
    assert.ok(metrics.maxConcurrentCalls >= 2, 'two analyst inference calls should overlap');
    assert.equal(metrics.modelProviderCalls, 0);
  } finally {
    clearTimeout(timeoutHandle);
  }
});
