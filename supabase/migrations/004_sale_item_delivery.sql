alter table public.sale_items
add column if not exists delivery_status text not null default 'holding',
add column if not exists delivered_at timestamptz;

alter table public.sale_items
drop constraint if exists sale_items_delivery_status_check;

alter table public.sale_items
add constraint sale_items_delivery_status_check
check (delivery_status in ('holding', 'delivered'));
