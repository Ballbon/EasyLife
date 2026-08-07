begin;

set local role postgres;
create extension if not exists pgtap with schema extensions;
set local search_path = extensions, public;
select plan(30);

select ok(
  (select bool_and(relrowsecurity)
   from pg_class
   where oid = any(array[
     'public.profiles'::regclass,
     'public.category_templates'::regclass,
     'public.accounts'::regclass,
     'public.categories'::regclass,
     'public.transactions'::regclass,
     'public.budgets'::regclass,
     'public.financial_plans'::regclass,
     'public.plan_allocations'::regclass,
     'public.tasks'::regclass,
     'public.task_schedules'::regclass,
     'public.task_completions'::regclass,
     'public.financial_goals'::regclass
   ])),
  'RLS is enabled on every application table'
);

select is(
  (select count(*)::integer
   from pg_policies
   where schemaname = 'public'
     and tablename = any(array[
       'profiles', 'category_templates', 'accounts', 'categories',
       'transactions', 'budgets', 'financial_plans', 'plan_allocations',
       'tasks', 'task_schedules', 'task_completions', 'financial_goals'
     ])),
  12,
  'every application table has an RLS policy'
);

select ok(
  not has_function_privilege('anon', 'public.complete_onboarding(text,text,text,bigint)', 'EXECUTE'),
  'anon cannot execute complete_onboarding'
);
select ok(
  not has_function_privilege('anon', 'public.save_financial_plan(date,bigint,jsonb)', 'EXECUTE'),
  'anon cannot execute save_financial_plan'
);
select ok(
  not has_function_privilege('anon', 'public.save_quest(uuid,text,text,text,smallint,date,date,text,smallint[],time)', 'EXECUTE'),
  'anon cannot execute save_quest'
);
select ok(
  not has_function_privilege('anon', 'public.set_quest_completion(uuid,date,boolean)', 'EXECUTE'),
  'anon cannot execute set_quest_completion'
);
select ok(
  not has_function_privilege('anon', 'public.handle_new_user()', 'EXECUTE'),
  'anon cannot execute the auth trigger helper'
);
select ok(
  not has_function_privilege('authenticated', 'public.handle_new_user()', 'EXECUTE'),
  'authenticated cannot execute the auth trigger helper'
);
select ok(
  coalesce(
    not has_function_privilege('anon', to_regprocedure('public.rls_auto_enable()'), 'EXECUTE'),
    true
  ),
  'anon cannot execute the RLS event-trigger helper'
);
select ok(
  coalesce(
    not has_function_privilege('authenticated', to_regprocedure('public.rls_auto_enable()'), 'EXECUTE'),
    true
  ),
  'authenticated cannot execute the RLS event-trigger helper'
);
select ok(
  has_function_privilege('authenticated', 'public.complete_onboarding(text,text,text,bigint)', 'EXECUTE'),
  'authenticated can execute complete_onboarding'
);
select ok(
  has_function_privilege('authenticated', 'public.save_financial_plan(date,bigint,jsonb)', 'EXECUTE'),
  'authenticated can execute save_financial_plan'
);
select ok(
  has_function_privilege('authenticated', 'public.save_quest(uuid,text,text,text,smallint,date,date,text,smallint[],time)', 'EXECUTE'),
  'authenticated can execute save_quest'
);
select ok(
  has_function_privilege('authenticated', 'public.set_quest_completion(uuid,date,boolean)', 'EXECUTE'),
  'authenticated can execute set_quest_completion'
);

select ok(not has_table_privilege('anon', 'public.profiles', 'SELECT'), 'anon cannot read profiles');
select ok(not has_table_privilege('anon', 'public.accounts', 'SELECT'), 'anon cannot read accounts');
select ok(not has_table_privilege('anon', 'public.categories', 'SELECT'), 'anon cannot read categories');
select ok(not has_table_privilege('anon', 'public.transactions', 'SELECT'), 'anon cannot read transactions');
select ok(not has_table_privilege('anon', 'public.budgets', 'SELECT'), 'anon cannot read budgets');
select ok(not has_table_privilege('anon', 'public.financial_plans', 'SELECT'), 'anon cannot read plans');
select ok(not has_table_privilege('anon', 'public.plan_allocations', 'SELECT'), 'anon cannot read allocations');
select ok(not has_table_privilege('anon', 'public.tasks', 'SELECT'), 'anon cannot read tasks');
select ok(not has_table_privilege('anon', 'public.task_schedules', 'SELECT'), 'anon cannot read schedules');
select ok(not has_table_privilege('anon', 'public.task_completions', 'SELECT'), 'anon cannot read completions');
select ok(not has_table_privilege('anon', 'public.financial_goals', 'SELECT'), 'anon cannot read goals');
select ok(not has_table_privilege('anon', 'public.category_templates', 'SELECT'), 'anon cannot read templates');

select ok(has_table_privilege('authenticated', 'public.accounts', 'SELECT'), 'authenticated can read accounts');
select ok(has_table_privilege('authenticated', 'public.transactions', 'INSERT'), 'authenticated can insert transactions');
select ok(has_table_privilege('authenticated', 'public.tasks', 'UPDATE'), 'authenticated can update tasks');
select ok(has_table_privilege('authenticated', 'public.financial_goals', 'DELETE'), 'authenticated can delete goals');

select * from finish();
rollback;
