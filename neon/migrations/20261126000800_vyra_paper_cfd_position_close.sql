-- Extend paper CFD positions for lifecycle-safe partial/full closure.
-- Adds only paper simulation records; no live account or venue capability.

alter table public.paper_cfd_orders
  add column if not exists contract_size numeric(28,8) not null check (contract_size > 0),
  add column if not exists min_lots numeric(28,8) not null check (min_lots > 0),
  add column if not exists lot_step numeric(28,8) not null check (lot_step > 0),
  add column if not exists tick_size numeric(28,12) not null check (tick_size > 0),
  add column if not exists account_currency_rate numeric(28,12) not null check (account_currency_rate > 0);

alter table public.paper_cfd_positions
  add column if not exists remaining_lots numeric(28,8) not null default 0,
  add column if not exists closed_lots numeric(28,8) not null default 0,
  add column if not exists initial_margin numeric(28,8) not null default 0,
  add column if not exists margin_released numeric(28,8) not null default 0,
  add column if not exists min_lots numeric(28,8) not null default 0.01,
  add column if not exists lot_step numeric(28,8) not null default 0.01,
  add column if not exists tick_size numeric(28,12) not null default 0.00001,
  add column if not exists account_currency_rate numeric(28,12) not null default 1,
  add column if not exists max_execution_deviation_bps numeric(12,6) not null default 25,
  add column if not exists max_quote_age_ms integer not null default 5000,
  add column if not exists updated_at timestamptz not null default now(),
  add constraint paper_cfd_positions_remaining_lots_check
    check (remaining_lots >= 0 and remaining_lots <= lots),
  add constraint paper_cfd_positions_closed_lots_check
    check (closed_lots >= 0 and closed_lots <= lots),
  add constraint paper_cfd_positions_lot_balance_check
    check (remaining_lots + closed_lots = lots),
  add constraint paper_cfd_positions_margin_balance_check
    check (initial_margin = margin_required + margin_released),
  add constraint paper_cfd_positions_contract_limits_check
    check (min_lots > 0 and lot_step > 0 and tick_size > 0
      and account_currency_rate > 0 and max_execution_deviation_bps > 0
      and max_quote_age_ms > 0),
  add constraint paper_cfd_positions_status_quantity_check
    check ((status = 'open' and remaining_lots > 0)
      or (status = 'closed' and remaining_lots = 0 and closed_lots = lots));

create table if not exists public.paper_cfd_position_closes (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.paper_cfd_accounts(id) on delete restrict,
  position_id uuid not null references public.paper_cfd_positions(id) on delete restrict,
  order_id uuid not null references public.paper_cfd_orders(id) on delete restrict,
  close_id text not null,
  idempotency_key text not null,
  request_fingerprint char(64) not null check (request_fingerprint ~ '^[a-f0-9]{64}$'),
  event_id uuid not null,
  lots numeric(28,8) not null check (lots > 0),
  close_price numeric(28,12) not null check (close_price > 0),
  close_reference_price numeric(28,12) not null check (close_reference_price > 0),
  quote_source text not null,
  quote_observed_at timestamptz not null,
  execution_source text not null,
  execution_observed_at timestamptz not null,
  external_execution_id text,
  venue_id text,
  realised_pnl numeric(28,8) not null,
  fee_amount numeric(28,8) not null default 0 check (fee_amount >= 0),
  released_margin numeric(28,8) not null check (released_margin >= 0),
  currency char(3) not null check (currency ~ '^[A-Z]{3}$'),
  pnl_journal_id uuid references public.paper_cfd_ledger_journals(id) on delete restrict,
  fee_journal_id uuid references public.paper_cfd_ledger_journals(id) on delete restrict,
  closed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (account_id, close_id),
  unique (account_id, idempotency_key),
  foreign key (event_id) references public.paper_cfd_order_events(event_id)
    on delete restrict deferrable initially deferred,
  check ((abs(realised_pnl) < 0.00000001 and pnl_journal_id is null)
    or (abs(realised_pnl) >= 0.00000001 and pnl_journal_id is not null)),
  check ((fee_amount = 0 and fee_journal_id is null)
    or (fee_amount > 0 and fee_journal_id is not null))
);
create index if not exists paper_cfd_position_closes_position_idx
  on public.paper_cfd_position_closes(position_id, closed_at desc);
create index if not exists paper_cfd_position_closes_account_idx
  on public.paper_cfd_position_closes(account_id, closed_at desc);

-- A journal must start in draft. Posting is permitted only through a later
-- transition so the deferred debit/credit assertion can inspect its final lines.
create or replace function private.guard_paper_cfd_posted_journal()
returns trigger
language plpgsql
set search_path = ''
as $paper_ledger$
begin
  if tg_op = 'INSERT' then
    if new.status <> 'draft' then
      raise exception 'PAPER_CFD_JOURNAL_MUST_START_DRAFT';
    end if;
    return new;
  end if;

  if old.status = 'posted' then
    raise exception 'PAPER_CFD_POSTED_JOURNAL_IMMUTABLE';
  end if;
  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$paper_ledger$;

drop trigger if exists paper_cfd_journals_guard on public.paper_cfd_ledger_journals;
create trigger paper_cfd_journals_guard
before insert or update or delete on public.paper_cfd_ledger_journals
for each row execute function private.guard_paper_cfd_posted_journal();

create or replace function private.prevent_paper_cfd_audit_mutation()
returns trigger
language plpgsql
set search_path = ''
as $paper_ledger$
begin
  raise exception 'PAPER_CFD_AUDIT_RECORDS_APPEND_ONLY';
end;
$paper_ledger$;

drop trigger if exists paper_cfd_position_closes_immutable on public.paper_cfd_position_closes;
create trigger paper_cfd_position_closes_immutable
before update or delete on public.paper_cfd_position_closes
for each row execute function private.prevent_paper_cfd_audit_mutation();

revoke all on function private.guard_paper_cfd_posted_journal() from public, anonymous, authenticated;
revoke all on function private.prevent_paper_cfd_audit_mutation() from public, anonymous, authenticated;

alter table public.paper_cfd_position_closes enable row level security;
revoke all on public.paper_cfd_position_closes from public, anonymous, authenticated;

comment on table public.paper_cfd_position_closes is
  'Append-only paper CFD position closure slices with price evidence, realised P&L and fee-journal references.';
