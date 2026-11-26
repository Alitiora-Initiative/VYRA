import { randomUUID } from 'node:crypto';
import { supportedModels } from '@mozaik-ai/core';

function outputMessage(content) {
  return {
    type: 'message',
    id: 'msg_' + randomUUID(),
    role: 'assistant',
    status: 'completed',
    content: [{ type: 'output_text', text: JSON.stringify(content) }],
  };
}

export class VYRAOfflineInferenceRunner {
  constructor({ delayMs = 75 } = {}) {
    this.delayMs = delayMs;
    this.calls = 0;
    this.active = 0;
    this.maxInFlight = 0;
    this.timeline = [];
  }

  async run(request) {
    const call = this.calls++;
    const roles = ['evidence-scout', 'route-analyst', 'independent-auditor'];
    let contextDump = '';
    try {
      contextDump = JSON.stringify(request?.context ?? {});
    } catch {
      contextDump = String(request?.context ?? '');
    }
    const role = contextDump.includes('ROLE: evidence-scout')
      ? 'evidence-scout'
      : contextDump.includes('ROLE: route-analyst')
        ? 'route-analyst'
        : contextDump.includes('Audit the two concurrent analyst reports')
          ? 'independent-auditor'
          : (roles[call] ?? 'unexpected-extra-call');
    const startedAt = Date.now();
    this.active += 1;
    this.maxInFlight = Math.max(this.maxInFlight, this.active);
    this.timeline.push({ role, event: 'started', at: startedAt, model: request?.model ?? 'unknown' });

    await new Promise((resolve) => setTimeout(resolve, this.delayMs));

    let report;
    if (role === 'evidence-scout') {
      report = {
        status: 'review',
        summary: 'The supplied CMA licensing checklist identifies separate market-intermediary categories. This source summary does not decide VYRA classification.',
        claims: [{
          claim: 'The CMA publishes distinct licensing checklists for categories such as broker-dealers, stockbrokers, investment advisers and ISPPs.',
          sourceIds: ['cma-licensing-checklists'],
        }],
        relevantProvisions: ['CMA licensing checklist categories'],
        missingEvidence: ['Full consolidated regulations', 'Written classification of the exact VYRA journey'],
        risks: ['A checklist is not a licence', 'A general technology label does not decide the regulated activity'],
        recommendedNextSteps: ['Obtain qualified Kenyan legal review', 'Verify the actual principal and its scope'],
      };
    } else if (role === 'route-analyst') {
      report = {
        status: 'review',
        summary: 'A Kenya-targeted virtual-asset service has a current licensing and promotion perimeter that must be mapped to the exact VYRA activity.',
        claims: [{
          claim: 'The 2026 VASP Regulations address virtual-asset services in or from Kenya and separately contain advertising and promotion provisions.',
          sourceIds: ['kenya-vasp-regulations', 'cbk-cma-vasp-notice'],
        }],
        activityClassification: 'licensing_and_promotion_review_required',
        missingEvidence: ['Activity-specific legal classification', 'Named regulated principal', 'VYRA agreement and permitted role', 'Customer-category and country approvals'],
        risks: ['The offline example is not a legal opinion', 'A foreign server or referral label is not treated as an exemption'],
        recommendedNextSteps: ['Keep the route blocked', 'Ask counsel to review the exact journey and applicable 2026 VASP rules'],
      };
    } else {
      report = {
        status: 'needs_human_review',
        summary: 'The two reports cite supplied source IDs. This offline auditor confirms citation IDs exist in the supplied register, not that the summaries are complete or legally conclusive.',
        verifiedClaimIndexes: [0, 1],
        unsupportedClaims: [],
        contradictions: [],
        unverifiedAssumptions: ['No real provider legal entity is verified', 'No agreement or production sandbox exists'],
        additionalEvidenceNeeded: ['Full statutory text and current regulator guidance', 'Written Kenyan legal opinion', 'Provider register extract and executed agreement'],
        recommendedNextSteps: ['Do not enable customer onboarding, referrals, order transmission or money movement'],
      };
    }

    this.active -= 1;
    this.timeline.push({ role, event: 'completed', at: Date.now(), elapsedMs: Date.now() - startedAt });
    return {
      items: [outputMessage(report)],
      tokenUsage: undefined,
      rowResponse: { mode: 'offline-scripted-demo', role },
    };
  }

  async *stream() {
    return;
  }

  snapshot() {
    return {
      mode: 'offline-scripted-demo',
      modelProviderCalls: 0,
      completedCalls: this.calls,
      maxConcurrentCalls: this.maxInFlight,
      timeline: [...this.timeline],
    };
  }
}

export function createOfflineInferenceRunnerConfig(options = {}) {
  const runner = new VYRAOfflineInferenceRunner(options);
  return {
    runner,
    inferenceRunnerConfig: {
      supportedModels,
      runner,
    },
  };
}
