import test from 'node:test';
import assert from 'node:assert/strict';
import {
  canAccessCase, canChangeLeadStage, canCreateLead, canCreateTask,
  canManagePartners, canUpdateTask, LEAD_STAGES,
} from '../src/lib/crm/policy.mjs';

test('CRM prospect creation is limited to sales and administrators', () => {
  assert.equal(canCreateLead('sales'), true);
  assert.equal(canCreateLead('admin'), true);
  for (const role of ['support', 'compliance', 'finance', 'dealing', 'read_only']) {
    assert.equal(canCreateLead(role), false);
  }
});

test('sensitive operational case queues are role scoped', () => {
  assert.equal(canAccessCase('compliance', 'aml_review'), true);
  assert.equal(canAccessCase('finance', 'payment_exception'), true);
  assert.equal(canAccessCase('dealing', 'dealing_risk'), true);
  assert.equal(canAccessCase('support', 'customer_support'), true);
  assert.equal(canAccessCase('sales', 'aml_review'), false);
  assert.equal(canAccessCase('finance', 'dealing_risk'), false);
  assert.equal(canAccessCase('read_only', 'customer_support'), false);
});

test('handoff and verified-client stages cannot be asserted by a human CRM edit', () => {
  assert.equal(canChangeLeadStage('sales', 'qualified'), true);
  assert.equal(canChangeLeadStage('sales', 'partner_handoff_pending_approval'), true);
  assert.equal(canChangeLeadStage('sales', 'partner_onboarding'), false);
  assert.equal(canChangeLeadStage('admin', 'partner_confirmed'), false);
  assert.equal(canChangeLeadStage('sales', 'unknown'), false);
  assert.ok(LEAD_STAGES.includes('partner_confirmed'));
});

test('tasks and partner management are role scoped', () => {
  assert.equal(canCreateTask('support'), true);
  assert.equal(canCreateTask('finance'), false);
  assert.equal(canManagePartners('partner_manager'), true);
  assert.equal(canManagePartners('sales'), false);
  assert.equal(canUpdateTask('sales', 'u1', 'u1'), true);
  assert.equal(canUpdateTask('sales', 'u2', 'u1'), false);
  assert.equal(canUpdateTask('operations', 'u2', 'u1'), true);
});
