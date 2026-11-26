-- Correct CRM audit entity mapping to match the constrained audit entity types.
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
  v_entity_type text;
begin
  if v_actor is null then
    raise exception 'CRM_AUTHENTICATED_ACTOR_REQUIRED';
  end if;

  case tg_table_name
    when 'crm_leads' then
      v_entity_type := 'lead';
      v_details := jsonb_build_object('stage', new.stage, 'source', new.source, 'country_code', new.country_code);
    when 'crm_tasks' then
      v_entity_type := 'task';
      v_details := jsonb_build_object('status', new.status, 'priority', new.priority);
    when 'crm_cases' then
      v_entity_type := 'case';
      v_details := jsonb_build_object('category', new.category, 'status', new.status, 'priority', new.priority);
    when 'crm_growth_partners' then
      v_entity_type := 'growth_partner';
      v_details := jsonb_build_object('partner_type', new.partner_type, 'status', new.status, 'country_code', new.country_code);
    when 'crm_attribution_touchpoints' then
      v_entity_type := 'attribution';
      v_details := jsonb_build_object('touchpoint_type', new.touchpoint_type, 'source', new.source, 'medium', new.medium, 'campaign', new.campaign);
    else
      raise exception 'CRM_AUDIT_UNSUPPORTED_ENTITY';
  end case;

  insert into public.crm_audit_events (
    workspace_id, actor_id, action, entity_type, entity_id, details
  ) values (
    new.workspace_id, v_actor, tg_table_name || '_' || v_action,
    v_entity_type, new.id, v_details
  );

  return new;
end;
$audit$;
revoke all on function private.crm_write_audit_event() from public, anonymous, authenticated;
