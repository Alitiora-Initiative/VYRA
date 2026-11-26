-- Add append-only audit records for all CRM operational mutations.
-- PII is intentionally excluded from audit payloads.

create or replace function private.crm_write_audit_event()
returns trigger
language plpgsql
security definer
set search_path = ''
as $audit$
declare
  v_actor uuid := auth.uid();
  v_details jsonb := '{}'::jsonb;
  v_action text := lower(tg_op);
begin
  if v_actor is null then
    raise exception 'CRM_AUTHENTICATED_ACTOR_REQUIRED';
  end if;

  if tg_table_name = 'crm_leads' then
    v_details := jsonb_build_object(
      'stage', new.stage,
      'source', new.source,
      'country_code', new.country_code
    );
  elsif tg_table_name = 'crm_tasks' then
    v_details := jsonb_build_object(
      'status', new.status,
      'priority', new.priority
    );
  elsif tg_table_name = 'crm_cases' then
    v_details := jsonb_build_object(
      'category', new.category,
      'status', new.status,
      'priority', new.priority
    );
  elsif tg_table_name = 'crm_growth_partners' then
    v_details := jsonb_build_object(
      'partner_type', new.partner_type,
      'status', new.status,
      'country_code', new.country_code
    );
  elsif tg_table_name = 'crm_attribution_touchpoints' then
    v_details := jsonb_build_object(
      'touchpoint_type', new.touchpoint_type,
      'source', new.source,
      'medium', new.medium,
      'campaign', new.campaign
    );
  end if;

  insert into public.crm_audit_events (
    workspace_id, actor_id, action, entity_type, entity_id, details
  ) values (
    new.workspace_id,
    v_actor,
    tg_table_name || '_' || v_action,
    replace(tg_table_name, 'crm_', ''),
    new.id,
    v_details
  );

  return new;
end;
$audit$;

revoke all on function private.crm_write_audit_event() from public, anonymous, authenticated;

drop trigger if exists crm_leads_audit on public.crm_leads;
create trigger crm_leads_audit
after insert or update on public.crm_leads
for each row execute function private.crm_write_audit_event();

drop trigger if exists crm_tasks_audit on public.crm_tasks;
create trigger crm_tasks_audit
after insert or update on public.crm_tasks
for each row execute function private.crm_write_audit_event();

drop trigger if exists crm_cases_audit on public.crm_cases;
create trigger crm_cases_audit
after insert or update on public.crm_cases
for each row execute function private.crm_write_audit_event();

drop trigger if exists crm_growth_partners_audit on public.crm_growth_partners;
create trigger crm_growth_partners_audit
after insert or update on public.crm_growth_partners
for each row execute function private.crm_write_audit_event();

drop trigger if exists crm_attribution_audit on public.crm_attribution_touchpoints;
create trigger crm_attribution_audit
after insert or update on public.crm_attribution_touchpoints
for each row execute function private.crm_write_audit_event();
