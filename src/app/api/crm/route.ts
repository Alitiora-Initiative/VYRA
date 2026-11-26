import { NextRequest } from 'next/server';
import { getNeonServer } from '@/lib/neon/server';
import { isRecord, isSameOriginRequest, jsonError, privateJson } from '@/lib/http';
import {
  CASE_CATEGORIES, canAccessCase, canChangeLeadStage,
  canCreateLead, canCreateTask, canManagePartners, canUpdateTask,
} from '@/lib/crm/policy.mjs';

export const dynamic = 'force-dynamic';

type StaffContext = {
  db: NonNullable<Awaited<ReturnType<typeof getNeonServer>>>;
  user: { id: string; email?: string | null };
  workspaceId: string;
  role: string;
};

async function staffContext(): Promise<{ context: StaffContext } | { response: Response }> {
  const db = await getNeonServer();
  if (!db) return { response: jsonError('Authentication database is not configured.', 503, 'AUTH_NOT_CONFIGURED') };
  const { data: auth, error: authError } = await db.auth.getUser();
  if (authError || !auth.user) {
    return { response: jsonError('Sign in with an authorised VYRA staff account.', 401, 'UNAUTHENTICATED') };
  }

  const { data: memberships, error } = await db
    .from('crm_staff_members')
    .select('workspace_id,role,active')
    .eq('user_id', auth.user.id)
    .eq('active', true)
    .limit(1);

  const membership = memberships?.[0];
  if (error || !membership?.workspace_id || !membership?.role) {
    return { response: jsonError('CRM access has not been provisioned for this account.', 403, 'CRM_ACCESS_NOT_PROVISIONED') };
  }

  return {
    context: {
      db,
      user: auth.user,
      workspaceId: membership.workspace_id,
      role: membership.role,
    },
  };
}

function cleanText(value: unknown, max: number) {
  if (typeof value !== 'string') return null;
  const result = value.trim();
  return result.length > 0 && result.length <= max ? result : null;
}

function validCountryCode(value: unknown): value is string {
  return typeof value === 'string' && /^[A-Za-z]{2}$/.test(value);
}

function validEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) && value.length <= 254;
}

const LEAD_SOURCES = [
  'organic','paid_search','paid_social','affiliate','introducing_broker',
  'community','referral','direct','event','other',
] as const;

export async function GET() {
  const access = await staffContext();
  if ('response' in access) return access.response;
  const { db, workspaceId, role } = access.context;

  const [leads, tasks, cases, partners, audit] = await Promise.all([
    db.from('crm_leads')
      .select('id,full_name,email,phone,country_code,source,campaign_name,stage,created_at,owner_id,marketing_consent,partner_id')
      .eq('workspace_id', workspaceId).order('created_at', { ascending: false }).limit(200),
    db.from('crm_tasks')
      .select('id,lead_id,title,description,priority,status,due_at,assigned_to,created_at')
      .eq('workspace_id', workspaceId).in('status', ['open','in_progress']).order('due_at', { ascending: true }).limit(200),
    db.from('crm_cases')
      .select('id,lead_id,category,title,summary,partner_reference,priority,status,owner_id,opened_at')
      .eq('workspace_id', workspaceId).in('status', ['open','investigating','waiting_on_partner','escalated']).order('opened_at', { ascending: false }).limit(200),
    db.from('crm_growth_partners')
      .select('id,display_name,partner_type,country_code,status,legal_entity_verified_at,licence_verified_at,agreement_signed_at,country_scope_approved_at,created_at')
      .eq('workspace_id', workspaceId).order('created_at', { ascending: false }).limit(100),
    db.from('crm_audit_events')
      .select('id,actor_id,action,entity_type,entity_id,details,created_at')
      .eq('workspace_id', workspaceId).order('created_at', { ascending: false }).limit(30),
  ]);

  const failed = [leads, tasks, cases, partners, audit].find((result) => result.error);
  if (failed?.error) return jsonError('CRM data could not be loaded. Confirm the CRM database migration is applied.', 503, 'CRM_DATABASE_NOT_READY');

  return privateJson({
    ok: true,
    workspaceId,
    role,
    data: {
      leads: leads.data ?? [],
      tasks: tasks.data ?? [],
      cases: cases.data ?? [],
      partners: partners.data ?? [],
      audit: audit.data ?? [],
    },
    limits: { leads: 200, tasks: 200, cases: 200, partners: 100, audit: 30 },
    controls: {
      liveExecutionEnabled: false,
      customerMoneyEnabled: false,
      externalReferralEnabled: false,
      rawIdentityDocumentsAccepted: false,
    },
  });
}

export async function POST(request: NextRequest) {
  if (!isSameOriginRequest(request)) return jsonError('Cross-origin mutation rejected.', 403, 'ORIGIN_REJECTED');
  const access = await staffContext();
  if ('response' in access) return access.response;
  const { db, user, workspaceId, role } = access.context;

  let payload: unknown;
  try { payload = await request.json(); } catch { return jsonError('Request body must be valid JSON.'); }
  if (!isRecord(payload) || typeof payload.kind !== 'string') return jsonError('A CRM record kind is required.');

  if (payload.kind === 'lead') {
    if (!canCreateLead(role)) return jsonError('Only sales staff and administrators can create prospect records.', 403, 'ROLE_FORBIDDEN');
    const fullName = cleanText(payload.fullName, 120);
    const email = typeof payload.email === 'string' && payload.email.trim() ? payload.email.trim().toLowerCase() : null;
    const phone = typeof payload.phone === 'string' && payload.phone.trim() ? payload.phone.trim() : null;
    const countryCode = validCountryCode(payload.countryCode) ? payload.countryCode.toUpperCase() : null;
    const source = cleanText(payload.source, 40);
    const campaignName = cleanText(payload.campaignName, 120);
    const contactChannel = payload.contactChannel === 'email' || payload.contactChannel === 'phone'
      ? payload.contactChannel : 'none';
    const marketingConsent = payload.marketingConsent === true;

    if (!fullName || !countryCode || !source || !LEAD_SOURCES.includes(source as typeof LEAD_SOURCES[number])) {
      return jsonError('Name, valid two-letter country code and an approved acquisition source are required.');
    }
    if (!email && !phone) return jsonError('Add at least one contact method.');
    if (email && !validEmail(email)) return jsonError('Enter a valid email address.');
    if (phone && phone.length > 32) return jsonError('Phone number is too long.');
    if (marketingConsent && (contactChannel === 'none' || (contactChannel === 'email' && !email) || (contactChannel === 'phone' && !phone))) {
      return jsonError('Marketing consent needs an explicit contact channel and matching contact detail.');
    }

    const { data: lead, error } = await db.from('crm_leads').insert({
      workspace_id: workspaceId,
      owner_id: user.id,
      full_name: fullName,
      email,
      phone,
      country_code: countryCode,
      source,
      campaign_name: campaignName,
      stage: 'new',
      marketing_consent: marketingConsent,
      consent_recorded_at: marketingConsent ? new Date().toISOString() : null,
      consent_policy_version: marketingConsent ? 'VYRA-CRM-CONSENT-DRAFT-V1' : null,
      contact_channel: contactChannel,
    }).select('id,full_name,email,phone,country_code,source,campaign_name,stage,created_at,owner_id,marketing_consent,partner_id').single();

    if (error || !lead) return jsonError('Prospect could not be saved.', 503, 'CRM_LEAD_CREATE_FAILED');

    return privateJson({
      ok: true,
      record: lead,
      audit: 'append_only_database_trigger',
      notice: marketingConsent
        ? 'Marketing consent was captured with a draft policy version. Replace the draft policy version with an approved notice before live outreach.'
        : 'No marketing consent was recorded.',
    }, 201);
  }

  if (payload.kind === 'partner') {
    if (!canManagePartners(role)) return jsonError('Only partner managers and administrators can add partner records.', 403, 'ROLE_FORBIDDEN');
    const displayName = cleanText(payload.displayName, 120);
    const partnerType = cleanText(payload.partnerType, 32);
    const countryCode = payload.countryCode === '' || payload.countryCode === null || payload.countryCode === undefined
      ? null : validCountryCode(payload.countryCode) ? payload.countryCode.toUpperCase() : false;
    const notes = cleanText(payload.notes, 600);
    if (!displayName || displayName.length < 2) return jsonError('Partner name must be at least two characters.');
    if (!['affiliate','introducing_broker','community','technology_provider','regulated_principal','other'].includes(partnerType ?? '')) {
      return jsonError('Select a valid partner category.');
    }
    if (countryCode === false) return jsonError('Country code must be two letters or left blank.');
    const { data: partner, error } = await db.from('crm_growth_partners').insert({
      workspace_id: workspaceId,
      display_name: displayName,
      partner_type: partnerType,
      country_code: countryCode,
      status: 'research_only',
      notes,
      created_by: user.id,
    }).select('id,display_name,partner_type,country_code,status,legal_entity_verified_at,licence_verified_at,agreement_signed_at,country_scope_approved_at,created_at').single();
    if (error || !partner) return jsonError('Partner research record could not be saved.', 503, 'CRM_PARTNER_CREATE_FAILED');
    return privateJson({
      ok: true,
      record: partner,
      audit: 'append_only_database_trigger',
      notice: 'Partner saved as research only. Legal entity, licence, agreement and country scope remain unverified.',
    }, 201);
  }

  if (payload.kind === 'task') {
    if (!canCreateTask(role)) return jsonError('Your role cannot create CRM tasks.', 403, 'ROLE_FORBIDDEN');
    const title = cleanText(payload.title, 140);
    const description = cleanText(payload.description, 500);
    const priority = ['low','normal','high','urgent'].includes(String(payload.priority)) ? String(payload.priority) : 'normal';
    if (!title || title.length < 3) return jsonError('Task title must be at least three characters.');
    let dueAt: string | null = null;
    if (typeof payload.dueAt === 'string' && payload.dueAt) {
      const parsed = new Date(payload.dueAt);
      if (Number.isNaN(parsed.getTime())) return jsonError('Task due date is invalid.');
      dueAt = parsed.toISOString();
    }
    const leadId = typeof payload.leadId === 'string' && /^[0-9a-f-]{36}$/i.test(payload.leadId)
      ? payload.leadId : null;
    const { data: task, error } = await db.from('crm_tasks').insert({
      workspace_id: workspaceId,
      lead_id: leadId,
      assigned_to: user.id,
      created_by: user.id,
      title,
      description,
      priority,
      due_at: dueAt,
    }).select('id,lead_id,title,description,priority,status,due_at,assigned_to,created_at').single();
    if (error || !task) return jsonError('Task could not be saved.', 503, 'CRM_TASK_CREATE_FAILED');
    return privateJson({ ok: true, record: task, audit: 'append_only_database_trigger' }, 201);
  }

  if (payload.kind === 'case') {
    const category = cleanText(payload.category, 40);
    if (!category || !CASE_CATEGORIES.includes(category) || !canAccessCase(role, category)) {
      return jsonError('Your role is not authorised for this operational case category.', 403, 'CASE_CATEGORY_FORBIDDEN');
    }
    const title = cleanText(payload.title, 140);
    const summary = cleanText(payload.summary, 600);
    const partnerReference = cleanText(payload.partnerReference, 100);
    const priority = ['low','normal','high','urgent'].includes(String(payload.priority)) ? String(payload.priority) : 'normal';
    if (!title || title.length < 3) return jsonError('Case title must be at least three characters.');
    const leadId = typeof payload.leadId === 'string' && /^[0-9a-f-]{36}$/i.test(payload.leadId)
      ? payload.leadId : null;
    const { data: caseRecord, error } = await db.from('crm_cases').insert({
      workspace_id: workspaceId,
      lead_id: leadId,
      category,
      title,
      summary,
      partner_reference: partnerReference,
      priority,
      owner_id: user.id,
    }).select('id,lead_id,category,title,summary,partner_reference,priority,status,owner_id,opened_at').single();
    if (error || !caseRecord) return jsonError('Operational case could not be saved.', 503, 'CRM_CASE_CREATE_FAILED');
    return privateJson({ ok: true, record: caseRecord, audit: 'append_only_database_trigger' }, 201);
  }

  return jsonError('Unsupported CRM record kind.');
}

export async function PATCH(request: NextRequest) {
  if (!isSameOriginRequest(request)) return jsonError('Cross-origin mutation rejected.', 403, 'ORIGIN_REJECTED');
  const access = await staffContext();
  if ('response' in access) return access.response;
  const { db, user, workspaceId, role } = access.context;

  let payload: unknown;
  try { payload = await request.json(); } catch { return jsonError('Request body must be valid JSON.'); }
  if (!isRecord(payload) || typeof payload.kind !== 'string' || typeof payload.id !== 'string') {
    return jsonError('A record kind and id are required.');
  }

  if (payload.kind === 'lead') {
    const stage = typeof payload.stage === 'string' ? payload.stage : '';
    if (!canChangeLeadStage(role, stage)) return jsonError('That lead stage is not available to this role or requires a verified partner event.', 403, 'LEAD_STAGE_FORBIDDEN');
    const { data, error } = await db.from('crm_leads').update({
      stage,
      updated_at: new Date().toISOString(),
      ...(stage === 'contacted' ? { last_contacted_at: new Date().toISOString() } : {}),
    }).eq('id', payload.id).eq('workspace_id', workspaceId)
      .select('id,stage,updated_at,last_contacted_at').single();
    if (error || !data) return jsonError('Lead stage could not be updated.', 503, 'CRM_LEAD_UPDATE_FAILED');
    return privateJson({ ok: true, record: data, audit: 'append_only_database_trigger' });
  }

  if (payload.kind === 'task') {
    const nextStatus = typeof payload.status === 'string' ? payload.status : '';
    if (!['in_progress','done','cancelled','open'].includes(nextStatus)) return jsonError('Unsupported task status.');
    const { data: existing, error: loadError } = await db.from('crm_tasks')
      .select('id,assigned_to').eq('id', payload.id).eq('workspace_id', workspaceId).single();
    if (loadError || !existing) return jsonError('Task was not found.', 404, 'CRM_TASK_NOT_FOUND');
    if (!canUpdateTask(role, existing.assigned_to, user.id)) return jsonError('Only the assignee, operations or an administrator can update this task.', 403, 'ROLE_FORBIDDEN');
    const { data, error } = await db.from('crm_tasks').update({
      status: nextStatus,
      completed_at: nextStatus === 'done' ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    }).eq('id', payload.id).eq('workspace_id', workspaceId)
      .select('id,status,completed_at,updated_at').single();
    if (error || !data) return jsonError('Task could not be updated.', 503, 'CRM_TASK_UPDATE_FAILED');
    return privateJson({ ok: true, record: data, audit: 'append_only_database_trigger' });
  }

  if (payload.kind === 'case') {
    const status = typeof payload.status === 'string' ? payload.status : '';
    if (!['open','investigating','waiting_on_partner','escalated','resolved','closed'].includes(status)) {
      return jsonError('Unsupported case status.');
    }
    const { data: existing, error: loadError } = await db.from('crm_cases')
      .select('id,category').eq('id', payload.id).eq('workspace_id', workspaceId).single();
    if (loadError || !existing) return jsonError('Case was not found or is outside your role.', 404, 'CRM_CASE_NOT_FOUND');
    if (!canAccessCase(role, existing.category)) return jsonError('Your role cannot update this case.', 403, 'ROLE_FORBIDDEN');
    const { data, error } = await db.from('crm_cases').update({
      status,
      resolved_at: ['resolved','closed'].includes(status) ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    }).eq('id', payload.id).eq('workspace_id', workspaceId)
      .select('id,status,resolved_at,updated_at').single();
    if (error || !data) return jsonError('Operational case could not be updated.', 503, 'CRM_CASE_UPDATE_FAILED');
    return privateJson({ ok: true, record: data, audit: 'append_only_database_trigger' });
  }

  return jsonError('Unsupported CRM record kind.');
}
