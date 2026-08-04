create extension if not exists pgcrypto with schema extensions;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  currency text not null default 'THB' check (currency = 'THB'),
  timezone text not null default 'Asia/Bangkok' check (timezone = 'Asia/Bangkok'),
  onboarding_completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.category_templates (
  code text primary key,
  name_th text not null,
  transaction_type text not null check (transaction_type in ('income', 'expense')),
  color text not null check (color ~ '^#[0-9A-Fa-f]{6}$'),
  icon text not null,
  sort_order smallint not null default 0
);

create table public.accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 80),
  account_type text not null check (account_type in ('cash', 'bank', 'card', 'ewallet')),
  initial_balance_satang bigint not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, user_id)
);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 80),
  transaction_type text not null check (transaction_type in ('income', 'expense')),
  color text not null check (color ~ '^#[0-9A-Fa-f]{6}$'),
  icon text not null,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, user_id)
);

create unique index categories_unique_name_per_type
  on public.categories (user_id, transaction_type, lower(name));

create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  account_id uuid not null,
  destination_account_id uuid,
  category_id uuid,
  transaction_type text not null check (transaction_type in ('income', 'expense', 'transfer')),
  amount_satang bigint not null check (amount_satang between 1 and 99999999999),
  occurred_at timestamptz not null,
  note text check (note is null or char_length(note) <= 500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint transactions_account_owner_fk foreign key (account_id, user_id)
    references public.accounts(id, user_id),
  constraint transactions_destination_owner_fk foreign key (destination_account_id, user_id)
    references public.accounts(id, user_id),
  constraint transactions_category_owner_fk foreign key (category_id, user_id)
    references public.categories(id, user_id),
  constraint transactions_shape_check check (
    (transaction_type = 'transfer' and destination_account_id is not null and
      destination_account_id <> account_id and category_id is null)
    or
    (transaction_type in ('income', 'expense') and destination_account_id is null and
      category_id is not null)
  )
);

create index transactions_user_occurred_idx
  on public.transactions (user_id, occurred_at desc);
create index transactions_user_category_idx
  on public.transactions (user_id, category_id, occurred_at desc);

create table public.budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category_id uuid not null,
  month date not null check (month = date_trunc('month', month)::date),
  limit_satang bigint not null check (limit_satang > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint budgets_category_owner_fk foreign key (category_id, user_id)
    references public.categories(id, user_id),
  unique (user_id, category_id, month)
);

create table public.financial_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  month date not null check (month = date_trunc('month', month)::date),
  expected_income_satang bigint not null check (expected_income_satang > 0),
  status text not null default 'draft' check (status in ('draft', 'active', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, user_id),
  unique (user_id, month)
);

create table public.plan_allocations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  financial_plan_id uuid not null,
  category_id uuid,
  name text not null check (char_length(name) between 1 and 80),
  allocation_type text not null check (allocation_type in ('percentage', 'fixed')),
  percentage numeric(5,2),
  planned_amount_satang bigint,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint allocations_plan_owner_fk foreign key (financial_plan_id, user_id)
    references public.financial_plans(id, user_id) on delete cascade,
  constraint allocations_category_owner_fk foreign key (category_id, user_id)
    references public.categories(id, user_id),
  constraint allocations_value_check check (
    (allocation_type = 'percentage' and percentage between 0.01 and 100.00 and planned_amount_satang is null)
    or
    (allocation_type = 'fixed' and percentage is null and planned_amount_satang > 0)
  )
);

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 120),
  description text check (description is null or char_length(description) <= 1000),
  priority text not null default 'normal' check (priority in ('low', 'normal', 'high')),
  points smallint not null default 5 check (points between 1 and 100),
  start_date date not null,
  end_date date,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, user_id),
  check (end_date is null or end_date >= start_date)
);

create table public.task_schedules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  task_id uuid not null,
  frequency text not null check (frequency in ('once', 'daily', 'weekly')),
  days_of_week smallint[],
  scheduled_time time,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint schedules_task_owner_fk foreign key (task_id, user_id)
    references public.tasks(id, user_id) on delete cascade,
  constraint schedules_days_check check (
    (frequency <> 'weekly' and days_of_week is null)
    or
    (frequency = 'weekly' and cardinality(days_of_week) between 1 and 7 and
      days_of_week <@ array[0,1,2,3,4,5,6]::smallint[])
  ),
  unique (task_id)
);

create table public.task_completions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  task_id uuid not null,
  scheduled_date date not null,
  completed_at timestamptz not null default now(),
  earned_points smallint not null check (earned_points between 1 and 100),
  constraint completions_task_owner_fk foreign key (task_id, user_id)
    references public.tasks(id, user_id) on delete cascade,
  unique (user_id, task_id, scheduled_date)
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();
create trigger accounts_set_updated_at before update on public.accounts
  for each row execute function public.set_updated_at();
create trigger categories_set_updated_at before update on public.categories
  for each row execute function public.set_updated_at();
create trigger transactions_set_updated_at before update on public.transactions
  for each row execute function public.set_updated_at();
create trigger budgets_set_updated_at before update on public.budgets
  for each row execute function public.set_updated_at();
create trigger plans_set_updated_at before update on public.financial_plans
  for each row execute function public.set_updated_at();
create trigger allocations_set_updated_at before update on public.plan_allocations
  for each row execute function public.set_updated_at();
create trigger tasks_set_updated_at before update on public.tasks
  for each row execute function public.set_updated_at();
create trigger schedules_set_updated_at before update on public.task_schedules
  for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.complete_onboarding(
  display_name_input text,
  account_name_input text,
  account_type_input text,
  initial_balance_satang_input bigint
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
begin
  if current_user_id is null then
    raise exception 'Authentication required';
  end if;
  if char_length(trim(display_name_input)) not between 2 and 80 then
    raise exception 'Invalid display name';
  end if;
  if char_length(trim(account_name_input)) not between 1 and 80 then
    raise exception 'Invalid account name';
  end if;
  if account_type_input not in ('cash', 'bank', 'card', 'ewallet') then
    raise exception 'Invalid account type';
  end if;

  update public.profiles
  set display_name = trim(display_name_input), onboarding_completed_at = now()
  where id = current_user_id;

  if not exists (select 1 from public.accounts where user_id = current_user_id) then
    insert into public.accounts (user_id, name, account_type, initial_balance_satang)
    values (current_user_id, trim(account_name_input), account_type_input, initial_balance_satang_input);
  end if;

  insert into public.categories (user_id, name, transaction_type, color, icon, is_default)
  select current_user_id, name_th, transaction_type, color, icon, true
  from public.category_templates
  on conflict do nothing;
end;
$$;

alter table public.profiles enable row level security;
alter table public.category_templates enable row level security;
alter table public.accounts enable row level security;
alter table public.categories enable row level security;
alter table public.transactions enable row level security;
alter table public.budgets enable row level security;
alter table public.financial_plans enable row level security;
alter table public.plan_allocations enable row level security;
alter table public.tasks enable row level security;
alter table public.task_schedules enable row level security;
alter table public.task_completions enable row level security;

create policy "templates are readable by authenticated users" on public.category_templates
  for select to authenticated using (true);

create policy "users manage own profile" on public.profiles
  for all to authenticated using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);
create policy "users manage own accounts" on public.accounts
  for all to authenticated using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "users manage own categories" on public.categories
  for all to authenticated using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "users manage own transactions" on public.transactions
  for all to authenticated using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "users manage own budgets" on public.budgets
  for all to authenticated using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "users manage own plans" on public.financial_plans
  for all to authenticated using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "users manage own allocations" on public.plan_allocations
  for all to authenticated using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "users manage own tasks" on public.tasks
  for all to authenticated using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "users manage own schedules" on public.task_schedules
  for all to authenticated using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "users manage own completions" on public.task_completions
  for all to authenticated using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

grant usage on schema public to anon, authenticated;
grant select on public.category_templates to authenticated;
grant select, insert, update, delete on public.profiles, public.accounts, public.categories,
  public.transactions, public.budgets, public.financial_plans, public.plan_allocations,
  public.tasks, public.task_schedules, public.task_completions to authenticated;
grant execute on function public.complete_onboarding(text, text, text, bigint) to authenticated;
revoke all on function public.complete_onboarding(text, text, text, bigint) from anon;
