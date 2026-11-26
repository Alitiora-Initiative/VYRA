import 'dotenv/config';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { createInterface } from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { createReviewSession } from './mozaik-team.mjs';
import { recordHumanAcknowledgement } from './decision-engine.mjs';
import { createOfflineInferenceRunnerConfig } from './demo-runner.mjs';

async function loadJson(path) {
  return JSON.parse(await readFile(new URL(path, import.meta.url), 'utf8'));
}

function hasProviderKey() {
  return Boolean(
    process.env.OPENAI_API_KEY ||
    process.env.ANTHROPIC_API_KEY ||
    process.env.GEMINI_API_KEY
  );
}

async function main() {
  const liveMode = process.argv.includes('--live');
  const offlineMode = process.argv.includes('--offline') || !liveMode;

  if (liveMode && !hasProviderKey()) {
    throw new Error('Live mode requires OPENAI_API_KEY, ANTHROPIC_API_KEY or GEMINI_API_KEY in .env.');
  }

  if (!liveMode && !offlineMode) {
    throw new Error('Select --offline or --live.');
  }

  const route = await loadJson('../data/synthetic-route.json');
  const evidenceRegister = await loadJson('../data/kenya-evidence.json');
  const offline = offlineMode ? createOfflineInferenceRunnerConfig() : null;
  const model = process.env.MOZAIK_MODEL || 'gpt-5.5';
  const session = createReviewSession({
    route,
    sources: evidenceRegister.sources,
    model,
    timeoutMs: Number(process.env.REVIEW_TIMEOUT_MS || 180000),
    inferenceRunnerConfig: offline?.inferenceRunnerConfig ?? null,
  });

  console.log('\nVYRA SENTINEL — CONCURRENT FINANCE ROUTE REVIEW');
  console.log('Case:', route.caseId, '(synthetic public-source case only)');
  console.log('Mode:', offlineMode ? 'OFFLINE SCRIPTED DEMO — no model provider calls' : 'LIVE MODEL — provider API usage may incur cost');
  console.log('Starting Evidence Scout and Route Analyst concurrently...');
  session.submit();

  const outcome = await session.completion;
  console.log('\nIndependent Auditor completed.');
  console.log('\nDETERMINISTIC OUTCOME');
  console.log(JSON.stringify(outcome, null, 2));

  const terminal = createInterface({ input, output });
  const acknowledgement = (await terminal.question(
    '\nRecord a human acknowledgement of this report? (acknowledge / reject / defer): '
  )).trim().toLowerCase();
  const note = await terminal.question('Short note (optional): ');
  terminal.close();

  const finalReport = recordHumanAcknowledgement(outcome, acknowledgement, note);
  finalReport.mode = offlineMode ? 'offline-scripted-demo' : 'live-model';
  finalReport.agentReports = session.state.reports;
  finalReport.auditTrail = session.state.auditTrail;
  finalReport.inferenceRunner = offline?.runner.snapshot() ?? {
    mode: 'live-model-provider',
    providerCalls: 'See provider usage dashboard',
  };

  const outputDir = new URL('../artifacts/', import.meta.url);
  await mkdir(outputDir, { recursive: true });
  const outputFile = new URL('../artifacts/' + route.caseId + '-review.json', import.meta.url);
  await writeFile(outputFile, JSON.stringify(finalReport, null, 2) + '\n', 'utf8');

  console.log('\nSaved review evidence to:', outputFile.pathname);
  console.log('No customer onboarding, referrals, orders, custody, payments, deposits or withdrawals were enabled.');
}

main().catch((error) => {
  console.error('\nVYRA Sentinel failed safely:', error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
