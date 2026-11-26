import test from 'node:test';
import assert from 'node:assert/strict';
import {
  defineRuntime,
  RuntimeState,
  createAgent,
  createHuman,
  SituationSpecification,
  SemanticEvent,
} from '@mozaik-ai/core';

class SmokeState extends RuntimeState {
  constructor() {
    super();
    this.received = [];
  }
}

class WhenSentinelProbe extends SituationSpecification {
  isSatisfiedBy({ event }) {
    return event.type === 'sentinel.smoke';
  }
}

test('Mozaik runtime joins participants and dispatches a custom semantic event', () => {
  const state = new SmokeState();
  const runtime = defineRuntime();
  runtime.initializeRuntime({ state });

  const human = createHuman({ name: 'Smoke Test Operator', capabilities: [], handlers: [] });
  const agent = createAgent({
    name: 'Smoke Test Observer',
    capabilities: ['source-analysis'],
    instruction: 'Observe the event and record the supplied case id.',
    tools: [],
    handlers: [{
      specification: new WhenSentinelProbe(),
      processor: {
        apply({ event }) {
          state.received.push(event.payload.caseId);
        },
      },
    }],
  });

  runtime.join(human);
  runtime.join(agent);
  runtime.sendEvent(
    SemanticEvent.create('sentinel.smoke', human.getId(), { caseId: 'SMOKE-001' }),
    human.getId()
  );

  assert.deepEqual(state.received, ['SMOKE-001']);
  assert.equal(state.getParticipants().length, 2);
});
