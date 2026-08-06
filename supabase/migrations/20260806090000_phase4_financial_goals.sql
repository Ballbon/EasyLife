create table public.financial_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 80),
  target_amount_satang bigint not null check (target_amount_satang > 0),
  saved_amount_satang bigint not null default 0 check (saved_amount_satang >= 0),
  target_date date,
  color text not null default '#9155FD' check (color ~ '^#[0-9A-Fa-f]{6}$'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (target_date is null or target_date >= created_at::date)
);

create trigger goals_set_updated_at before update on public.financial_goals
  for each row execute function public.set_updated_at();

alter table public.financial_goals enable row level security;

create policy "users manage own financial goals" on public.financial_goals
  for all to authenticated using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

grant select, insert, update, delete on public.financial_goals to authenticated;

create or replace function public.save_financial_plan(
  month_input date,
  expected_income_satang_input bigint,
  allocations_input jsonb
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  plan_id uuid;
  percentage_total numeric;
  amount_total numeric;
begin
  if current_user_id is null then
    raise exception 'Authentication required';
  end if;
  if month_input <> date_trunc('month', month_input)::date then
    raise exception 'Month must be the first day of the month';
  end if;
  if expected_income_satang_input <= 0 then
    raise exception 'Expected income must be greater than zero';
  end if;
  if jsonb_typeof(allocations_input) <> 'array' then
    raise exception 'Allocations must be an array';
  end if;

  select
    coalesce(sum(case when allocation_type = 'percentage' then percentage else 0 end), 0),
    coalesce(sum(case
      when allocation_type = 'percentage'
        then round(expected_income_satang_input * percentage / 100)
      else planned_amount_satang
    end), 0)
  into percentage_total, amount_total
  from jsonb_to_recordset(allocations_input) as item(
    name text,
    allocation_type text,
    percentage numeric,
    planned_amount_satang bigint,
    category_id uuid
  );

  if percentage_total > 100 then
    raise exception 'Allocation percentage exceeds 100%%';
  end if;
  if amount_total > expected_income_satang_input then
    raise exception 'Allocated amount exceeds expected income';
  end if;

  insert into public.financial_plans (user_id, month, expected_income_satang, status)
  values (current_user_id, month_input, expected_income_satang_input, 'active')
  on conflict (user_id, month) do update set
    expected_income_satang = excluded.expected_income_satang,
    status = 'active'
  returning id into plan_id;

  delete from public.plan_allocations
  where financial_plan_id = plan_id and user_id = current_user_id;

  insert into public.plan_allocations (
    user_id, financial_plan_id, category_id, name, allocation_type,
    percentage, planned_amount_satang
  )
  select
    current_user_id,
    plan_id,
    item.category_id,
    trim(item.name),
    item.allocation_type,
    case when item.allocation_type = 'percentage' then item.percentage end,
    case when item.allocation_type = 'fixed' then item.planned_amount_satang end
  from jsonb_to_recordset(allocations_input) as item(
    name text,
    allocation_type text,
    percentage numeric,
    planned_amount_satang bigint,
    category_id uuid
  );

  return plan_id;
end;
$$;

grant execute on function public.save_financial_plan(date, bigint, jsonb) to authenticated;
revoke all on function public.save_financial_plan(date, bigint, jsonb) from anon;
