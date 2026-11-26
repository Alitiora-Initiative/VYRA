-- Tighten CRM controls after review.
-- Audit events are inserted only by SECURITY DEFINER audit triggers.
-- Partner approval is not a staff-editable CRM field.

drop policy if exists crm_audit_insert on public.crm_audit_events;
revoke insert, update, delete on public.crm_audit_events from public, anonymous, authenticated;

drop policy if exists crm_growth_partner_update on public.crm_growth_partners;
revoke update on public.crm_growth_partners from public, anonymous, authenticated;

drop policy if exists crm_task_update on public.crm_tasks;
create policy crm_task_update on public.crm_tasks
  for update to authenticated using (
    private.crm_has_workspace_role(workspace_id, array['admin','operations'])
    or (
      assigned_to = auth.uid()
      and private.crm_has_workspace_role(workspace_id, array[
        'sales','support','compliance','finance','dealing','partner_manager'
      ])
    )
  ) with check (
    private.crm_has_workspace_role(workspace_id, array['admin','operations'])
    or (
      assigned_to = auth.uid()
      and private.crm_has_workspace_role(workspace_id, array[
        'sales','support','compliance','finance','dealing','partner_manager'
      ])
    )
  );

drop policy if exists crm_task_insert on public.crm_tasks;
create policy crm_task_insert on public.crm_tasks
  for insert to authenticated with check (
    private.crm_has_workspace_role(workspace_id, array[
      'admin','sales','support','compliance','finance','dealing','operations','partner_manager'
    ])
    and created_by = auth.uid()
  );
