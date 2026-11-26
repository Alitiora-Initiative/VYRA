-- Paper-only CFD accounts, lifecycle events, margin reservations and double-entry journals.
-- No real client funds, deposits, withdrawals, LP credentials or live order routes are created.
-- Every table is private to trusted server-side operations; no client-role grants are made.

create table if not exists public.paper_cfd_accounts (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references neon_auth."user"(id) on delete restrict,
  account_number text not null unique check (length(trim(account_number)) between 4 and 40),
  account_mode text not null default 'paper' check (account_mode = 'paper'),
  base_currency char(3) not null check (base_currency ~ '^[A-Z]{3}$'),
  status text not null default 'active' check (status in ('active','suspended','closed')),
  closeout_level_pct numeric(12,6) not null check (closeout_level_pct >= 0),
  opening_balance numeric(28,8) not null default 0 check (opening_balance >= 0),
  policy_id uuid,
  policy_version text,
  created_at timestamptz not null default now(),
  created_by uuid references neon_auth."user"(id) on delete restrict,
  closed_at timestamptz,
  check ((status = 'closed' and closed_at is not null) or (status <> 'closed' and closed_at is null))
);
create index if not exists paper_cfd_accounts_owner_idx
  on public.paper_cfd_accounts(owner_user_id, status, created_at desc);

create table if not exists public.paper_cfd_orders (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.paper_cfd_accounts(id) on delete restrict,
  client_order_id text,
  idempotency_key text not null,
  request_fingerprint char(64) not null check (request_fingerprint ~ '^[a-f0-9]{64}$'),
  contract_code text not null check (length(trim(contract_code)) between 1 and 80),
  side text not null check (side in ('buy','sell')),
  order_type text not null check (order_type in ('market','limit')),
  limit_price numeric(28,12),
  lots numeric(28,8) not null check (lots > 0),
  filled_lots numeric(28,8) not null default 0 check (filled_lots >= 0),
  remaining_lots numeric(28,8) not null check (remaining_lots >= 0),
  requested_leverage numeric(12,6) not null check (requested_leverage > 0),
  reference_price numeric(28,12) not null check (reference_price > 0),
  average_fill_price numeric(28,12),
  initial_margin numeric(28,8) not null check (initial_margin >= 0),
  margin_remaining numeric(28,8) not null default 0 check (margin_remaining >= 0),
  estimated_fee_remaining numeric(28,8) not null default 0 check (estimated_fee_remaining >= 0),
  reserved_amount_remaining numeric(28,8) not null default 0 check (reserved_amount_remaining >= 0),
  max_execution_deviation_bps numeric(12,6) not null check (max_execution_deviation_bps > 0),
  quote_source text not null,
  quote_observed_at timestamptz not null,
  policy_id uuid,
  policy_version text,
  status text not null check (status in ('accepted','partially_filled','filled','cancelled','expired','rejected')),
  expires_at timestamptz,
  terminal_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (filled_lots + remaining_lots = lots),
  check ((order_type = 'limit' and limit_price > 0) or (order_type = 'market' and limit_price is null)),
  unique (account_id, idempotency_key),
  unique (account_id, client_order_id)
);
create index if not exists paper_cfd_orders_account_status_idx
  on public.paper_cfd_orders(account_id, status, created_at desc);
create index if not exists paper_cfd_orders_instrument_idx
  on public.paper_cfd_orders(contract_code, created_at desc);

create table if not exists public.paper_cfd_margin_reservations (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.paper_cfd_accounts(id) on delete restrict,
  order_id uuid not null unique references public.paper_cfd_orders(id) on delete restrict,
  currency char(3) not null check (currency ~ '^[A-Z]{3}$'),
  initial_amount numeric(28,8) not null check (initial_amount >= 0),
  remaining_amount numeric(28,8) not null check (remaining_amount >= 0),
  status text not null check (status in ('active','released','consumed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (remaining_amount <= initial_amount),
  check ((status = 'active' and remaining_amount > 0) or (status in ('released','consumed') and remaining_amount = 0))
);
create index if not exists paper_cfd_reservations_account_idx
  on public.paper_cfd_margin_reservations(account_id, status);

create table if not exists public.paper_cfd_positions (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.paper_cfd_accounts(id) on delete restrict,
  order_id uuid not null references public.paper_cfd_orders(id) on delete restrict,
  fill_id text not null,
  contract_code text not null,
  side text not null check (side in ('long','short')),
  lots numeric(28,8) not null check (lots > 0),
  contract_size numeric(28,8) not null check (contract_size > 0),
  entry_price numeric(28,12) not null check (entry_price > 0),
  margin_required numeric(28,8) not null check (margin_required >= 0),
  unrealized_pnl numeric(28,8) not null default 0,
  status text not null default 'open' check (status in ('open','closed')),
  opened_at timestamptz not null default now(),
  closed_at timestamptz,
  unique (account_id, fill_id),
  check ((status = 'open' and closed_at is null) or (status = 'closed' and closed_at is not null))
);
create index if not exists paper_cfd_positions_open_idx
  on public.paper_cfd_positions(account_id, status, contract_code);

create table if not exists public.paper_cfd_ledger_journals (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.paper_cfd_accounts(id) on delete restrict,
  idempotency_key text not null,
  reference_type text not null,
  reference_id text not null,
  currency char(3) not null check (currency ~ '^[A-Z]{3}$'),
  status text not null default 'draft' check (status in ('draft','posted','reversed')),
  debit_total numeric(28,8) not null default 0 check (debit_total >= 0),
  credit_total numeric(28,8) not null default 0 check (credit_total >= 0),
  created_at timestamptz not null default now(),
  posted_at timestamptz,
  unique (account_id, idempotency_key),
  check ((status = 'posted' and posted_at is not null) or (status <> 'posted' and posted_at is null))
);
create index if not exists paper_cfd_journals_account_idx
  on public.paper_cfd_ledger_journals(account_id, created_at desc);

create table if not exists public.paper_cfd_ledger_entries (
  id uuid primary key default gen_random_uuid(),
  journal_id uuid not null references public.paper_cfd_ledger_journals(id) on delete restrict,
  line_number integer not null check (line_number > 0),
  account_code text not null check (account_code in (
    'paper_cash','paper_equity','paper_trading_fees','paper_realised_pnl','paper_financing','paper_adjustments'
  )),
  debit numeric(28,8) not null default 0 check (debit >= 0),
  credit numeric(28,8) not null default 0 check (credit >= 0),
  currency char(3) not null check (currency ~ '^[A-Z]{3}$'),
  created_at timestamptz not null default now(),
  unique (journal_id, line_number),
  check ((debit > 0 and credit = 0) or (credit > 0 and debit = 0))
);
create index if not exists paper_cfd_ledger_entries_journal_idx
  on public.paper_cfd_ledger_entries(journal_id, line_number);

create table if not exists public.paper_cfd_order_events (
  event_id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.paper_cfd_accounts(id) on delete restrict,
  order_id uuid references public.paper_cfd_orders(id) on delete restrict,
  account_sequence bigint not null check (account_sequence > 0),
  event_type text not null,
  idempotency_key text not null,
  event_payload jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null,
  previous_hash char(64) not null check (previous_hash ~ '^[a-f0-9]{64}$'),
  event_hash char(64) not null check (event_hash ~ '^[a-f0-9]{64}$'),
  created_at timestamptz not null default now(),
  unique (account_id, account_sequence),
  unique (account_id, idempotency_key)
);
create index if not exists paper_cfd_order_events_order_idx
  on public.paper_cfd_order_events(order_id, account_sequence);

create table if not exists public.paper_cfd_idempotency (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.paper_cfd_accounts(id) on delete restrict,
  idempotency_key text not null,
  command_type text not null,
  request_fingerprint char(64) not null check (request_fingerprint ~ '^[a-f0-9]{64}$'),
  result_payload jsonb not null,
  created_at timestamptz not null default now(),
  unique (account_id, idempotency_key)
);

create table if not exists public.paper_cfd_reconciliation_runs (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.paper_cfd_accounts(id) on delete restrict,
  source_reference text not null,
  status text not null check (status in ('passed','failed','blocked')),
  ledger_cash_balance numeric(28,8) not null,
  position_margin numeric(28,8) not null,
  pending_order_margin numeric(28,8) not null,
  free_margin numeric(28,8) not null,
  difference numeric(28,8) not null default 0,
  details jsonb not null default '{}'::jsonb,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  check (completed_at is null or completed_at >= started_at)
);
create index if not exists paper_cfd_reconciliation_account_idx
  on public.paper_cfd_reconciliation_runs(account_id, started_at desc);

-- Ledger entries may only be added while the journal is draft. Posted journals are immutable.
create or replace function private.guard_paper_cfd_ledger_entry()
returns trigger
language plpgsql
set search_path = ''
as $paper_ledger$
declare
  v_status text;
begin
  if tg_op in ('UPDATE','DELETE') then
    raise exception 'PAPER_CFD_LEDGER_ENTRIES_APPEND_ONLY';
  end if;
  select status into v_status
  from public.paper_cfd_ledger_journals
  where id = new.journal_id
  for update;
  if v_status is distinct from 'draft' then
    raise exception 'PAPER_CFD_JOURNAL_NOT_DRAFT';
  end if;
  return new;
end;
$paper_ledger$;

create or replace function private.guard_paper_cfd_posted_journal()
returns trigger
language plpgsql
set search_path = ''
as $paper_ledger$
begin
  if old.status = 'posted' then
    raise exception 'PAPER_CFD_POSTED_JOURNAL_IMMUTABLE';
  end if;
  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$paper_ledger$;

create or replace function private.assert_paper_cfd_journal_balanced()
returns trigger
language plpgsql
set search_path = ''
as $paper_ledger$
declare
  v_journal_id uuid;
  v_status text;
  v_count integer;
  v_currency_count integer;
  v_debits numeric(28,8);
  v_credits numeric(28,8);
begin
  v_journal_id := case when tg_table_name = 'paper_cfd_ledger_journals' then new.id else new.journal_id end;
  select status into v_status
  from public.paper_cfd_ledger_journals
  where id = v_journal_id;
  if v_status is distinct from 'posted' then
    return null;
  end if;

  select count(*), count(distinct currency), coalesce(sum(debit),0), coalesce(sum(credit),0)
    into v_count, v_currency_count, v_debits, v_credits
  from public.paper_cfd_ledger_entries
  where journal_id = v_journal_id;

  if v_count < 2 or v_currency_count <> 1 or v_debits <> v_credits then
    raise exception 'PAPER_CFD_JOURNAL_NOT_BALANCED';
  end if;
  return null;
end;
$paper_ledger$;

create or replace function private.prevent_paper_cfd_audit_mutation()
returns trigger
language plpgsql
set search_path = ''
as $paper_ledger$
begin
  raise exception 'PAPER_CFD_AUDIT_RECORDS_APPEND_ONLY';
end;
$paper_ledger$;

drop trigger if exists paper_cfd_ledger_entries_guard on public.paper_cfd_ledger_entries;
create trigger paper_cfd_ledger_entries_guard
before insert or update or delete on public.paper_cfd_ledger_entries
for each row execute function private.guard_paper_cfd_ledger_entry();

drop trigger if exists paper_cfd_journals_guard on public.paper_cfd_ledger_journals;
create trigger paper_cfd_journals_guard
before update or delete on public.paper_cfd_ledger_journals
for each row execute function private.guard_paper_cfd_posted_journal();

drop trigger if exists paper_cfd_journals_balance_check on public.paper_cfd_ledger_journals;
create constraint trigger paper_cfd_journals_balance_check
after update of status on public.paper_cfd_ledger_journals
deferrable initially deferred
for each row execute function private.assert_paper_cfd_journal_balanced();

drop trigger if exists paper_cfd_entries_balance_check on public.paper_cfd_ledger_entries;
create constraint trigger paper_cfd_entries_balance_check
after insert on public.paper_cfd_ledger_entries
deferrable initially deferred
for each row execute function private.assert_paper_cfd_journal_balanced();

drop trigger if exists paper_cfd_events_immutable on public.paper_cfd_order_events;
create trigger paper_cfd_events_immutable
before update or delete on public.paper_cfd_order_events
for each row execute function private.prevent_paper_cfd_audit_mutation();

drop trigger if exists paper_cfd_idempotency_immutable on public.paper_cfd_idempotency;
create trigger paper_cfd_idempotency_immutable
before update or delete on public.paper_cfd_idempotency
for each row execute function private.prevent_paper_cfd_audit_mutation();

revoke all on function private.guard_paper_cfd_ledger_entry() from public, anonymous, authenticated;
revoke all on function private.guard_paper_cfd_posted_journal() from public, anonymous, authenticated;
revoke all on function private.assert_paper_cfd_journal_balanced() from public, anonymous, authenticated;
revoke all on function private.prevent_paper_cfd_audit_mutation() from public, anonymous, authenticated;

alter table public.paper_cfd_accounts enable row level security;
alter table public.paper_cfd_orders enable row level security;
alter table public.paper_cfd_margin_reservations enable row level security;
alter table public.paper_cfd_positions enable row level security;
alter table public.paper_cfd_ledger_journals enable row level security;
alter table public.paper_cfd_ledger_entries enable row level security;
alter table public.paper_cfd_order_events enable row level security;
alter table public.paper_cfd_idempotency enable row level security;
alter table public.paper_cfd_reconciliation_runs enable row level security;

revoke all on public.paper_cfd_accounts from public, anonymous, authenticated;
revoke all on public.paper_cfd_orders from public, anonymous, authenticated;
revoke all on public.paper_cfd_margin_reservations from public, anonymous, authenticated;
revoke all on public.paper_cfd_positions from public, anonymous, authenticated;
revoke all on public.paper_cfd_ledger_journals from public, anonymous, authenticated;
revoke all on public.paper_cfd_ledger_entries from public, anonymous, authenticated;
revoke all on public.paper_cfd_order_events from public, anonymous, authenticated;
revoke all on public.paper_cfd_idempotency from public, anonymous, authenticated;
revoke all on public.paper_cfd_reconciliation_runs from public, anonymous, authenticated;

comment on table public.paper_cfd_accounts is
  'Paper-only CFD simulation accounts; no real deposits, withdrawals, customer money or live execution.';
comment on table public.paper_cfd_orders is
  'Paper CFD order state. Execution is simulated and must not be sent to a venue.';
comment on table public.paper_cfd_margin_reservations is
  'Per-order paper margin and fee reservation with explicit release/consumption state.';
comment on table public.paper_cfd_positions is
  'Paper position lots created only from recorded simulated fills.';
comment on table public.paper_cfd_ledger_journals is
  'Balanced double-entry simulation journal; posted records are immutable and corrected by reversal.';
comment on table public.paper_cfd_order_events is
  'Append-only, account-sequenced, hash-chained paper CFD order event history.';
comment on table public.paper_cfd_idempotency is
  'Append-only command deduplication records scoped to a paper CFD account.';
comment on table public.paper_cfd_reconciliation_runs is
  'Immutable-style operational snapshots of account cash, margin and reservation reconciliation.';
