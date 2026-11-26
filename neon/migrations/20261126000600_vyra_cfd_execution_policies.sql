-- Versioned brokerage operating-model and risk-transfer policies.
-- No policies are seeded. No client-facing role can read or change this table.
create table if not exists public.cfd_execution_policies (
  id uuid primary key default gen_random_uuid(),
  country_code char(2) not null,
  client_type text not null check (client_type in ('retail','sophisticated','professional','institutional')),
  policy_version text not null check (length(trim(policy_version)) between 1 and 80),
  operating_model text not null check (operating_model in (
    'technology_partner','agency_routed','matched_principal','market_maker','hybrid'
  )),
  agency_routing_permitted boolean not null default false,
  external_venue_approved boolean not null default false,
  principal_permitted boolean not null default false,
  matched_principal_permitted boolean not null default false,
  dealing_permitted boolean not null default false,
  external_hedging_permitted boolean not null default false,
  best_execution_policy_version text,
  conflicts_policy_version text,
  hedge_mode text check (hedge_mode is null or hedge_mode in (
    'straight_through','systematic_net_residual','partial_internalisation','risk_warehousing'
  )),
  hedge_trigger_exposure numeric(28,8) check (hedge_trigger_exposure is null or hedge_trigger_exposure > 0),
  hedge_ratio numeric(12,8) check (hedge_ratio is null or hedge_ratio between 0 and 1),
  internalisation_ratio numeric(12,8) check (internalisation_ratio is null or internalisation_ratio between 0 and 1),
  max_retained_exposure numeric(28,8) check (max_retained_exposure is null or max_retained_exposure > 0),
  evidence_url text not null check (evidence_url like 'https://%'),
  evidence_reference text not null check (length(trim(evidence_reference)) between 2 and 240),
  reviewed_at timestamptz not null,
  effective_from timestamptz not null,
  effective_until timestamptz,
  status text not null default 'draft' check (status in ('draft','approved','suspended','expired')),
  approved_by uuid references neon_auth."user"(id) on delete restrict,
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  check (effective_until is null or effective_until > effective_from),
  check (
    status <> 'approved'
    or (approved_by is not null and approved_at is not null and reviewed_at <= approved_at)
  ),
  check (
    operating_model <> 'technology_partner'
    or (
      agency_routing_permitted = false
      and principal_permitted = false
      and matched_principal_permitted = false
      and dealing_permitted = false
      and external_hedging_permitted = false
    )
  ),
  check (
    operating_model <> 'agency_routed'
    or (agency_routing_permitted = true and external_venue_approved = true)
  ),
  check (
    operating_model <> 'matched_principal'
    or (
      principal_permitted = true
      and matched_principal_permitted = true
      and best_execution_policy_version is not null
      and conflicts_policy_version is not null
    )
  ),
  check (
    operating_model <> 'market_maker'
    or (
      principal_permitted = true
      and dealing_permitted = true
      and conflicts_policy_version is not null
    )
  ),
  check (
    operating_model <> 'hybrid'
    or (
      principal_permitted = true
      and dealing_permitted = true
      and agency_routing_permitted = true
      and external_venue_approved = true
      and external_hedging_permitted = true
      and best_execution_policy_version is not null
      and conflicts_policy_version is not null
      and max_retained_exposure is not null
    )
  ),
  check (
    hedge_mode is null
    or (
      hedge_mode = 'straight_through'
      and agency_routing_permitted = true
      and external_venue_approved = true
    )
    or (
      hedge_mode = 'systematic_net_residual'
      and principal_permitted = true
      and dealing_permitted = true
      and external_hedging_permitted = true
      and hedge_trigger_exposure is not null
      and hedge_ratio is not null
      and hedge_ratio > 0
      and max_retained_exposure is not null
    )
    or (
      hedge_mode = 'partial_internalisation'
      and principal_permitted = true
      and dealing_permitted = true
      and external_hedging_permitted = true
      and internalisation_ratio is not null
      and max_retained_exposure is not null
    )
    or (
      hedge_mode = 'risk_warehousing'
      and principal_permitted = true
      and dealing_permitted = true
      and conflicts_policy_version is not null
      and max_retained_exposure is not null
    )
  )
);

create index if not exists cfd_execution_policy_lookup_idx
  on public.cfd_execution_policies(country_code, client_type, status, effective_from desc);
create unique index if not exists cfd_execution_policy_version_unique
  on public.cfd_execution_policies(country_code, client_type, policy_version);

alter table public.cfd_execution_policies enable row level security;
revoke all on public.cfd_execution_policies from public, anonymous, authenticated;

comment on table public.cfd_execution_policies is
  'Evidence-backed country and client-type brokerage operating model, execution and hedge permissions. Empty by default; no client-facing grants.';
