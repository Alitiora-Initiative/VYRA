import 'dotenv/config';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { createInterface } from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { createReviewSession } from './mozaik-team.mjs';
import { recordHumanAcknowledgement } from './decision-engine.mjs';

async function loadJson(path) {
  return JSON.parse(await readFile(new URL(path, import.meta.url), 'utf8'));
}

async function main() {
  const hasProviderKey = Boolean(
    process.env.OPENAI_API_KEY ||
    process.env.ANTHROPIC_API_KEY ||
    process.env.GEMINI_API_KEY
  );
  if (!hasProviderKey) {
    throw new Error('Set one model provider key in .env (see .env.example) before running the concurrent AI agents.');
  }

  const route = await loadJson('../data/synthetic-route.json');
  const evidenceRegister = await loadJson('../data/kenya-evidence.json');
  const session = createReviewSession({
    route,
    sources: evidenceRegister.sources,
    model: process.env.MOZAIK_MODEL || 'gpt-5.5',
    timeoutMs: Number(process.env.REVIEW_TIMEOUT_MS || 180000),
  });

  console.log('\\nVYRA SENTINEL — CONCURRENT FINANCE ROUTE REVIEW');
  console.log('Case:', route.caseId, '(synthetic data only)');
  console.log('Starting Evidence Scout and Route Analyst concurrently...');
  session.submit();

  const outcome = await session.completion;
  console.log('\\nIndependent Auditor completed.');
  console.log('\\nDETERMINISTIC OUTCOME');
  console.log(JSON.stringify(outcome, null, 2));

  const terminal = createInterface({ input, output });
  const acknowledgement = (await terminal.question(
    '\\nRecord a human acknowledgement of this report? (acknowledge / reject / defer): '
  )).trim().toLowerCase();
  const note = await terminal.question('Short note (optional): ');
  terminal.close();

  const finalReport = recordHumanAcknowledgement(outcome, acknowledgement, note);
  finalReport.agentReports = session.state.reports;
  finalReport.auditTrail = session.state.auditTrail;

  const outputDir = new URL('../artifacts/', import.meta.url);
  await mkdir(outputDir, { recursive: true });
  const outputFile = new URL('../artifacts/' + route.caseId + '-review.json', import.meta.url);
  await writeFile(outputFile, JSON.stringify(finalReport, null, 2) + '\\n', 'utf8');

  console.log('\\nSaved review evidence to:', outputFile.pathname);
  console.log('No customer onboarding, referrals, orders, custody, payments, deposits or withdrawals were enabled.');
}

main().catch((error) => {
  console.error('\\nVYRA Sentinel failed safely:', error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
