-- VYRA Access Graph, Provider Graph and Sentinel evidence store.
-- Additive migration. No existing paper trading, account, order or ledger tables are changed.

create table if not exists public.regulatory_sources (
  source_id text primary key,
  jurisdiction_code text not null,
  authority text not null,
  title text not null,
  published_or_updated text,
  source_url text not null check (source_url like 'https://%'),
  provisions text[] not null default '{}',
  summary text not null,
  limitations text not null,
  source_status text not null default 'needs_counsel_review'
    check (source_status in ('needs_counsel_review', 'verified_by_counsel', 'stale', 'superseded', 'withdrawn')),
  source_sha256 text,
  last_verified_at timestamptz,
  last_verified_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.access_rule_packs (
  id uuid primary key default gen_random_uuid(),
  jurisdiction_code text not null,
  version text not null,
  status text not null default 'draft'
    check (status in ('draft', 'demo_published', 'active', 'superseded')),
  legal_review_status text not null default 'not_reviewed'
    check (legal_review_status in ('not_reviewed', 'counsel_review_pending', 'counsel_approved', 'withdrawn')),
  effective_from date,
  effective_until date,
  reviewed_at timestamptz,
  reviewed_by text,
  notes text not null default '',
  created_at timestamptz not null default now(),
  unique (jurisdiction_code, version),
  check (effective_until is null or effective_from is null or effective_until >= effective_from)
);

create unique index if not exists access_rule_packs_current_jurisdiction_idx
  on public.access_rule_packs (jurisdiction_code)
  where status in ('demo_published', 'active');

create table if not exists public.access_rules (
  id uuid primary key default gen_random_uuid(),
  rule_pack_id uuid not null references public.access_rule_packs(id) on delete restrict,
  rule_key text not null,
  customer_type text not null default 'any'
    check (customer_type in ('any', 'retail', 'professional', 'institutional')),
  product_class text not null
    check (product_class in ('securities', 'collective_investment', 'forex', 'virtual_asset')),
  activity text not null
    check (activity in (
      'market_information',
      'partner_referral',
      'solicit_or_advise',
      'receive_or_transmit_orders',
      'execute_orders',
      'hold_customer_assets',
      'operate_cis_platform',
      'online_forex_brokerage',
      'virtual_asset_service',
      'promote_virtual_asset_service'
    )),
  regulatory_signal text not null,
  severity text not null check (severity in ('critical', 'high', 'medium', 'low')),
  title text not null,
  explanation text not null,
  required_review text[] not null default '{}',
  created_at timestamptz not null default now(),
  unique (rule_pack_id, rule_key),
  unique (rule_pack_id, customer_type, product_class, activity)
);

create index if not exists access_rules_pack_scope_idx
  on public.access_rules (rule_pack_id, customer_type, product_class, activity);

create table if not exists public.access_rule_sources (
  rule_id uuid not null references public.access_rules(id) on delete cascade,
  source_id text not null references public.regulatory_sources(source_id) on delete restrict,
  evidence_role text not null default 'primary'
    check (evidence_role in ('primary', 'contextual', 'implementation_notice')),
  created_at timestamptz not null default now(),
  primary key (rule_id, source_id)
);

create table if not exists public.access_launch_gates (
  gate_key text primary key,
  label text not null,
  sort_order integer not null,
  required_for_activation boolean not null default true,
  description text not null default '',
  created_at timestamptz not null default now(),
  unique (sort_order)
);

create table if not exists public.provider_registry (
  provider_id text primary key,
  name text not null,
  category text not null,
  official_website text not null check (official_website like 'https://%'),
  technical_documentation text check (technical_documentation is null or technical_documentation like 'https://%'),
  relationship_status text not null default 'research_only'
    check (relationship_status in ('research_only', 'engaged', 'due_diligence', 'contracted', 'sandbox_connected', 'production_approved', 'suspended')),
  legal_entity_verified boolean not null default false,
  licence_evidence_verified boolean not null default false,
  signed_agreement boolean not null default false,
  approved_countries text[] not null default '{}',
  approved_customer_types text[] not null default '{}',
  approved_products text[] not null default '{}',
  connected_sandbox boolean not null default false,
  production_approved boolean not null default false,
  public_note text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (not production_approved or (legal_entity_verified and licence_evidence_verified and signed_agreement and connected_sandbox))
);

create table if not exists public.provider_capability_requirements (
  capability_id text primary key,
  label text not null,
  owner_question text not null,
  required_evidence jsonb not null default '[]'::jsonb
    check (jsonb_typeof(required_evidence) = 'array'),
  sort_order integer not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.provider_capability_assessments (
  id uuid primary key default gen_random_uuid(),
  provider_id text not null references public.provider_registry(provider_id) on delete restrict,
  capability_id text not null references public.provider_capability_requirements(capability_id) on delete restrict,
  jurisdiction_code text,
  customer_type text check (customer_type is null or customer_type in ('retail', 'professional', 'institutional')),
  product_class text,
  activity text,
  status text not null default 'not_verified'
    check (status in ('not_verified', 'claimed', 'in_review', 'verified', 'rejected', 'expired')),
  evidence_source_id text references public.regulatory_sources(source_id) on delete restrict,
  evidence_reference text,
  evidence_sha256 text,
  verified_by text,
  verified_at timestamptz,
  valid_until timestamptz,
  internal_notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (status <> 'verified' or (verified_at is not null and verified_by is not null))
);

create index if not exists provider_capability_scope_idx
  on public.provider_capability_assessments (provider_id, capability_id, jurisdiction_code, customer_type, product_class);

create table if not exists public.agent_review_cases (
  id uuid primary key default gen_random_uuid(),
  case_ref text not null unique,
  owner_id uuid references neon_auth."user"(id) on delete set null,
  data_classification text not null
    check (data_classification in ('synthetic', 'public')),
  jurisdiction_code text not null,
  customer_type text not null
    check (customer_type in ('retail', 'professional', 'institutional')),
  product_class text not null
    check (product_class in ('securities', 'collective_investment', 'forex', 'virtual_asset')),
  activity text not null,
  provider_id text references public.provider_registry(provider_id) on delete set null,
  case_payload jsonb not null default '{}'::jsonb,
  contains_personal_data boolean not null default false check (contains_personal_data = false),
  status text not null default 'draft'
    check (status in ('draft', 'submitted', 'reviewing', 'blocked', 'manual_review', 'completed', 'failed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists agent_review_cases_owner_created_idx
  on public.agent_review_cases (owner_id, created_at desc);

create table if not exists public.agent_review_runs (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.agent_review_cases(id) on delete cascade,
  rule_pack_id uuid references public.access_rule_packs(id) on delete restrict,
  policy_version text not null,
  run_mode text not null check (run_mode in ('offline_scripted', 'live_model')),
  model_name text,
  runtime_name text not null default 'mozaik',
  status text not null default 'queued'
    check (status in ('queued', 'running', 'completed', 'failed')),
  result_status text,
  started_at timestamptz,
  completed_at timestamptz,
  metrics jsonb not null default '{}'::jsonb,
  deterministic_outcome jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  check (completed_at is null or started_at is null or completed_at >= started_at)
);

create index if not exists agent_review_runs_case_created_idx
  on public.agent_review_runs (case_id, created_at desc);

create table if not exists public.agent_review_reports (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references public.agent_review_runs(id) on delete cascade,
  agent_role text not null
    check (agent_role in ('evidence-scout', 'route-analyst', 'independent-auditor')),
  parse_status text not null
    check (parse_status in ('parsed', 'unparsed')),
  report_json jsonb not null,
  raw_response_sha256 text,
  citation_validation_ok boolean not null default false,
  structural_errors jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  unique (run_id, agent_role)
);

create table if not exists public.agent_review_citations (
  report_id uuid not null references public.agent_review_reports(id) on delete cascade,
  source_id text not null references public.regulatory_sources(source_id) on delete restrict,
  claim_index integer not null check (claim_index >= 0),
  evidence_role text not null default 'supports'
    check (evidence_role in ('supports', 'contradicts', 'contextual')),
  created_at timestamptz not null default now(),
  primary key (report_id, source_id, claim_index)
);

create table if not exists public.agent_review_events (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references public.agent_review_runs(id) on delete cascade,
  event_sequence integer not null check (event_sequence >= 0),
  event_type text not null,
  participant_role text,
  occurred_at timestamptz not null default now(),
  event_payload jsonb not null default '{}'::jsonb,
  unique (run_id, event_sequence)
);

create table if not exists public.agent_review_decisions (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references public.agent_review_runs(id) on delete cascade,
  reviewer_id uuid not null references neon_auth."user"(id) on delete restrict,
  decision text not null check (decision in ('acknowledge', 'reject', 'defer')),
  note text not null default '',
  decision_meaning text not null default 'Review acknowledgement only; not regulatory approval and not permission to activate financial services.',
  created_at timestamptz not null default now()
);

create index if not exists agent_review_decisions_run_created_idx
  on public.agent_review_decisions (run_id, created_at desc);

-- Public reference data is readable; rule maintenance and partner evidence writes remain server-side.
alter table public.regulatory_sources enable row level security;
alter table public.access_rule_packs enable row level security;
alter table public.access_rules enable row level security;
alter table public.access_rule_sources enable row level security;
alter table public.access_launch_gates enable row level security;
alter table public.provider_registry enable row level security;
alter table public.provider_capability_requirements enable row level security;
alter table public.provider_capability_assessments enable row level security;

create policy "public reads source register" on public.regulatory_sources
  for select to anonymous, authenticated using (true);

create policy "public reads published rule packs" on public.access_rule_packs
  for select to anonymous, authenticated using (status in ('demo_published', 'active', 'superseded'));

create policy "public reads published access rules" on public.access_rules
  for select to anonymous, authenticated using (
    exists (
      select 1 from public.access_rule_packs p
      where p.id = rule_pack_id and p.status in ('demo_published', 'active', 'superseded')
    )
  );

create policy "public reads access rule evidence links" on public.access_rule_sources
  for select to anonymous, authenticated using (
    exists (
      select 1
      from public.access_rules r
      join public.access_rule_packs p on p.id = r.rule_pack_id
      where r.id = rule_id and p.status in ('demo_published', 'active', 'superseded')
    )
  );

create policy "public reads access launch gates" on public.access_launch_gates
  for select to anonymous, authenticated using (true);

create policy "public reads provider directory" on public.provider_registry
  for select to anonymous, authenticated using (true);

create policy "public reads provider capability requirements" on public.provider_capability_requirements
  for select to anonymous, authenticated using (true);

-- Provider evidence assessments contain internal diligence notes and have no direct Data API policy.
-- Agent review cases and runs are isolated to their owning authenticated user.
alter table public.agent_review_cases enable row level security;
alter table public.agent_review_runs enable row level security;
alter table public.agent_review_reports enable row level security;
alter table public.agent_review_citations enable row level security;
alter table public.agent_review_events enable row level security;
alter table public.agent_review_decisions enable row level security;

create policy "case owner reads own review cases" on public.agent_review_cases
  for select to authenticated using (owner_id = (select auth.uid()));

create policy "case owner creates own synthetic review cases" on public.agent_review_cases
  for insert to authenticated with check (
    owner_id = (select auth.uid())
    and data_classification in ('synthetic', 'public')
    and contains_personal_data = false
  );

create policy "case owner updates own review cases" on public.agent_review_cases
  for update to authenticated using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()) and contains_personal_data = false);

create policy "case owner reads own review runs" on public.agent_review_runs
  for select to authenticated using (
    exists (
      select 1 from public.agent_review_cases c
      where c.id = case_id and c.owner_id = (select auth.uid())
    )
  );

create policy "case owner reads own agent reports" on public.agent_review_reports
  for select to authenticated using (
    exists (
      select 1
      from public.agent_review_runs r
      join public.agent_review_cases c on c.id = r.case_id
      where r.id = run_id and c.owner_id = (select auth.uid())
    )
  );

create policy "case owner reads own agent citations" on public.agent_review_citations
  for select to authenticated using (
    exists (
      select 1
      from public.agent_review_reports p
      join public.agent_review_runs r on r.id = p.run_id
      join public.agent_review_cases c on c.id = r.case_id
      where p.id = report_id and c.owner_id = (select auth.uid())
    )
  );

create policy "case owner reads own agent events" on public.agent_review_events
  for select to authenticated using (
    exists (
      select 1
      from public.agent_review_runs r
      join public.agent_review_cases c on c.id = r.case_id
      where r.id = run_id and c.owner_id = (select auth.uid())
    )
  );

create policy "case owner reads own review decisions" on public.agent_review_decisions
  for select to authenticated using (
    reviewer_id = (select auth.uid())
    and exists (
      select 1
      from public.agent_review_runs r
      join public.agent_review_cases c on c.id = r.case_id
      where r.id = run_id and c.owner_id = (select auth.uid())
    )
  );

create policy "reviewer records own review acknowledgement" on public.agent_review_decisions
  for insert to authenticated with check (
    reviewer_id = (select auth.uid())
    and exists (
      select 1
      from public.agent_review_runs r
      join public.agent_review_cases c on c.id = r.case_id
      where r.id = run_id and c.owner_id = (select auth.uid())
    )
  );

grant usage on schema public to anonymous, authenticated;
grant select on public.regulatory_sources to anonymous, authenticated;
grant select on public.access_rule_packs to anonymous, authenticated;
grant select on public.access_rules to anonymous, authenticated;
grant select on public.access_rule_sources to anonymous, authenticated;
grant select on public.access_launch_gates to anonymous, authenticated;
grant select on public.provider_registry to anonymous, authenticated;
grant select on public.provider_capability_requirements to anonymous, authenticated;
grant select, insert, update on public.agent_review_cases to authenticated;
grant select on public.agent_review_runs to authenticated;
grant select on public.agent_review_reports to authenticated;
grant select on public.agent_review_citations to authenticated;
grant select on public.agent_review_events to authenticated;
grant select, insert on public.agent_review_decisions to authenticated;

insert into public.regulatory_sources
  (source_id, jurisdiction_code, authority, title, published_or_updated, source_url, provisions, summary, limitations)
values
  ('cma-licensing-checklists', 'KE', 'Capital Markets Authority (Kenya)', 'CMA licensing checklists', 'Updated 15 September 2026', 'https://www.cma.or.ke/licensing/',
   array['Broker Dealer', 'Stockbrokers', 'Investment Adviser', 'Intermediary Service Platform Provider', 'Online Forex Brokers'],
   'The CMA publishes separate licensing checklists for market-intermediary categories and says the underlying regulations are conclusive.',
   'A checklist is not a licence and does not decide VYRA classification.'),
  ('cma-cis-regulations', 'KE', 'Parliament of Kenya / Capital Markets Authority', 'Capital Markets (Collective Investment Schemes) Regulations, 2023', '2023',
   'https://www.parliament.go.ke/sites/default/files/2024-03/Capital%20markets%20regulations%2C%202023%20%28LN%20NO.%20170%20OF%202023%2C%20LN%20NO.%20171%20OF%202023%2C%20LN%20NO.%20172%20OF%202023%20AND%20LN%20NO.%20173%20OF%202023%29-compressed.pdf',
   array['Regulations 76–77: ISPP licensing and requirements'],
   'The regulations state that a person shall not operate an intermediary service platform without an ISPP licence; multiple-manager CIS distribution has an approval requirement.',
   'Counsel must confirm the current consolidated and transitional position and the exact VYRA journey.'),
  ('kenya-vasp-regulations', 'KE', 'National Treasury / CBK / CMA', 'Virtual Asset Service Providers Regulations, 2026 (Legal Notice 134 of 2026)', 'Gazetted 22 July 2026',
   'https://www.centralbank.go.ke/wp-content/uploads/2026/11/The-Virtual-Asset-Service-Providers-Regulations-2026.pdf',
   array['Regulation 4: application in or from Kenya', 'Regulation 6: licence application', 'Regulations 123–125: advertising and promotions'],
   'The regulations apply to persons offering virtual-asset services in or from Kenya. Targeting local consumers or deriving economic benefit/income from Kenya can establish the connection without physical presence.',
   'Exact service category, regulator, transitional provisions and VYRA role require current legal review.'),
  ('cbk-cma-vasp-notice', 'KE', 'Central Bank of Kenya and Capital Markets Authority', 'Public notice: gazettement of the VASP Regulations, 2026', '13 November 2026',
   'https://www.centralbank.go.ke/wp-content/uploads/2026/11/CBK-CMA-Public-Notice-Operationalisation-of-the-VASP-Regulations-2026-.pdf',
   array['VASP Act 2025 and Regulations 2026 operationalisation'],
   'The joint notice says persons providing or intending to provide virtual-asset services must apply to the relevant regulator under the applicable service category.',
   'The notice does not confer a licence or appointment on VYRA.'),
  ('cma-regulatory-sandbox', 'KE', 'Capital Markets Authority (Kenya)', 'CMA Regulatory Sandbox eligibility', 'Accessed 26 November 2026',
   'https://www.sandbox.cma.or.ke/index.php/who-is-eligible',
   array['Eligibility and innovation scope'],
   'The CMA describes eligibility for a Kenyan-incorporated company or a firm licensed by an equivalent securities regulator proposing an innovative service in Kenya; the page excludes activities clearly addressed under existing laws.',
   'A sandbox is supervised testing, not a general exemption or automatic permission.')
on conflict (source_id) do update set
  jurisdiction_code = excluded.jurisdiction_code,
  authority = excluded.authority,
  title = excluded.title,
  published_or_updated = excluded.published_or_updated,
  source_url = excluded.source_url,
  provisions = excluded.provisions,
  summary = excluded.summary,
  limitations = excluded.limitations,
  updated_at = now();

insert into public.access_rule_packs
  (jurisdiction_code, version, status, legal_review_status, effective_from, reviewed_at, reviewed_by, notes)
values
  ('KE', 'KE-2026.11.26.2', 'demo_published', 'counsel_review_pending', '2026-11-26', now(), 'VYRA research prototype',
   'Source-linked research pack. Not legal advice, not counsel-approved and not a regulatory authorisation.')
on conflict (jurisdiction_code, version) do update set
  status = excluded.status,
  legal_review_status = excluded.legal_review_status,
  reviewed_at = excluded.reviewed_at,
  reviewed_by = excluded.reviewed_by,
  notes = excluded.notes;

insert into public.access_rules
  (rule_pack_id, rule_key, customer_type, product_class, activity, regulatory_signal, severity, title, explanation, required_review)
select p.id, v.rule_key, 'any', v.product_class, v.activity, v.regulatory_signal, v.severity, v.title, v.explanation, v.required_review
from public.access_rule_packs p
cross join (values
  ('ke-vasp-activity', 'virtual_asset', 'virtual_asset_service', 'licensing_framework_applies', 'critical',
   'Virtual-asset service requires current licensing classification',
   'Kenya''s 2026 VASP Regulations apply to virtual-asset services in or from Kenya. Local targeting or deriving economic benefit/income from Kenya can establish the connection without a physical presence. The exact service and regulator require legal review.',
   array['Classify the exact service against the Act and Regulations.', 'Confirm the relevant regulator for the service category.', 'Obtain the applicable licence or documented principal arrangement for VYRA''s exact role.', 'Obtain counsel review of local targeting, remuneration and cross-border activity.']::text[]),
  ('ke-vasp-promotion', 'virtual_asset', 'promote_virtual_asset_service', 'promotion_compliance_applies', 'critical',
   'Virtual-asset promotion requires a separate review',
   'The 2026 VASP Regulations contain advertising and promotion provisions. A tracking link, affiliate label or overseas hosting choice does not itself remove the need to classify and review the promotion.',
   array['Identify the advertiser, licensee and any third party acting on its behalf.', 'Have the promotion, remuneration and target audience reviewed.', 'Record approval, channel, content version and withdrawal controls.']::text[]),
  ('ke-cis-platform', 'collective_investment', 'operate_cis_platform', 'ispp_classification_required', 'high',
   'Fund distribution platform requires ISPP classification',
   'Kenya''s CIS Regulations include an ISPP licensing regime. The current consolidated position and VYRA''s product discovery, lead, subscription and order flow require counsel and CMA confirmation.',
   array['Classify product discovery, lead capture, referral, subscription and order flow.', 'Review the current general licensing rules and CIS regulations.', 'Confirm ISPP licence and any product or multiple-manager approvals.', 'Confirm written fund-manager agreement and investor protection responsibilities.']::text[]),
  ('ke-securities-intermediary', 'securities', 'execute_orders', 'intermediary_classification_required', 'high',
   'Securities intermediation requires exact CMA category classification',
   'The CMA publishes distinct checklists for brokers, stockbrokers, investment advisers, custodians and other intermediaries. Classification depends on the actual activity, not a software or affiliate label.',
   array['Describe each customer-facing and back-office activity.', 'Check current CMA regulations and category-specific licensing requirements.', 'Classify VYRA as information-only software, technology supplier, introducer or intermediary.', 'Obtain a written perimeter opinion before customer acquisition or order flow.']::text[]),
  ('ke-online-forex', 'forex', 'online_forex_brokerage', 'online_forex_classification_required', 'high',
   'Online forex has a distinct CMA licensing perimeter',
   'The CMA publishes a separate Online Forex Brokers checklist. Leverage, CFDs, dealing as principal and routing to another broker affect the required classification.',
   array['Specify spot FX, leveraged online forex, CFD or other instrument.', 'Determine whether dealing or non-dealing permissions apply.', 'Verify the exact legal entity and licence scope against the CMA register.', 'Obtain written country and customer-category approval.']::text[])
) as v(rule_key, product_class, activity, regulatory_signal, severity, title, explanation, required_review)
where p.jurisdiction_code = 'KE' and p.version = 'KE-2026.11.26.2'
on conflict (rule_pack_id, rule_key) do update set
  product_class = excluded.product_class,
  activity = excluded.activity,
  regulatory_signal = excluded.regulatory_signal,
  severity = excluded.severity,
  title = excluded.title,
  explanation = excluded.explanation,
  required_review = excluded.required_review;

insert into public.access_rule_sources (rule_id, source_id, evidence_role)
select r.id, v.source_id, v.evidence_role
from public.access_rules r
join public.access_rule_packs p on p.id = r.rule_pack_id
cross join (values
  ('ke-vasp-activity', 'kenya-vasp-regulations', 'primary'),
  ('ke-vasp-activity', 'cbk-cma-vasp-notice', 'implementation_notice'),
  ('ke-vasp-promotion', 'kenya-vasp-regulations', 'primary'),
  ('ke-vasp-promotion', 'cbk-cma-vasp-notice', 'implementation_notice'),
  ('ke-cis-platform', 'cma-licensing-checklists', 'contextual'),
  ('ke-cis-platform', 'cma-cis-regulations', 'primary'),
  ('ke-securities-intermediary', 'cma-licensing-checklists', 'primary'),
  ('ke-online-forex', 'cma-licensing-checklists', 'primary')
) as v(rule_key, source_id, evidence_role)
where p.jurisdiction_code = 'KE' and p.version = 'KE-2026.11.26.2' and r.rule_key = v.rule_key
on conflict (rule_id, source_id) do update set evidence_role = excluded.evidence_role;

insert into public.access_launch_gates (gate_key, label, sort_order, description)
values
  ('legalOpinion', 'Activity-specific written legal classification', 1, 'Written opinion for the exact VYRA activity and target jurisdiction.'),
  ('customerTypeApproval', 'Customer / investor classification and eligibility', 2, 'Retail, professional or institutional client classification and eligibility evidence.'),
  ('principalIdentified', 'Named regulated principal and responsibility matrix', 3, 'Verify the legal entity responsible for each regulated activity.'),
  ('partnerAgreement', 'Executed partner agreement and permitted VYRA role', 4, 'Signed contract and scope for the named VYRA entity and customer journey.'),
  ('countryApproval', 'Written customer-country approval', 5, 'Explicit partner and legal approval for the target jurisdiction.'),
  ('productApproval', 'Written instrument / product approval', 6, 'Explicit approval for each financial instrument or product class.'),
  ('marketingApproval', 'Approved financial promotion and referral content', 7, 'Content, audience, channel and compensation reviewed and approved.'),
  ('dataRights', 'Market-data and data-processing rights', 8, 'Contractual live/delayed display, redistribution and processing rights.'),
  ('kycAllocation', 'KYC / AML / sanctions owner and escalation route', 9, 'Accountable party, controls, cases, record retention and escalation.'),
  ('custodyAllocation', 'Customer-money and asset custody owner', 10, 'Named bank/custodian and safeguarding, segregation and withdrawal controls.'),
  ('executionAllocation', 'Execution, dealing and complaint owner', 11, 'Named executing principal and clear order, dealing and complaint responsibility.'),
  ('operationalReadiness', 'Security, incident, support and reconciliation sign-off', 12, 'Security, failure handling, support, business continuity and reconciliation sign-off.')
on conflict (gate_key) do update set
  label = excluded.label,
  sort_order = excluded.sort_order,
  description = excluded.description;

insert into public.provider_registry
  (provider_id, name, category, official_website, technical_documentation, relationship_status, public_note)
values
  ('interactive-brokers', 'Interactive Brokers', 'brokerage infrastructure research', 'https://www.interactivebrokers.com/', 'https://www.interactivebrokers.com/campus/ibkr-api-page/web-api-account-management/', 'research_only', 'Research candidate only. No VYRA appointment, country approval, contract or connection is recorded.'),
  ('saxo', 'Saxo', 'multi-asset partner research', 'https://www.home.saxo/', 'https://www.saxoportal.com/institutional-and-partners/introducing-broker.html', 'research_only', 'Research candidate only. No VYRA appointment, country approval, contract or connection is recorded.'),
  ('alpaca', 'Alpaca', 'brokerage API research', 'https://alpaca.markets/', 'https://docs.alpaca.markets/us/docs/about-broker-api', 'research_only', 'Research candidate only. No VYRA appointment, country approval, contract or connection is recorded.'),
  ('drivewealth', 'DriveWealth', 'embedded brokerage research', 'https://www.drivewealth.com/', 'https://developer.drivewealth.com/apis/docs/intro', 'research_only', 'Research candidate only. No VYRA appointment, country approval, contract or connection is recorded.'),
  ('upvest', 'Upvest', 'investment API research', 'https://upvest.co/', 'https://docs.upvest.co/operating_models', 'research_only', 'Research candidate only. No VYRA appointment, country approval, contract or connection is recorded.')
on conflict (provider_id) do update set
  name = excluded.name,
  category = excluded.category,
  official_website = excluded.official_website,
  technical_documentation = excluded.technical_documentation,
  public_note = excluded.public_note,
  updated_at = now();

insert into public.provider_capability_requirements (capability_id, label, owner_question, required_evidence, sort_order)
values
  ('regulated_principal', 'Regulated principal / customer account', 'Which legal entity signs the customer agreement and owns the regulated account relationship?',
   '["Legal entity and registration number", "Current regulator register evidence", "Licence category and permitted activities", "Customer-country and investor-category acceptance", "Signed responsibility matrix"]'::jsonb, 1),
  ('account_onboarding', 'Account opening and onboarding', 'Who collects the application, classifies the customer and makes the final acceptance decision?',
   '["Supported onboarding method/API", "Account ownership and contracting flow", "Customer eligibility rules", "Authenticated application status events"]'::jsonb, 2),
  ('kyc_aml', 'KYC, AML, sanctions and monitoring', 'Who owns identity verification, screening decisions, ongoing monitoring and regulatory escalation?',
   '["KYC/AML responsibility allocation", "Screening processor and data-processing terms", "Country/document coverage", "Sanctions/PEP case escalation", "Audit and retention process"]'::jsonb, 3),
  ('client_assets', 'Client money, custody and safeguarding', 'Which authorised institution receives and safeguards customer money or assets?',
   '["Named bank/custodian legal entity", "Segregation and ownership model", "Withdrawal authority and controls", "Settlement and reconciliation process", "Insolvency and safeguarding disclosure"]'::jsonb, 4),
  ('execution_dealing', 'Execution, dealing and liquidity', 'Who accepts, routes, executes, cancels, clears and settles an order?',
   '["Executing legal entity and permissions", "Venue/LP/counterparty list", "Order lifecycle API and webhooks", "Execution/markup/commission schedule", "Best-execution and outage procedures"]'::jsonb, 5),
  ('market_data', 'Market data and redistribution rights', 'Which source provides each quote and what display/redistribution rights are granted?',
   '["Provider and exchange source per instrument", "Live/delayed entitlement", "Retail/professional display rights", "Derived data and retention terms", "Timestamp and outage semantics"]'::jsonb, 6),
  ('payments', 'Payments, deposits and withdrawals', 'Which authorised bank/payment provider processes customer funding and withdrawals?',
   '["Payment institution/bank identity and permission", "Supported jurisdictions and currencies", "Client-money flow and settlement time", "Refund/recall and chargeback process", "Daily reconciliation and failure handling"]'::jsonb, 7),
  ('reporting_reconciliation', 'Statements, reporting and reconciliation', 'Which system is authoritative for cash, positions, orders, fills, fees and statements?',
   '["Statement/API data dictionary", "Signed event/webhook and replay rules", "Idempotency and sequence handling", "Daily reconciliation and exception process", "Correction and audit policy"]'::jsonb, 8),
  ('customer_support', 'Customer communications and complaints', 'Who owns service requests and complaints for each regulated activity?',
   '["Named support legal entity", "Complaint routing and service targets", "Incident/escalation contacts", "Secure communications and access controls"]'::jsonb, 9),
  ('affiliate_promotions', 'Affiliate, referral and promotions', 'Who approves each promotion and is referral remuneration allowed in the target market?',
   '["Promotion/legal approval", "Partner appointment and scope", "Compensation/conflicts approval", "Accepted affiliate rules and traffic sources", "Attribution, audit and clawback rules"]'::jsonb, 10),
  ('mobile_apps', 'Web, desktop, Android and iOS applications', 'Who owns the binaries, publisher accounts, user support and release obligations?',
   '["App ownership and source/binary rights", "App-store eligibility and publisher evidence", "Privacy/data-safety declaration", "Signing and release process", "Support and update SLA"]'::jsonb, 11)
on conflict (capability_id) do update set
  label = excluded.label,
  owner_question = excluded.owner_question,
  required_evidence = excluded.required_evidence,
  sort_order = excluded.sort_order;
