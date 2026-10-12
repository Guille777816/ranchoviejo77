create or replace function public.admin_email_status(_emails text[])
returns table(recipient_email text, status text, error_message text, created_at timestamptz)
language sql
stable
security definer
set search_path = public
as $$
  select l.recipient_email, l.status, l.error_message, l.created_at
  from public.email_send_log l
  join (
    select recipient_email as em, max(created_at) as mx
    from public.email_send_log
    where recipient_email = any(_emails)
    group by recipient_email
  ) latest on latest.em = l.recipient_email and latest.mx = l.created_at
  where public.has_role(auth.uid(), 'admin')
$$;

grant execute on function public.admin_email_status(text[]) to authenticated;

create or replace function public.admin_update_order_email(_order_id uuid, _email text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.has_role(auth.uid(), 'admin') then
    raise exception 'Unauthorized';
  end if;
  if _email is null or position('@' in _email) < 2 then
    raise exception 'Email inválido';
  end if;
  update public.orders set customer_email = _email where id = _order_id;
end;
$$;

grant execute on function public.admin_update_order_email(uuid, text) to authenticated;