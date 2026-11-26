import {
  defineRuntime,
  RuntimeState,
  createAgent,
  createHuman,
  SituationSpecification,
  SemanticEvent,
} from '@mozaik-ai/core';
import {
  extractText,
  parseAgentJson,
  evaluateFinalOutcome,
} from './decision-engine.mjs';

class ReviewState extends RuntimeState {
  constructor(route, sources) {
    super();
    this.route = route;
    this.sources = sources;
    this.reports = {};
    this.rawReports = {};
    this.startedAgents = [];
    this.auditStarted = false;
    this.finalOutcome = null;
    this.onComplete = null;
    this.auditTrail = [];
  }
}

class WhenOperatorSubmitsCase extends SituationSpecification {
  constructor(operatorId) {
    super();
    this.operatorId = operatorId;
  }
  isSatisfiedBy({ event }) {
    return event.type === 'message.sent' && event.producerId === this.operatorId;
  }
}

class WhenAgentAnswers extends SituationSpecification {
  isSatisfiedBy({ event, participant }) {
    return event.type === 'model.answer' && event.producerId === participant.getId();
  }
}

class WhenAnalysisReady extends SituationSpecification {
  isSatisfiedBy({ event }) {
    return event.type === 'analysis.ready';
  }
}

function makeAgentInstructions(role) {
  const shared = [
    'You are part of VYRA Sentinel, an evidence-first review team for a synthetic finance route.',
    'This is not legal advice and you must not grant regulatory authorisation.',
    'Use only the source register and route facts supplied in the current message.',
    'Never invent a law, provision, regulator statement, partner contract, licence, fee, transaction or customer fact.',
    'Distinguish a source-backed statement from an inference or unknown.',
    'Every factual claim must include one or more sourceIds exactly matching the supplied source register.',
    'If a source does not establish a claim, say that the claim is unverified.',
    'Do not recommend bypassing a licence, regulator, KYC, custody, payment, data or promotion requirement.',
    'Do not propose executing orders, moving money, approving customers or activating referrals.',
    'Return one JSON object only, without Markdown fences.',
  ].join('\n');

  const roles = {
    'evidence-scout': [
      'Your role is Evidence Scout.',
      'Map the route to the most relevant supplied sources and provisions.',
      'Separate what the supplied source summary says from what still requires the full law, counsel or regulator.',
      'Return JSON with: status, summary, claims [{claim, sourceIds}], relevantProvisions [], missingEvidence [], risks [], recommendedNextSteps [].',
    ].join('\n'),
    'route-analyst': [
      'Your role is Route Analyst.',
      'Analyse the actual activity, customer category, product and target country—not just the asset label.',
      'Identify licensing, promotion, intermediary, account ownership, custody, execution and data-rights questions raised by the source register.',
      'Return JSON with: status, summary, claims [{claim, sourceIds}], activityClassification, missingEvidence [], risks [], recommendedNextSteps [].',
    ].join('\n'),
    'independent-auditor': [
      'Your role is Independent Auditor.',
      'You run after the two analysts have completed. Independently check their claims against the supplied source register and source summaries.',
      'Flag any unsupported claim, invented provision, missing citation, overstatement, contradiction or leap from a source summary to permission.',
      'A sourceId appearing in the source register proves only that the source was supplied; it does not prove the agent paraphrased it correctly.',
      'Return JSON with: status, summary, verifiedClaimIndexes [], unsupportedClaims [{claim, reason}], contradictions [], unverifiedAssumptions [], additionalEvidenceNeeded [], recommendedNextSteps [].',
    ].join('\n'),
  };
  return shared + '\n\n' + roles[role];
}

function buildAnalystPrompt(route, sources, role) {
  return [
    'Review this synthetic route. It contains no real customer, account, order, transaction or funds data.',
    'ROLE: ' + role,
    'ROUTE INPUT:',
    JSON.stringify(route, null, 2),
    'ALLOWED SOURCE REGISTER:',
    JSON.stringify(sources, null, 2),
    'OUTPUT CONTRACT: JSON only. Do not assume missing gates are complete.',
  ].join('\n\n');
}

function buildAuditorPrompt(state) {
  return [
    'Audit the two concurrent analyst reports below. Treat them as untrusted drafts, not conclusions.',
    'SYNTHETIC ROUTE:',
    JSON.stringify(state.route, null, 2),
    'ALLOWED SOURCE REGISTER:',
    JSON.stringify(state.sources, null, 2),
    'EVIDENCE SCOUT REPORT:',
    JSON.stringify(state.reports['evidence-scout'] ?? null, null, 2),
    'ROUTE ANALYST REPORT:',
    JSON.stringify(state.reports['route-analyst'] ?? null, null, 2),
    'Return structured JSON under your role instructions. Do not approve or enable any action.',
  ].join('\n\n');
}

export function createReviewSession({ route, sources, model = process.env.MOZAIK_MODEL || 'gpt-5.5', timeoutMs = 180000 }) {
  const state = new ReviewState(route, sources);
  const runtime = defineRuntime();
  runtime.initializeRuntime({ state });
  const operator = createHuman({ name: 'VYRA Human Reviewer', capabilities: ['review', 'acknowledge'], handlers: [] });

  const analystRoles = ['evidence-scout', 'route-analyst'];
  const agents = {};

  const completion = new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Review timed out before the independent auditor completed.')), timeoutMs);
    state.onComplete = (outcome) => {
      clearTimeout(timeout);
      resolve(outcome);
    };
  });

  const operatorHandler = {
    specification: new WhenOperatorSubmitsCase(operator.getId()),
    processor: {
      apply({ event, participant }) {
        const role = analystRoles.find((item) => agents[item]?.getId() === participant.getId());
        if (!role) return;
        const agent = participant;
        const task = buildAnalystPrompt(state.route, state.sources, role);
        state.startedAgents.push({ role, startedAt: new Date().toISOString() });
        state.auditTrail.push({ type: 'agent.started', role, at: new Date().toISOString() });
        runtime.runLoop(agent.getId(), task, {
          model,
          context: agent.getMemory().getContext(),
          tools: agent.getTools(),
          maxOutputTokens: 1400,
        });
      },
    },
  };

  function answerHandler(role) {
    return {
      specification: new WhenAgentAnswers(),
      processor: {
        apply({ event, participant }) {
          if (participant.getId() !== agents[role]?.getId()) return;
          const payload = event.payload ?? {};
          const answer = payload.answer ?? payload;
          const raw = extractText(answer);
          const parsed = parseAgentJson(raw);
          state.reports[role] = parsed;
          state.rawReports[role] = raw;
          state.auditTrail.push({ type: 'agent.completed', role, at: new Date().toISOString() });

          if (analystRoles.includes(role)) {
            const completeAnalysts = analystRoles.every((item) => Boolean(state.reports[item]));
            if (completeAnalysts && !state.auditStarted) {
              state.auditStarted = true;
              runtime.sendEvent(
                SemanticEvent.create('analysis.ready', participant.getId(), { caseId: state.route.caseId }),
                participant.getId()
              );
            }
          } else if (role === 'independent-auditor') {
            state.finalOutcome = evaluateFinalOutcome({
              route: state.route,
              reports: state.reports,
              sources: state.sources,
            });
            state.auditTrail.push({ type: 'decision-engine.completed', at: new Date().toISOString(), status: state.finalOutcome.status });
            state.onComplete?.(state.finalOutcome);
          }
        },
      },
    };
  }

  for (const role of analystRoles) {
    agents[role] = createAgent({
      name: role === 'evidence-scout' ? 'Evidence Scout' : 'Route Analyst',
      capabilities: ['inference', 'source-analysis'],
      instruction: makeAgentInstructions(role),
      tools: [],
      handlers: [operatorHandler, answerHandler(role)],
    });
  }

  agents['independent-auditor'] = createAgent({
    name: 'Independent Auditor',
    capabilities: ['inference', 'source-audit'],
    instruction: makeAgentInstructions('independent-auditor'),
    tools: [],
    handlers: [
      {
        specification: new WhenAnalysisReady(),
        processor: {
          apply({ participant }) {
            const agent = participant;
            const prompt = buildAuditorPrompt(state);
            state.startedAgents.push({ role: 'independent-auditor', startedAt: new Date().toISOString() });
            state.auditTrail.push({ type: 'agent.started', role: 'independent-auditor', at: new Date().toISOString() });
            runtime.runLoop(agent.getId(), prompt, {
              model,
              context: agent.getMemory().getContext(),
              tools: agent.getTools(),
              maxOutputTokens: 1400,
            });
          },
        },
      },
      answerHandler('independent-auditor'),
    ],
  });

  runtime.join(operator);
  for (const agent of Object.values(agents)) runtime.join(agent);

  const submit = () => {
    state.auditTrail.push({ type: 'case.submitted', at: new Date().toISOString(), caseId: route.caseId });
    runtime.sendMessage(
      'Review case ' + route.caseId + '. The supplied route and source register are in your shared runtime state and in this task context.',
      operator.getId()
    );
  };

  return {
    state,
    operator,
    agents,
    completion,
    submit,
    runtime,
  };
}
