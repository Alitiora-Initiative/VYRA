-- VYRA CRM and brokerage operations foundation.
-- Additive migration. Stores prospect/contact metadata and operational case references only.
-- It does not store identity documents, payment credentials, client money or live trading instructions.

create table if not exists public.crm_workspaces (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  created_at timestamptz not null default now()
);

insert into public.crm_workspaces (id, slug, name)
values ('a0000000-0000-4000-8000-000000000001', 'vyra-main', 'VYRA Markets')
on conflict (slug) do nothing;

create table if not exists public.crm_staff_members (
  workspace_id uuid not null references public.crm_workspaces(id) on delete restrict,
  user_id uuid not null references neon_auth."user"(id) on delete restrict,
  role text not null check (role in (
    'admin','sales','compliance','support','finance','dealing',
    'operations','partner_manager','read_only'
  )),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  primary key (workspace_id, user_id)
);

create or replace function private.crm_has_workspace_access(p_workspace_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $crm$
  select exists (
    select 1 from public.crm_staff_members m
    where m.workspace_id = p_workspace_id
      and m.user_id = auth.uid()
      and m.active = true
  );
$crm$;

create or replace function private.crm_has_workspace_role(p_workspace_id uuid, p_roles text[])
returns boolean
language sql
stable
security definer
set search_path = ''
as $crm$
  select exists (
    select 1 from public.crm_staff_members m
    where m.workspace_id = p_workspace_id
      and m.user_id = auth.uid()
      and m.active = true
      and m.role = any(p_roles)
  );
$crm$;

create or replace function private.crm_can_access_case(p_workspace_id uuid, p_category text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $crm$
  select case p_category
    when 'kyc_review' then private.crm_has_workspace_role(p_workspace_id, array['admin','compliance','operations'])
    when 'aml_review' then private.crm_has_workspace_role(p_workspace_id, array['admin','compliance','operations'])
    when 'fraud_review' then private.crm_has_workspace_role(p_workspace_id, array['admin','compliance','operations'])
    when 'payment_exception' then private.crm_has_workspace_role(p_workspace_id, array['admin','finance','operations'])
    when 'dealing_risk' then private.crm_has_workspace_role(p_workspace_id, array['admin','dealing','operations'])
    when 'reconciliation' then private.crm_has_workspace_role(p_workspace_id, array['admin','finance','operations'])
    when 'customer_support' then private.crm_has_workspace_role(p_workspace_id, array['admin','support','operations'])
    when 'complaint' then private.crm_has_workspace_role(p_workspace_id, array['admin','support','compliance','operations'])
    when 'partner_incident' then private.crm_has_workspace_role(p_workspace_id, array['admin','partner_manager','operations'])
    else false
  end;
$crm$;

create table if not exists public.crm_growth_partners (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.crm_workspaces(id) on delete restrict,
  display_name text not null check (length(trim(display_name)) between 2 and 120),
  partner_type text not null check (partner_type in (
    'affiliate','introducing_broker','community','technology_provider','regulated_principal','other'
  )),
  country_code char(2),
  status text not null default 'research_only' check (status in (
    'research_only','due_diligence','approved','suspended','rejected'
  )),
  notes text check (notes is null or length(notes) <= 600),
  legal_entity_verified_at timestamptz,
  licence_verified_at timestamptz,
  agreement_signed_at timestamptz,
  country_scope_approved_at timestamptz,
  created_by uuid not null references neon_auth."user"(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, workspace_id)
);
create index if not exists crm_growth_partners_workspace_idx
  on public.crm_growth_partners(workspace_id, status, created_at desc);

create table if not exists public.crm_leads (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.crm_workspaces(id) on delete restrict,
  owner_id uuid not null references neon_auth."user"(id) on delete restrict,
  partner_id uuid,
  full_name text not null check (length(trim(full_name)) between 2 and 120),
  email text check (email is null or length(email) <= 254),
  phone text check (phone is null or length(phone) <= 32),
  country_code char(2) not null,
  preferred_language text check (preferred_language is null or length(preferred_language) <= 16),
  source text not null check (source in (
    'organic','paid_search','paid_social','affiliate','introducing_broker',
    'community','referral','direct','event','other'
  )),
  campaign_name text check (campaign_name is null or length(campaign_name) <= 120),
  stage text not null default 'new' check (stage in (
    'new','contacted','qualified','eligibility_review',
    'partner_handoff_pending_approval','partner_onboarding','partner_confirmed','lost'
  )),
  marketing_consent boolean not null default false,
  consent_recorded_at timestamptz,
  consent_policy_version text,
  contact_channel text not null default 'none' check (contact_channel in ('none','email','phone')),
  last_contacted_at timestamptz,
  retention_review_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, workspace_id),
  foreign key (partner_id, workspace_id)
    references public.crm_growth_partners(id, workspace_id) on delete restrict,
  check (
    (marketing_consent = false and consent_recorded_at is null)
    or
    (marketing_consent = true and consent_recorded_at is not null
      and consent_policy_version is not null and contact_channel <> 'none')
  ),
  check (email is not null or phone is not null)
);
create index if not exists crm_leads_workspace_stage_idx
  on public.crm_leads(workspace_id, stage, created_at desc);
create index if not exists crm_leads_workspace_source_idx
  on public.crm_leads(workspace_id, source, campaign_name);

create table if not exists public.crm_attribution_touchpoints (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.crm_workspaces(id) on delete restrict,
  lead_id uuid not null,
  partner_id uuid,
  touchpoint_type text not null check (touchpoint_type in ('first_touch','last_touch','partner_referral','campaign_response')),
  source text not null check (length(source) <= 80),
  medium text check (medium is null or length(medium) <= 80),
  campaign text check (campaign is null or length(campaign) <= 120),
  content text check (content is null or length(content) <= 120),
  country_code char(2),
  consent_basis text not null check (consent_basis in ('user_requested_contact','marketing_consent','partner_reported')),
  occurred_at timestamptz not null default now(),
  created_by uuid not null references neon_auth."user"(id) on delete restrict,
  foreign key (lead_id, workspace_id)
    references public.crm_leads(id, workspace_id) on delete restrict,
  foreign key (partner_id, workspace_id)
    references public.crm_growth_partners(id, workspace_id) on delete restrict
);
create index if not exists crm_attribution_lead_time_idx
  on public.crm_attribution_touchpoints(workspace_id, lead_id, occurred_at);

create table if not exists public.crm_tasks (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.crm_workspaces(id) on delete restrict,
  lead_id uuid,
  assigned_to uuid not null references neon_auth."user"(id) on delete restrict,
  created_by uuid not null references neon_auth."user"(id) on delete restrict,
  title text not null check (length(trim(title)) between 3 and 140),
  description text check (description is null or length(description) <= 500),
  priority text not null default 'normal' check (priority in ('low','normal','high','urgent')),
  status text not null default 'open' check (status in ('open','in_progress','done','cancelled')),
  due_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (lead_id, workspace_id)
    references public.crm_leads(id, workspace_id) on delete restrict
);
create index if not exists crm_tasks_workspace_due_idx
  on public.crm_tasks(workspace_id, status, due_at);

create table if not exists public.crm_cases (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.crm_workspaces(id) on delete restrict,
  lead_id uuid,
  category text not null check (category in (
    'kyc_review','aml_review','fraud_review','payment_exception','dealing_risk',
    'reconciliation','customer_support','complaint','partner_incident'
  )),
  title text not null check (length(trim(title)) between 3 and 140),
  summary text check (summary is null or length(summary) <= 600),
  partner_reference text check (partner_reference is null or length(partner_reference) <= 100),
  priority text not null default 'normal' check (priority in ('low','normal','high','urgent')),
  status text not null default 'open' check (status in (
    'open','investigating','waiting_on_partner','escalated','resolved','closed'
  )),
  owner_id uuid not null references neon_auth."user"(id) on delete restrict,
  opened_at timestamptz not null default now(),
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (lead_id, workspace_id)
    references public.crm_leads(id, workspace_id) on delete restrict
);
create index if not exists crm_cases_workspace_status_idx
  on public.crm_cases(workspace_id, status, priority, opened_at desc);

create table if not exists public.crm_audit_events (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.crm_workspaces(id) on delete restrict,
  actor_id uuid not null references neon_auth."user"(id) on delete restrict,
  action text not null check (length(action) <= 80),
  entity_type text not null check (entity_type in ('lead','task','case','growth_partner','attribution')),
  entity_id uuid not null,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists crm_audit_workspace_time_idx
  on public.crm_audit_events(workspace_id, created_at desc);

create or replace function private.crm_reject_audit_mutation()
returns trigger
language plpgsql
security definer
set search_path = ''
as $crm$
begin
  raise exception 'CRM_AUDIT_EVENTS_ARE_APPEND_ONLY';
end;
$crm$;

drop trigger if exists crm_audit_no_mutation on public.crm_audit_events;
create trigger crm_audit_no_mutation
before update or delete on public.crm_audit_events
for each row execute function private.crm_reject_audit_mutation();

alter table public.crm_workspaces enable row level security;
alter table public.crm_staff_members enable row level security;
alter table public.crm_growth_partners enable row level security;
alter table public.crm_leads enable row level security;
alter table public.crm_attribution_touchpoints enable row level security;
alter table public.crm_tasks enable row level security;
alter table public.crm_cases enable row level security;
alter table public.crm_audit_events enable row level security;

drop policy if exists crm_workspace_member_read on public.crm_workspaces;
create policy crm_workspace_member_read on public.crm_workspaces
  for select to authenticated using (private.crm_has_workspace_access(id));

drop policy if exists crm_staff_self_or_admin_read on public.crm_staff_members;
create policy crm_staff_self_or_admin_read on public.crm_staff_members
  for select to authenticated using (
    user_id = auth.uid() or private.crm_has_workspace_role(workspace_id, array['admin'])
  );

drop policy if exists crm_growth_partner_read on public.crm_growth_partners;
create policy crm_growth_partner_read on public.crm_growth_partners
  for select to authenticated using (private.crm_has_workspace_access(workspace_id));
drop policy if exists crm_growth_partner_insert on public.crm_growth_partners;
create policy crm_growth_partner_insert on public.crm_growth_partners
  for insert to authenticated with check (
    private.crm_has_workspace_role(workspace_id, array['admin','partner_manager'])
    and created_by = auth.uid()
  );
drop policy if exists crm_growth_partner_update on public.crm_growth_partners;
create policy crm_growth_partner_update on public.crm_growth_partners
  for update to authenticated using (
    private.crm_has_workspace_role(workspace_id, array['admin','partner_manager'])
  ) with check (
    private.crm_has_workspace_role(workspace_id, array['admin','partner_manager'])
  );

drop policy if exists crm_lead_read on public.crm_leads;
create policy crm_lead_read on public.crm_leads
  for select to authenticated using (private.crm_has_workspace_access(workspace_id));
drop policy if exists crm_lead_insert on public.crm_leads;
create policy crm_lead_insert on public.crm_leads
  for insert to authenticated with check (
    private.crm_has_workspace_role(workspace_id, array['admin','sales'])
    and owner_id = auth.uid()
  );
drop policy if exists crm_lead_update on public.crm_leads;
create policy crm_lead_update on public.crm_leads
  for update to authenticated using (
    private.crm_has_workspace_role(workspace_id, array['admin','sales'])
  ) with check (
    private.crm_has_workspace_role(workspace_id, array['admin','sales'])
  );

drop policy if exists crm_attribution_read on public.crm_attribution_touchpoints;
create policy crm_attribution_read on public.crm_attribution_touchpoints
  for select to authenticated using (private.crm_has_workspace_access(workspace_id));
drop policy if exists crm_attribution_insert on public.crm_attribution_touchpoints;
create policy crm_attribution_insert on public.crm_attribution_touchpoints
  for insert to authenticated with check (
    private.crm_has_workspace_role(workspace_id, array['admin','sales'])
    and created_by = auth.uid()
  );

drop policy if exists crm_task_read on public.crm_tasks;
create policy crm_task_read on public.crm_tasks
  for select to authenticated using (private.crm_has_workspace_access(workspace_id));
drop policy if exists crm_task_insert on public.crm_tasks;
create policy crm_task_insert on public.crm_tasks
  for insert to authenticated with check (
    private.crm_has_workspace_role(workspace_id, array['admin','sales','support','compliance','operations'])
    and created_by = auth.uid()
  );
drop policy if exists crm_task_update on public.crm_tasks;
create policy crm_task_update on public.crm_tasks
  for update to authenticated using (
    assigned_to = auth.uid()
    or private.crm_has_workspace_role(workspace_id, array['admin','operations'])
  ) with check (
    assigned_to = auth.uid()
    or private.crm_has_workspace_role(workspace_id, array['admin','operations'])
  );

drop policy if exists crm_case_read on public.crm_cases;
create policy crm_case_read on public.crm_cases
  for select to authenticated using (private.crm_can_access_case(workspace_id, category));
drop policy if exists crm_case_insert on public.crm_cases;
create policy crm_case_insert on public.crm_cases
  for insert to authenticated with check (
    private.crm_can_access_case(workspace_id, category) and owner_id = auth.uid()
  );
drop policy if exists crm_case_update on public.crm_cases;
create policy crm_case_update on public.crm_cases
  for update to authenticated using (private.crm_can_access_case(workspace_id, category))
  with check (private.crm_can_access_case(workspace_id, category));

drop policy if exists crm_audit_read on public.crm_audit_events;
create policy crm_audit_read on public.crm_audit_events
  for select to authenticated using (private.crm_has_workspace_access(workspace_id));
drop policy if exists crm_audit_insert on public.crm_audit_events;
create policy crm_audit_insert on public.crm_audit_events
  for insert to authenticated with check (
    private.crm_has_workspace_access(workspace_id) and actor_id = auth.uid()
  );

revoke all on function private.crm_has_workspace_access(uuid) from public, anonymous;
revoke all on function private.crm_has_workspace_role(uuid,text[]) from public, anonymous;
revoke all on function private.crm_can_access_case(uuid,text) from public, anonymous;
revoke all on function private.crm_reject_audit_mutation() from public, anonymous, authenticated;
grant execute on function private.crm_has_workspace_access(uuid) to authenticated;
grant execute on function private.crm_has_workspace_role(uuid,text[]) to authenticated;
grant execute on function private.crm_can_access_case(uuid,text) to authenticated;

grant select on public.crm_workspaces, public.crm_staff_members,
  public.crm_growth_partners, public.crm_leads, public.crm_attribution_touchpoints,
  public.crm_tasks, public.crm_cases, public.crm_audit_events to authenticated;
grant insert, update on public.crm_growth_partners, public.crm_leads,
  public.crm_tasks, public.crm_cases to authenticated;
grant insert on public.crm_attribution_touchpoints, public.crm_audit_events to authenticated;

comment on table public.crm_leads is
  'CRM prospect contact data only. Raw identity documents and financial account data must remain with the regulated partner.';
comment on table public.crm_cases is
  'Operational case metadata and partner references only. Do not store payment credentials, full account numbers or identity documents.';
comment on table public.crm_audit_events is
  'Append-only CRM audit history; corrections are new events, not edits.';
comment on table public.crm_staff_members is
  'CRM role grants are provisioned by a database administrator only. No end-user self-enrolment.';
