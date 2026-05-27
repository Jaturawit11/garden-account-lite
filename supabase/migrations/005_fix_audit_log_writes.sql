create or replace function public.write_audit_log()
returns trigger
language plpgsql
security definer
set search_path = public
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

drop policy if exists "Allow anon insert audit_logs" on public.audit_logs;
create policy "Allow anon insert audit_logs"
on public.audit_logs for insert
with check (true);
