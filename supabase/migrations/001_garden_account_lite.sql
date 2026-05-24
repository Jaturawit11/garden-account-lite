create extension if not exists pgcrypto;

do $$ begin
  create type transaction_type as enum (
    'plant_purchase',
    'sale',
    'business_expense',
    'personal_expense',
    'wallet_transfer',
    'other_income'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type wallet_name as enum ('time', 'nisa');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type payment_status as enum ('paid', 'unpaid', 'partial');
exception when duplicate_object then null;
end $$;

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  transaction_date date not null default current_date,
  type transaction_type not null,
  description text,
  customer_name text,
  wallet_from wallet_name,
  wallet_to wallet_name,
  amount numeric(12,2) not null default 0 check (amount >= 0),
  paid_amount numeric(12,2) not null default 0 check (paid_amount >= 0),
  payment_status payment_status not null default 'paid',
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.sale_items (
  id uuid primary key default gen_random_uuid(),
  transaction_id uuid not null references public.transactions(id) on delete cascade,
  plant_name text not null,
  cost numeric(12,2) not null default 0 check (cost >= 0),
  sale_price numeric(12,2) not null default 0 check (sale_price >= 0),
  profit numeric(12,2) generated always as (sale_price - cost) stored,
  created_at timestamptz not null default now()
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  table_name text not null,
  record_id uuid not null,
  action text not null check (action in ('update', 'delete')),
  old_data jsonb,
  new_data jsonb,
  changed_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_transactions_updated_at on public.transactions;
create trigger trg_transactions_updated_at
before update on public.transactions
for each row execute function public.set_updated_at();

create or replace function public.write_audit_log()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'UPDATE' then
    insert into public.audit_logs(table_name, record_id, action, old_data, new_data)
    values (tg_table_name, old.id, 'update', to_jsonb(old), to_jsonb(new));
    return new;
  elsif tg_op = 'DELETE' then
    insert into public.audit_logs(table_name, record_id, action, old_data, new_data)
    values (tg_table_name, old.id, 'delete', to_jsonb(old), null);
    return old;
  end if;
  return null;
end;
$$;

drop trigger if exists trg_transactions_audit on public.transactions;
create trigger trg_transactions_audit
after update or delete on public.transactions
for each row execute function public.write_audit_log();

drop trigger if exists trg_sale_items_audit on public.sale_items;
create trigger trg_sale_items_audit
after update or delete on public.sale_items
for each row execute function public.write_audit_log();

create index if not exists idx_transactions_date on public.transactions(transaction_date desc);
create index if not exists idx_transactions_type on public.transactions(type);
create index if not exists idx_transactions_customer on public.transactions using gin (to_tsvector('simple', coalesce(customer_name, '')));
create index if not exists idx_sale_items_plant on public.sale_items using gin (to_tsvector('simple', plant_name));

alter table public.transactions enable row level security;
alter table public.sale_items enable row level security;
alter table public.audit_logs enable row level security;

drop policy if exists "Allow anon full access transactions" on public.transactions;
create policy "Allow anon full access transactions"
on public.transactions for all
using (true)
with check (true);

drop policy if exists "Allow anon full access sale_items" on public.sale_items;
create policy "Allow anon full access sale_items"
on public.sale_items for all
using (true)
with check (true);

drop policy if exists "Allow anon read audit_logs" on public.audit_logs;
create policy "Allow anon read audit_logs"
on public.audit_logs for select
using (true);
