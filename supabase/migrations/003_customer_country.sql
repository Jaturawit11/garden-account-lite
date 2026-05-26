alter table public.transactions
add column if not exists customer_country text;

alter table public.transactions
drop constraint if exists transactions_customer_country_check;

alter table public.transactions
add constraint transactions_customer_country_check
check (
  customer_country is null
  or customer_country in ('TH', 'US', 'PH', 'VN', 'ID', 'SG')
);
