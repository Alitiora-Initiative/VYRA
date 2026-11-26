-- VYRA Forex/CFD contract and regulatory margin reference foundation.
-- No demo instruments, market quotes, margin rules, or production routes are seeded.
-- The tables below are reference data only. They do not enable live execution.

create table if not exists public.cfd_contracts (
  id uuid primary key default gen_random_uuid(),
  contract_code text not null unique check (length(trim(contract_code)) between 2 and 64),
  display_name text not null check (length(trim(display_name)) between 2 and 120),
  underlying_symbol text not null check (length(trim(underlying_symbol)) between 1 and 40),
  asset_class text not null check (asset_class in ('forex','index','equity','commodity','crypto')),
  contract_size numeric(28,10) not null check (contract_size > 0),
  min_lots numeric(18,8) not null check (min_lots > 0),
  max_lots numeric(18,8) not null check (max_lots >= min_lots),
  lot_step numeric(18,8) not null check (lot_step > 0),
  tick_size numeric(24,12) not null check (tick_size > 0),
  tick_value numeric(24,10) check (tick_value is null or tick_value > 0),
  quote_currency char(3) not null,
  margin_currency char(3) not null,
  max_provider_leverage numeric(12,4) not null check (max_provider_leverage > 0),
  swap_long_points numeric(24,10),
  swap_short_points numeric(24,10),
  triple_swap_day smallint check (triple_swap_day between 0 and 6),
  trading_timezone text,
  trading_hours_reference text,
  provider_symbol text not null check (length(trim(provider_symbol)) between 1 and 80),
  provider_name text not null check (length(trim(provider_name)) between 2 and 120),
  contract_source_url text check (contract_source_url is null or contract_source_url like 'https://%'),
  is_enabled boolean not null default false,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists cfd_contracts_asset_enabled_idx
  on public.cfd_contracts(asset_class, is_enabled, contract_code);

create table if not exists public.cfd_quotes (
  contract_id uuid primary key references public.cfd_contracts(id) on delete restrict,
  bid numeric(28,12) not null check (bid > 0),
  ask numeric(28,12) not null check (ask >= bid),
  source_provider text not null check (length(trim(source_provider)) between 2 and 120),
  quote_kind text not null default 'indicative' check (quote_kind in ('indicative','executable')),
  observed_at timestamptz not null,
  updated_at timestamptz not null default now()
);
create index if not exists cfd_quotes_observed_idx on public.cfd_quotes(observed_at desc);

create or replace function private.cfd_keep_latest_quote()
returns trigger
language plpgsql
security definer
set search_path = ''
as $cfd$
begin
  if tg_op = 'UPDATE' and old.observed_at > new.observed_at then
    return old;
  end if;
  new.updated_at := now();
  return new;
end;
$cfd$;
revoke all on function private.cfd_keep_latest_quote() from public, anonymous, authenticated;

drop trigger if exists cfd_quotes_keep_latest on public.cfd_quotes;
create trigger cfd_quotes_keep_latest
before insert or update on public.cfd_quotes
for each row execute function private.cfd_keep_latest_quote();

-- A rule is approved for one exact country, client category, contract and notional tier.
-- There is intentionally no fallback/global rule: missing or stale policy means block.
create table if not exists public.cfd_margin_policies (
  id uuid primary key default gen_random_uuid(),
  contract_id uuid not null references public.cfd_contracts(id) on delete restrict,
  country_code char(2) not null,
  client_type text not null check (client_type in ('retail','sophisticated','professional','institutional')),
  notional_tier_min numeric(28,8) not null default 0 check (notional_tier_min >= 0),
  notional_tier_max numeric(28,8) check (notional_tier_max is null or notional_tier_max > notional_tier_min),
  max_leverage numeric(12,4) not null check (max_leverage > 0),
  margin_call_level_pct numeric(12,4) check (margin_call_level_pct is null or margin_call_level_pct > 0),
  closeout_level_pct numeric(12,4) not null check (closeout_level_pct >= 0),
  negative_balance_protection_required boolean not null,
  retail_inducements_permitted boolean not null,
  risk_warning_version text not null check (length(trim(risk_warning_version)) between 2 and 80),
  source_url text not null check (source_url like 'https://%'),
  source_reference text not null check (length(trim(source_reference)) between 2 and 180),
  reviewed_at timestamptz not null,
  effective_from timestamptz not null,
  effective_until timestamptz,
  status text not null default 'draft' check (status in ('draft','approved','suspended','expired')),
  approved_by uuid references neon_auth."user"(id) on delete restrict,
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  check (effective_until is null or effective_until > effective_from),
  check (
    (status = 'approved' and approved_by is not null and approved_at is not null)
    or status <> 'approved'
  )
);
create index if not exists cfd_margin_policy_lookup_idx
  on public.cfd_margin_policies(contract_id, country_code, client_type, status, effective_from desc);
create unique index if not exists cfd_margin_policy_approved_tier_unique
  on public.cfd_margin_policies(contract_id, country_code, client_type, notional_tier_min)
  where status = 'approved';

alter table public.cfd_contracts enable row level security;
alter table public.cfd_quotes enable row level security;
alter table public.cfd_margin_policies enable row level security;

drop policy if exists cfd_enabled_contracts_read on public.cfd_contracts;
create policy cfd_enabled_contracts_read on public.cfd_contracts
  for select to anonymous, authenticated using (is_enabled = true);

drop policy if exists cfd_fresh_quotes_read on public.cfd_quotes;
create policy cfd_fresh_quotes_read on public.cfd_quotes
  for select to anonymous, authenticated using (
    observed_at >= now() - interval '30 seconds'
    and observed_at <= now() + interval '30 seconds'
    and exists (
      select 1 from public.cfd_contracts c
      where c.id = contract_id and c.is_enabled = true
    )
  );

-- cfd_margin_policies has no client-facing grants or policies. Only a controlled
-- server/database-admin release process may maintain country-specific policy.
grant select on public.cfd_contracts, public.cfd_quotes to anonymous, authenticated;
revoke all on public.cfd_margin_policies from public, anonymous, authenticated;

comment on table public.cfd_contracts is
  'Provider-sourced CFD contract specifications. Disabled by default; no instruments are seeded.';
comment on table public.cfd_quotes is
  'Latest source-labelled CFD bid/ask quote. Indicative by default and never proof of executable liquidity.';
comment on table public.cfd_margin_policies is
  'Country × client type × contract margin policies. No generic fallback; only dated, evidence-reviewed rules may be approved.';
