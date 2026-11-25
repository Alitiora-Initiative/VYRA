-- VYRA core platform schema
-- Paper-only trading foundation. Live money movement and broker execution are not enabled.
create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated, service_role;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.instrument_catalog (
  id uuid primary key default gen_random_uuid(),
  symbol text not null unique,
  name text not null,
  asset_class text not null check (asset_class in ('crypto','equity','forex','commodity')),
  base_currency text not null,
  quote_currency text not null default 'USD',
  provider_symbol text not null,
  is_enabled boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.trading_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete restrict,
  account_type text not null check (account_type in ('paper','live')),
  status text not null default 'active' check (status in ('active','suspended','closed')),
  currency text not null default 'USD' check (currency in ('USD')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists trading_accounts_one_active_paper_per_user
  on public.trading_accounts(user_id) where account_type = 'paper' and status = 'active';
create index if not exists trading_accounts_user_idx on public.trading_accounts(user_id, created_at desc);

create table if not exists public.risk_limits (
  trading_account_id uuid primary key references public.trading_accounts(id) on delete cascade,
  max_order_notional numeric(20,2) not null default 10000 check (max_order_notional > 0),
  max_position_notional numeric(20,2) not null default 25000 check (max_position_notional > 0),
  max_daily_realized_loss numeric(20,2) not null default 1000 check (max_daily_realized_loss > 0),
  slippage_bps numeric(10,2) not null default 5 check (slippage_bps between 0 and 1000),
  created_at timestamptz not null default now()
);

create table if not exists public.market_quotes (
  instrument_id uuid primary key references public.instrument_catalog(id) on delete cascade,
  last_price numeric(24,10) not null check (last_price > 0),
  source text not null,
  observed_at timestamptz not null,
  updated_at timestamptz not null default now()
);
create index if not exists market_quotes_observed_idx on public.market_quotes(observed_at desc);

create or replace function private.keep_latest_market_quote()
returns trigger
language plpgsql
security definer
set search_path = ''
as $
begin
  if tg_op = 'UPDATE' and old.observed_at > new.observed_at then
    return old;
  end if;
  new.updated_at := now();
  return new;
end;
$;
revoke all on function private.keep_latest_market_quote() from public, anon, authenticated;

drop trigger if exists market_quotes_keep_latest on public.market_quotes;
create trigger market_quotes_keep_latest
before insert or update on public.market_quotes
for each row execute function private.keep_latest_market_quote();

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  trading_account_id uuid not null references public.trading_accounts(id) on delete restrict,
  instrument_id uuid not null references public.instrument_catalog(id) on delete restrict,
  client_order_id uuid not null,
  side text not null check (side in ('buy','sell')),
  order_type text not null check (order_type in ('market','limit')),
  quantity numeric(28,10) not null check (quantity > 0),
  limit_price numeric(24,10),
  status text not null default 'open' check (status in ('open','filled','cancelled','rejected')),
  filled_quantity numeric(28,10) not null default 0,
  average_fill_price numeric(24,10),
  rejection_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (trading_account_id, client_order_id),
  check ((order_type = 'market' and limit_price is null) or (order_type = 'limit' and limit_price > 0))
);
create index if not exists orders_account_created_idx on public.orders(trading_account_id, created_at desc);
create index if not exists orders_open_instrument_idx on public.orders(instrument_id, status) where status = 'open';

create table if not exists public.fills (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete restrict,
  trading_account_id uuid not null references public.trading_accounts(id) on delete restrict,
  instrument_id uuid not null references public.instrument_catalog(id) on delete restrict,
  quantity numeric(28,10) not null check (quantity > 0),
  price numeric(24,10) not null check (price > 0),
  notional numeric(24,2) not null check (notional > 0),
  liquidity text not null default 'paper_simulated',
  filled_at timestamptz not null default now()
);
create index if not exists fills_account_time_idx on public.fills(trading_account_id, filled_at desc);

create table if not exists public.positions (
  trading_account_id uuid not null references public.trading_accounts(id) on delete restrict,
  instrument_id uuid not null references public.instrument_catalog(id) on delete restrict,
  quantity numeric(28,10) not null default 0 check (quantity >= 0),
  average_cost numeric(24,10) not null default 0 check (average_cost >= 0),
  updated_at timestamptz not null default now(),
  primary key (trading_account_id, instrument_id)
);

create table if not exists public.ledger_accounts (
  id uuid primary key default gen_random_uuid(),
  trading_account_id uuid not null references public.trading_accounts(id) on delete restrict,
  account_code text not null check (account_code in ('cash','positions','equity','realized_pnl')),
  currency text not null default 'USD' check (currency = 'USD'),
  created_at timestamptz not null default now(),
  unique (trading_account_id, account_code)
);

create table if not exists public.ledger_transactions (
  id uuid primary key default gen_random_uuid(),
  trading_account_id uuid not null references public.trading_accounts(id) on delete restrict,
  event_type text not null check (event_type in ('paper_opening_balance','paper_trade')),
  reference_id uuid,
  idempotency_key text,
  description text not null,
  created_at timestamptz not null default now(),
  unique (trading_account_id, idempotency_key)
);

create table if not exists public.ledger_entries (
  id uuid primary key default gen_random_uuid(),
  transaction_id uuid not null references public.ledger_transactions(id) on delete restrict,
  ledger_account_id uuid not null references public.ledger_accounts(id) on delete restrict,
  direction text not null check (direction in ('debit','credit')),
  amount numeric(24,2) not null check (amount > 0),
  currency text not null default 'USD' check (currency = 'USD'),
  created_at timestamptz not null default now()
);
create index if not exists ledger_entries_account_idx on public.ledger_entries(ledger_account_id, created_at);

create table if not exists public.audit_events (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users(id) on delete set null,
  trading_account_id uuid references public.trading_accounts(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists audit_events_account_time_idx on public.audit_events(trading_account_id, created_at desc);

create table if not exists public.provider_connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null,
  asset_class text not null check (asset_class in ('crypto','equity','forex','commodity')),
  status text not null default 'not_configured' check (status in ('not_configured','pending','connected','revoked','error')),
  account_label text,
  last_checked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, provider, asset_class)
);

-- Seed only the instrument catalogue. No seeded or simulated prices are inserted.
insert into public.instrument_catalog (id, symbol, name, asset_class, base_currency, quote_currency, provider_symbol)
values
  ('10000000-0000-4000-8000-000000000001','BTC-USD','Bitcoin','crypto','BTC','USD','bitcoin'),
  ('10000000-0000-4000-8000-000000000002','ETH-USD','Ethereum','crypto','ETH','USD','ethereum'),
  ('10000000-0000-4000-8000-000000000003','SOL-USD','Solana','crypto','SOL','USD','solana'),
  ('20000000-0000-4000-8000-000000000001','AAPL','Apple','equity','AAPL','USD','AAPL'),
  ('20000000-0000-4000-8000-000000000002','NVDA','NVIDIA','equity','NVDA','USD','NVDA'),
  ('20000000-0000-4000-8000-000000000003','MSFT','Microsoft','equity','MSFT','USD','MSFT'),
  ('30000000-0000-4000-8000-000000000001','EUR/USD','Euro / US Dollar','forex','EUR','USD','EUR/USD'),
  ('30000000-0000-4000-8000-000000000002','GBP/USD','Pound / US Dollar','forex','GBP','USD','GBP/USD'),
  ('30000000-0000-4000-8000-000000000003','USD/JPY','US Dollar / Japanese Yen','forex','USD','JPY','USD/JPY'),
  ('40000000-0000-4000-8000-000000000001','XAU/USD','Gold / US Dollar','commodity','XAU','USD','XAU/USD'),
  ('40000000-0000-4000-8000-000000000002','XAG/USD','Silver / US Dollar','commodity','XAG','USD','XAG/USD')
on conflict (symbol) do update set
  name = excluded.name, asset_class = excluded.asset_class,
  base_currency = excluded.base_currency, quote_currency = excluded.quote_currency,
  provider_symbol = excluded.provider_symbol;

-- Every user-owned table is protected by RLS; no user can write ledger postings directly.
alter table public.profiles enable row level security;
alter table public.instrument_catalog enable row level security;
alter table public.trading_accounts enable row level security;
alter table public.risk_limits enable row level security;
alter table public.market_quotes enable row level security;
alter table public.orders enable row level security;
alter table public.fills enable row level security;
alter table public.positions enable row level security;
alter table public.ledger_accounts enable row level security;
alter table public.ledger_transactions enable row level security;
alter table public.ledger_entries enable row level security;
alter table public.audit_events enable row level security;
alter table public.provider_connections enable row level security;

drop policy if exists "profile owner reads own profile" on public.profiles;
create policy "profile owner reads own profile" on public.profiles for select to authenticated using (id = (select auth.uid()));
drop policy if exists "profile owner updates own profile" on public.profiles;
create policy "profile owner updates own profile" on public.profiles for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));

drop policy if exists "enabled instruments are readable" on public.instrument_catalog;
create policy "enabled instruments are readable" on public.instrument_catalog for select to anon, authenticated using (is_enabled = true);
drop policy if exists "market quotes are readable" on public.market_quotes;
create policy "market quotes are readable" on public.market_quotes for select to anon, authenticated using (true);

drop policy if exists "account owner reads account" on public.trading_accounts;
create policy "account owner reads account" on public.trading_accounts for select to authenticated using (user_id = (select auth.uid()));
drop policy if exists "account owner reads risk limits" on public.risk_limits;
create policy "account owner reads risk limits" on public.risk_limits for select to authenticated using (
  exists (select 1 from public.trading_accounts a where a.id = trading_account_id and a.user_id = (select auth.uid()))
);
drop policy if exists "account owner reads orders" on public.orders;
create policy "account owner reads orders" on public.orders for select to authenticated using (
  exists (select 1 from public.trading_accounts a where a.id = trading_account_id and a.user_id = (select auth.uid()))
);
drop policy if exists "account owner reads fills" on public.fills;
create policy "account owner reads fills" on public.fills for select to authenticated using (
  exists (select 1 from public.trading_accounts a where a.id = trading_account_id and a.user_id = (select auth.uid()))
);
drop policy if exists "account owner reads positions" on public.positions;
create policy "account owner reads positions" on public.positions for select to authenticated using (
  exists (select 1 from public.trading_accounts a where a.id = trading_account_id and a.user_id = (select auth.uid()))
);
drop policy if exists "account owner reads ledger accounts" on public.ledger_accounts;
create policy "account owner reads ledger accounts" on public.ledger_accounts for select to authenticated using (
  exists (select 1 from public.trading_accounts a where a.id = trading_account_id and a.user_id = (select auth.uid()))
);
drop policy if exists "account owner reads ledger transactions" on public.ledger_transactions;
create policy "account owner reads ledger transactions" on public.ledger_transactions for select to authenticated using (
  exists (select 1 from public.trading_accounts a where a.id = trading_account_id and a.user_id = (select auth.uid()))
);
drop policy if exists "account owner reads ledger entries" on public.ledger_entries;
create policy "account owner reads ledger entries" on public.ledger_entries for select to authenticated using (
  exists (
    select 1 from public.ledger_accounts la
    join public.trading_accounts a on a.id = la.trading_account_id
    where la.id = ledger_account_id and a.user_id = (select auth.uid())
  )
);
drop policy if exists "account owner reads audit events" on public.audit_events;
create policy "account owner reads audit events" on public.audit_events for select to authenticated using (
  trading_account_id is not null and exists (
    select 1 from public.trading_accounts a where a.id = trading_account_id and a.user_id = (select auth.uid())
  )
);
drop policy if exists "provider owner reads own connections" on public.provider_connections;
create policy "provider owner reads own connections" on public.provider_connections for select to authenticated using (user_id = (select auth.uid()));

grant select on public.instrument_catalog, public.market_quotes to anon, authenticated;
grant select on public.profiles, public.trading_accounts, public.risk_limits, public.orders,
  public.fills, public.positions, public.ledger_accounts, public.ledger_transactions,
  public.ledger_entries, public.audit_events, public.provider_connections to authenticated;
grant all on public.instrument_catalog, public.market_quotes, public.profiles, public.trading_accounts,
  public.risk_limits, public.orders, public.fills, public.positions, public.ledger_accounts,
  public.ledger_transactions, public.ledger_entries, public.audit_events, public.provider_connections to service_role;

create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'name', new.email))
  on conflict (id) do nothing;
  return new;
end;
$$;
revoke all on function private.handle_new_user() from public, anon, authenticated;

drop trigger if exists on_auth_user_created_vyra on auth.users;
create trigger on_auth_user_created_vyra
after insert on auth.users
for each row execute function private.handle_new_user();

create or replace function private.open_paper_account()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_account_id uuid;
  v_cash_id uuid;
  v_positions_id uuid;
  v_equity_id uuid;
  v_transaction_id uuid;
  v_initial_cash numeric(24,2) := 100000.00;
begin
  if v_user_id is null then raise exception 'AUTH_REQUIRED'; end if;

  -- Serialise account creation so concurrent first-login requests remain idempotent.
  perform pg_advisory_xact_lock(hashtextextended(v_user_id::text || ':paper-account', 0));

  select id into v_account_id
  from public.trading_accounts
  where user_id = v_user_id and account_type = 'paper' and status = 'active'
  limit 1;

  if v_account_id is not null then
    return jsonb_build_object('account_id', v_account_id, 'created', false);
  end if;

  insert into public.trading_accounts (user_id, account_type, status, currency)
  values (v_user_id, 'paper', 'active', 'USD')
  returning id into v_account_id;

  insert into public.risk_limits (trading_account_id)
  values (v_account_id);

  insert into public.ledger_accounts (trading_account_id, account_code, currency)
  values (v_account_id, 'cash', 'USD') returning id into v_cash_id;
  insert into public.ledger_accounts (trading_account_id, account_code, currency)
  values (v_account_id, 'positions', 'USD') returning id into v_positions_id;
  insert into public.ledger_accounts (trading_account_id, account_code, currency)
  values (v_account_id, 'equity', 'USD') returning id into v_equity_id;
  insert into public.ledger_accounts (trading_account_id, account_code, currency)
  values (v_account_id, 'realized_pnl', 'USD');

  insert into public.ledger_transactions (trading_account_id, event_type, reference_id, idempotency_key, description)
  values (v_account_id, 'paper_opening_balance', v_account_id, 'opening-balance-v1', 'Illustrative paper account opening balance')
  returning id into v_transaction_id;

  insert into public.ledger_entries (transaction_id, ledger_account_id, direction, amount, currency)
  values
    (v_transaction_id, v_cash_id, 'debit', v_initial_cash, 'USD'),
    (v_transaction_id, v_equity_id, 'credit', v_initial_cash, 'USD');

  insert into public.audit_events (actor_id, trading_account_id, action, entity_type, entity_id, metadata)
  values (v_user_id, v_account_id, 'paper_account_opened', 'trading_account', v_account_id,
    jsonb_build_object('initial_cash', v_initial_cash, 'currency', 'USD'));

  return jsonb_build_object('account_id', v_account_id, 'created', true, 'paper_initial_cash', v_initial_cash, 'currency', 'USD');
end;
$$;

create or replace function private.execute_paper_fill(p_order_id uuid, p_fill_price numeric)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order public.orders%rowtype;
  v_account public.trading_accounts%rowtype;
  v_cash_id uuid;
  v_positions_id uuid;
  v_transaction_id uuid;
  v_fill_id uuid;
  v_cash numeric(24,2);
  v_position_qty numeric(28,10);
  v_notional numeric(24,2);
  v_cost numeric(24,10);
  v_cost_basis numeric(24,2);
  v_realized_pnl numeric(24,2);
  v_pnl_id uuid;
  v_limits public.risk_limits%rowtype;
  v_daily_loss numeric(24,2) := 0;
  v_reserved_buy numeric(24,2) := 0;
  v_reserved_buy_instrument numeric(24,2) := 0;
  v_reserved_sell numeric(28,10) := 0;
begin
  select * into v_order from public.orders where id = p_order_id for update;
  if not found or v_order.status <> 'open' then return jsonb_build_object('filled', false); end if;

  select * into v_account from public.trading_accounts where id = v_order.trading_account_id for update;
  if v_account.status <> 'active' or v_account.account_type <> 'paper' then raise exception 'PAPER_ACCOUNT_INACTIVE'; end if;

  select id into v_cash_id from public.ledger_accounts
    where trading_account_id = v_order.trading_account_id and account_code = 'cash';
  select id into v_positions_id from public.ledger_accounts
    where trading_account_id = v_order.trading_account_id and account_code = 'positions';

  select coalesce(sum(case when le.direction = 'debit' then le.amount else -le.amount end), 0)
    into v_cash
  from public.ledger_entries le
  where le.ledger_account_id = v_cash_id;

  select coalesce(sum(o.quantity * coalesce(o.limit_price, p_fill_price)), 0)
    into v_reserved_buy
  from public.orders o
  where o.trading_account_id = v_order.trading_account_id
    and o.side = 'buy' and o.status = 'open' and o.id <> v_order.id;
  select coalesce(sum(o.quantity * coalesce(o.limit_price, p_fill_price)), 0)
    into v_reserved_buy_instrument
  from public.orders o
  where o.trading_account_id = v_order.trading_account_id
    and o.instrument_id = v_order.instrument_id
    and o.side = 'buy' and o.status = 'open' and o.id <> v_order.id;
  select coalesce(sum(o.quantity), 0)
    into v_reserved_sell
  from public.orders o
  where o.trading_account_id = v_order.trading_account_id
    and o.instrument_id = v_order.instrument_id
    and o.side = 'sell' and o.status = 'open' and o.id <> v_order.id;

  select coalesce(quantity, 0), coalesce(average_cost, 0)
    into v_position_qty, v_cost
  from public.positions
  where trading_account_id = v_order.trading_account_id and instrument_id = v_order.instrument_id
  for update;
  if not found then v_position_qty := 0; v_cost := 0; end if;

  if p_fill_price is null or p_fill_price <= 0 then raise exception 'INVALID_FILL_PRICE'; end if;
  v_notional := round(v_order.quantity * p_fill_price, 2);
  if v_notional <= 0 then raise exception 'INVALID_NOTIONAL'; end if;
  if v_order.side = 'buy' and v_cash < (v_notional + v_reserved_buy) then
    raise exception 'INSUFFICIENT_PAPER_CASH_OR_RESERVED';
  end if;
  if v_order.side = 'sell' and (v_position_qty - v_reserved_sell) < v_order.quantity then
    raise exception 'INSUFFICIENT_PAPER_POSITION_OR_RESERVED';
  end if;

  select * into v_limits from public.risk_limits where trading_account_id = v_order.trading_account_id;
  if not found then raise exception 'RISK_LIMITS_MISSING'; end if;
  if v_notional > v_limits.max_order_notional then raise exception 'ORDER_NOTIONAL_LIMIT_EXCEEDED'; end if;

  if v_order.side = 'buy' then
    if (v_position_qty * p_fill_price + v_notional + v_reserved_buy_instrument) > v_limits.max_position_notional then
      raise exception 'POSITION_NOTIONAL_LIMIT_EXCEEDED';
    end if;
    select coalesce(sum(case when le.direction = 'debit' then le.amount else -le.amount end), 0)
      into v_daily_loss
    from public.ledger_entries le
    join public.ledger_accounts la on la.id = le.ledger_account_id
    where la.trading_account_id = v_order.trading_account_id
      and la.account_code = 'realized_pnl'
      and le.created_at >= date_trunc('day', now());
    if v_daily_loss > v_limits.max_daily_realized_loss then
      raise exception 'DAILY_REALIZED_LOSS_LIMIT_EXCEEDED';
    end if;
  end if;

  if v_order.side = 'buy' then
    insert into public.ledger_transactions (trading_account_id, event_type, reference_id, idempotency_key, description)
    values (v_order.trading_account_id, 'paper_trade', v_order.id, 'paper-order:' || v_order.id::text, 'Paper market/limit buy fill')
    returning id into v_transaction_id;
    insert into public.ledger_entries (transaction_id, ledger_account_id, direction, amount, currency)
    values
      (v_transaction_id, v_positions_id, 'debit', v_notional, v_account.currency),
      (v_transaction_id, v_cash_id, 'credit', v_notional, v_account.currency);

    insert into public.positions (trading_account_id, instrument_id, quantity, average_cost, updated_at)
    values (v_order.trading_account_id, v_order.instrument_id, v_order.quantity, p_fill_price, now())
    on conflict (trading_account_id, instrument_id) do update set
      average_cost = case
        when public.positions.quantity + excluded.quantity = 0 then 0
        else ((public.positions.quantity * public.positions.average_cost) + (excluded.quantity * excluded.average_cost))
             / (public.positions.quantity + excluded.quantity)
      end,
      quantity = public.positions.quantity + excluded.quantity,
      updated_at = now();
  else
    if v_position_qty < v_order.quantity then raise exception 'INSUFFICIENT_PAPER_POSITION'; end if;
    v_cost_basis := round(v_cost * v_order.quantity, 2);
    v_realized_pnl := v_notional - v_cost_basis;
    select id into v_pnl_id from public.ledger_accounts
      where trading_account_id = v_order.trading_account_id and account_code = 'realized_pnl';

    insert into public.ledger_transactions (trading_account_id, event_type, reference_id, idempotency_key, description)
    values (v_order.trading_account_id, 'paper_trade', v_order.id, 'paper-order:' || v_order.id::text, 'Paper market/limit sell fill')
    returning id into v_transaction_id;

    if v_cost_basis = 0 then
      insert into public.ledger_entries (transaction_id, ledger_account_id, direction, amount, currency)
      values
        (v_transaction_id, v_cash_id, 'debit', v_notional, v_account.currency),
        (v_transaction_id, v_pnl_id, 'credit', v_notional, v_account.currency);
    elsif v_realized_pnl > 0 then
      insert into public.ledger_entries (transaction_id, ledger_account_id, direction, amount, currency)
      values
        (v_transaction_id, v_cash_id, 'debit', v_notional, v_account.currency),
        (v_transaction_id, v_positions_id, 'credit', v_cost_basis, v_account.currency),
        (v_transaction_id, v_pnl_id, 'credit', v_realized_pnl, v_account.currency);
    elsif v_realized_pnl < 0 then
      insert into public.ledger_entries (transaction_id, ledger_account_id, direction, amount, currency)
      values
        (v_transaction_id, v_cash_id, 'debit', v_notional, v_account.currency),
        (v_transaction_id, v_pnl_id, 'debit', abs(v_realized_pnl), v_account.currency),
        (v_transaction_id, v_positions_id, 'credit', v_cost_basis, v_account.currency);
    else
      insert into public.ledger_entries (transaction_id, ledger_account_id, direction, amount, currency)
      values
        (v_transaction_id, v_cash_id, 'debit', v_notional, v_account.currency),
        (v_transaction_id, v_positions_id, 'credit', v_cost_basis, v_account.currency);
    end if;

    update public.positions
      set quantity = quantity - v_order.quantity,
          average_cost = case when quantity - v_order.quantity = 0 then 0 else average_cost end,
          updated_at = now()
      where trading_account_id = v_order.trading_account_id and instrument_id = v_order.instrument_id;
  end if;

  insert into public.fills (order_id, trading_account_id, instrument_id, quantity, price, notional, liquidity)
  values (v_order.id, v_order.trading_account_id, v_order.instrument_id, v_order.quantity, p_fill_price, v_notional, 'paper_simulated')
  returning id into v_fill_id;

  update public.orders
    set status = 'filled', filled_quantity = quantity, average_fill_price = p_fill_price, updated_at = now()
    where id = v_order.id;

  insert into public.audit_events (actor_id, trading_account_id, action, entity_type, entity_id, metadata)
  values (v_account.user_id, v_account.id, 'paper_order_filled', 'order', v_order.id,
    jsonb_build_object('fill_id', v_fill_id, 'quantity', v_order.quantity, 'price', p_fill_price, 'notional', v_notional));

  return jsonb_build_object('filled', true, 'fill_id', v_fill_id, 'price', p_fill_price, 'notional', v_notional);
end;
$$;

create or replace function private.submit_paper_order(
  p_account_id uuid,
  p_instrument_id uuid,
  p_side text,
  p_order_type text,
  p_quantity numeric,
  p_limit_price numeric,
  p_client_order_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_account public.trading_accounts%rowtype;
  v_instrument public.instrument_catalog%rowtype;
  v_quote public.market_quotes%rowtype;
  v_limits public.risk_limits%rowtype;
  v_order_id uuid;
  v_existing public.orders%rowtype;
  v_estimated_price numeric(24,10);
  v_notional numeric(24,2);
  v_marketable boolean;
  v_current_qty numeric(28,10) := 0;
  v_daily_realized_loss numeric(24,2) := 0;
  v_cash_account_id uuid;
  v_cash_available numeric(24,2) := 0;
  v_reserved_buy numeric(24,2) := 0;
  v_reserved_buy_instrument numeric(24,2) := 0;
  v_reserved_sell numeric(28,10) := 0;
  v_commitment_price numeric(24,10);
  v_order_commitment numeric(24,2);
  v_fill jsonb;
begin
  if v_user_id is null then raise exception 'AUTH_REQUIRED'; end if;
  if p_side is null or p_side not in ('buy','sell') then raise exception 'INVALID_SIDE'; end if;
  if p_order_type is null or p_order_type not in ('market','limit') then raise exception 'INVALID_ORDER_TYPE'; end if;
  if p_quantity is null or p_quantity <= 0 or p_quantity > 10000000 then raise exception 'INVALID_QUANTITY'; end if;
  if p_order_type = 'limit' and (p_limit_price is null or p_limit_price <= 0) then raise exception 'INVALID_LIMIT_PRICE'; end if;
  if p_order_type = 'market' and p_limit_price is not null then raise exception 'MARKET_ORDER_HAS_LIMIT_PRICE'; end if;
  if p_client_order_id is null then raise exception 'CLIENT_ORDER_ID_REQUIRED'; end if;

  -- Serialise retries for the same account/client idempotency key.
  perform pg_advisory_xact_lock(hashtextextended(p_account_id::text || ':' || p_client_order_id::text, 0));

  select * into v_account from public.trading_accounts
  where id = p_account_id and user_id = v_user_id for update;
  if not found then raise exception 'ACCOUNT_NOT_FOUND'; end if;
  if v_account.account_type <> 'paper' or v_account.status <> 'active' then raise exception 'LIVE_TRADING_DISABLED'; end if;

  select * into v_existing from public.orders
  where trading_account_id = p_account_id and client_order_id = p_client_order_id;
  if found then
    return jsonb_build_object('order', to_jsonb(v_existing), 'idempotent', true);
  end if;

  select * into v_instrument from public.instrument_catalog
  where id = p_instrument_id and is_enabled = true;
  if not found then raise exception 'INSTRUMENT_NOT_AVAILABLE'; end if;
  if v_instrument.quote_currency <> v_account.currency then
    raise exception 'CURRENCY_NOT_SUPPORTED';
  end if;

  select * into v_quote from public.market_quotes
  where instrument_id = p_instrument_id;
  if not found or v_quote.observed_at < now() - interval '60 seconds' or v_quote.observed_at > now() + interval '30 seconds' then raise exception 'QUOTE_MISSING_OR_STALE'; end if;

  select * into v_limits from public.risk_limits where trading_account_id = p_account_id;
  if not found then raise exception 'RISK_LIMITS_MISSING'; end if;

  v_estimated_price := v_quote.last_price * (
    1 + case when p_side = 'buy' then v_limits.slippage_bps else -v_limits.slippage_bps end / 10000
  );
  v_commitment_price := case when p_order_type = 'limit' then p_limit_price else v_estimated_price end;
  v_order_commitment := round(p_quantity * v_commitment_price, 2);
  if v_order_commitment > v_limits.max_order_notional then raise exception 'ORDER_NOTIONAL_LIMIT_EXCEEDED'; end if;

  select coalesce(quantity, 0) into v_current_qty
  from public.positions
  where trading_account_id = p_account_id and instrument_id = p_instrument_id;

  select id into v_cash_account_id
  from public.ledger_accounts
  where trading_account_id = p_account_id and account_code = 'cash';
  select coalesce(sum(case when le.direction = 'debit' then le.amount else -le.amount end), 0)
    into v_cash_available
  from public.ledger_entries le
  where le.ledger_account_id = v_cash_account_id;

  select coalesce(sum(o.quantity * coalesce(o.limit_price, v_estimated_price)), 0)
    into v_reserved_buy
  from public.orders o
  where o.trading_account_id = p_account_id and o.side = 'buy' and o.status = 'open';
  select coalesce(sum(o.quantity * coalesce(o.limit_price, v_estimated_price)), 0)
    into v_reserved_buy_instrument
  from public.orders o
  where o.trading_account_id = p_account_id and o.instrument_id = p_instrument_id
    and o.side = 'buy' and o.status = 'open';
  select coalesce(sum(o.quantity), 0)
    into v_reserved_sell
  from public.orders o
  where o.trading_account_id = p_account_id and o.instrument_id = p_instrument_id
    and o.side = 'sell' and o.status = 'open';
  if p_side = 'buy' then
    select coalesce(sum(case when le.direction = 'debit' then le.amount else -le.amount end), 0)
    into v_daily_realized_loss
    from public.ledger_entries le
    join public.ledger_accounts la on la.id = le.ledger_account_id
    where la.trading_account_id = p_account_id
      and la.account_code = 'realized_pnl'
      and le.created_at >= date_trunc('day', now());
    if v_daily_realized_loss > v_limits.max_daily_realized_loss then
      raise exception 'DAILY_REALIZED_LOSS_LIMIT_EXCEEDED';
    end if;
  end if;

  if p_side = 'buy' then
    if v_cash_available < v_reserved_buy + v_order_commitment then
      raise exception 'INSUFFICIENT_PAPER_CASH_OR_RESERVED';
    end if;
    if (v_current_qty * v_estimated_price + v_reserved_buy_instrument + v_order_commitment) > v_limits.max_position_notional then
      raise exception 'POSITION_NOTIONAL_LIMIT_EXCEEDED';
    end if;
  end if;
  if p_side = 'sell' and (v_current_qty - v_reserved_sell) < p_quantity then
    raise exception 'INSUFFICIENT_PAPER_POSITION_OR_RESERVED';
  end if;

  v_marketable := p_order_type = 'market'
    or (p_side = 'buy' and p_limit_price >= v_estimated_price)
    or (p_side = 'sell' and p_limit_price <= v_estimated_price);

  insert into public.orders (
    trading_account_id, instrument_id, client_order_id, side, order_type,
    quantity, limit_price, status
  ) values (
    p_account_id, p_instrument_id, p_client_order_id, p_side, p_order_type,
    p_quantity, p_limit_price, 'open'
  ) returning id into v_order_id;

  if v_marketable then
    v_fill := private.execute_paper_fill(v_order_id, v_estimated_price);
  else
    v_fill := jsonb_build_object('filled', false, 'reason', 'limit_not_marketable_yet');
  end if;

  return jsonb_build_object(
    'order_id', v_order_id,
    'status', case when coalesce((v_fill ->> 'filled')::boolean, false) then 'filled' else 'open' end,
    'fill', v_fill,
    'simulated', true,
    'reference_source', v_quote.source,
    'reference_time', v_quote.observed_at
  );
end;
$$;

create or replace function private.match_open_orders(p_instrument_id uuid)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order public.orders%rowtype;
  v_quote public.market_quotes%rowtype;
  v_limits public.risk_limits%rowtype;
  v_price numeric(24,10);
  v_count integer := 0;
begin
  select * into v_quote from public.market_quotes
  where instrument_id = p_instrument_id and observed_at >= now() - interval '60 seconds';
  if not found then return 0; end if;

  for v_order in
    select * from public.orders
    where instrument_id = p_instrument_id and status = 'open' and order_type = 'limit'
    order by created_at asc
    for update
  loop
    select * into v_limits from public.risk_limits where trading_account_id = v_order.trading_account_id;
    v_price := v_quote.last_price * (
      1 + case when v_order.side = 'buy' then v_limits.slippage_bps else -v_limits.slippage_bps end / 10000
    );
    if (v_order.side = 'buy' and v_order.limit_price >= v_price)
       or (v_order.side = 'sell' and v_order.limit_price <= v_price) then
      begin
        perform private.execute_paper_fill(v_order.id, v_price);
        v_count := v_count + 1;
      exception when others then
        update public.orders
          set status = 'rejected', rejection_reason = left(sqlerrm, 240), updated_at = now()
          where id = v_order.id and status = 'open';
      end;
    end if;
  end loop;
  return v_count;
end;
$$;

create or replace function private.cancel_paper_order(p_order_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_order public.orders%rowtype;
begin
  if v_user_id is null then raise exception 'AUTH_REQUIRED'; end if;
  select o.* into v_order
  from public.orders o
  join public.trading_accounts a on a.id = o.trading_account_id
  where o.id = p_order_id and a.user_id = v_user_id and a.account_type = 'paper'
  for update of o;
  if not found then raise exception 'ORDER_NOT_FOUND'; end if;
  if v_order.status <> 'open' then raise exception 'ORDER_NOT_OPEN'; end if;
  update public.orders set status = 'cancelled', updated_at = now() where id = p_order_id;
  insert into public.audit_events (actor_id, trading_account_id, action, entity_type, entity_id)
  values (v_user_id, v_order.trading_account_id, 'paper_order_cancelled', 'order', p_order_id);
  return jsonb_build_object('order_id', p_order_id, 'status', 'cancelled');
end;
$$;

create or replace function public.open_paper_account()
returns jsonb language sql security invoker set search_path = ''
as $$ select private.open_paper_account(); $$;

create or replace function public.submit_paper_order(
  p_account_id uuid, p_instrument_id uuid, p_side text, p_order_type text,
  p_quantity numeric, p_limit_price numeric, p_client_order_id uuid
)
returns jsonb language sql security invoker set search_path = ''
as $$ select private.submit_paper_order(p_account_id, p_instrument_id, p_side, p_order_type, p_quantity, p_limit_price, p_client_order_id); $$;

create or replace function public.cancel_paper_order(p_order_id uuid)
returns jsonb language sql security invoker set search_path = ''
as $$ select private.cancel_paper_order(p_order_id); $$;

create or replace function public.process_market_quote(p_instrument_id uuid)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
begin
  if coalesce(auth.jwt() ->> 'role', '') <> 'service_role' then raise exception 'SERVICE_ROLE_REQUIRED'; end if;
  return private.match_open_orders(p_instrument_id);
end;
$$;

revoke all on function private.open_paper_account() from public, anon;
revoke all on function private.submit_paper_order(uuid,uuid,text,text,numeric,numeric,uuid) from public, anon;
revoke all on function private.cancel_paper_order(uuid) from public, anon;

create or replace function private.match_user_paper_orders(p_instrument_id uuid, p_account_id uuid)
returns integer
language plpgsql
security definer
set search_path = ''
as $
declare
  v_order public.orders%rowtype;
  v_quote public.market_quotes%rowtype;
  v_limits public.risk_limits%rowtype;
  v_price numeric(24,10);
  v_count integer := 0;
begin
  if auth.uid() is null or not exists (
    select 1 from public.trading_accounts
    where id = p_account_id and user_id = auth.uid()
      and account_type = 'paper' and status = 'active'
  ) then
    raise exception 'PAPER_ACCOUNT_NOT_OWNED';
  end if;

  select * into v_quote from public.market_quotes
  where instrument_id = p_instrument_id
    and observed_at >= now() - interval '60 seconds'
    and observed_at <= now() + interval '30 seconds';
  if not found then return 0; end if;

  for v_order in
    select * from public.orders
    where instrument_id = p_instrument_id
      and trading_account_id = p_account_id
      and status = 'open' and order_type = 'limit'
    order by created_at asc
    for update
  loop
    select * into v_limits from public.risk_limits
    where trading_account_id = v_order.trading_account_id;
    v_price := v_quote.last_price * (
      1 + case when v_order.side = 'buy' then v_limits.slippage_bps else -v_limits.slippage_bps end / 10000
    );
    if (v_order.side = 'buy' and v_order.limit_price >= v_price)
       or (v_order.side = 'sell' and v_order.limit_price <= v_price) then
      begin
        perform private.execute_paper_fill(v_order.id, v_price);
        v_count := v_count + 1;
      exception when others then
        update public.orders
          set status = 'rejected', rejection_reason = left(sqlerrm, 240), updated_at = now()
          where id = v_order.id and status = 'open';
      end;
    end if;
  end loop;
  return v_count;
end;
$;

create or replace function public.process_my_paper_quote(p_instrument_id uuid, p_account_id uuid)
returns integer
language plpgsql
security invoker
set search_path = ''
as $
begin
  if auth.uid() is null then raise exception 'AUTH_REQUIRED'; end if;
  return private.match_user_paper_orders(p_instrument_id, p_account_id);
end;
$;

revoke all on function private.match_open_orders(uuid) from public, anon, authenticated;
revoke all on function private.execute_paper_fill(uuid,numeric) from public, anon, authenticated, service_role;
revoke all on function public.open_paper_account() from public, anon;
revoke all on function public.submit_paper_order(uuid,uuid,text,text,numeric,numeric,uuid) from public, anon;
revoke all on function public.cancel_paper_order(uuid) from public, anon;
revoke all on function public.process_market_quote(uuid) from public, anon, authenticated;
grant execute on function private.open_paper_account() to authenticated;
grant execute on function private.submit_paper_order(uuid,uuid,text,text,numeric,numeric,uuid) to authenticated;
grant execute on function private.cancel_paper_order(uuid) to authenticated;
grant execute on function public.open_paper_account() to authenticated;
grant execute on function public.submit_paper_order(uuid,uuid,text,text,numeric,numeric,uuid) to authenticated;
grant execute on function public.cancel_paper_order(uuid) to authenticated;
grant execute on function public.process_market_quote(uuid) to service_role;
revoke all on function private.match_user_paper_orders(uuid,uuid) from public, anon;
grant execute on function private.match_user_paper_orders(uuid,uuid) to authenticated;
revoke all on function public.process_my_paper_quote(uuid,uuid) from public, anon;
grant execute on function public.process_my_paper_quote(uuid,uuid) to authenticated;

-- Ledger history is append-only and each journal transaction must balance.
create or replace function private.reject_ledger_mutation()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  raise exception 'LEDGER_IS_IMMUTABLE_USE_A_COMPENSATING_TRANSACTION';
end;
$$;
revoke all on function private.reject_ledger_mutation() from public, anon, authenticated;

-- Audit events are append-only. Operational corrections are new events, not edits.
drop trigger if exists audit_events_no_mutation on public.audit_events;
create trigger audit_events_no_mutation
before update or delete on public.audit_events
for each row execute function private.reject_ledger_mutation();


drop trigger if exists ledger_entries_no_mutation on public.ledger_entries;
create trigger ledger_entries_no_mutation
before update or delete on public.ledger_entries
for each row execute function private.reject_ledger_mutation();

drop trigger if exists ledger_transactions_no_mutation on public.ledger_transactions;
create trigger ledger_transactions_no_mutation
before update or delete on public.ledger_transactions
for each row execute function private.reject_ledger_mutation();

create or replace function private.assert_ledger_transaction_balanced()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_transaction_id uuid;
  v_debits numeric(24,2);
  v_credits numeric(24,2);
begin
  if tg_table_name = 'ledger_transactions' then
    v_transaction_id := new.id;
  else
    v_transaction_id := new.transaction_id;
  end if;

  select
    coalesce(sum(case when direction = 'debit' then amount else 0 end), 0),
    coalesce(sum(case when direction = 'credit' then amount else 0 end), 0)
  into v_debits, v_credits
  from public.ledger_entries
  where transaction_id = v_transaction_id;

  if v_debits <= 0 or v_debits <> v_credits then
    raise exception 'UNBALANCED_LEDGER_TRANSACTION: transaction %, debits %, credits %',
      v_transaction_id, v_debits, v_credits;
  end if;
  return null;
end;
$$;
revoke all on function private.assert_ledger_transaction_balanced() from public, anon, authenticated;

drop trigger if exists ledger_transaction_must_balance on public.ledger_transactions;
create constraint trigger ledger_transaction_must_balance
after insert on public.ledger_transactions
deferrable initially deferred
for each row execute function private.assert_ledger_transaction_balanced();

drop trigger if exists ledger_entries_must_balance on public.ledger_entries;
create constraint trigger ledger_entries_must_balance
after insert on public.ledger_entries
deferrable initially deferred
for each row execute function private.assert_ledger_transaction_balanced();
