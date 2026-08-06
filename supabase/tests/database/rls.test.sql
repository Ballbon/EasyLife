begin;

create extension if not exists pgtap with schema extensions;
select plan(25);

select ok(
  (select relrowsecurity from pg_class where oid = 'public.profiles'::regclass),
  'RLS is enabled on profiles'
);
select ok(
  (select relrowsecurity from pg_class where oid = 'public.accounts'::regclass),
  'RLS is enabled on accounts'
);
select ok(
  (select relrowsecurity from pg_class where oid = 'public.transactions'::regclass),
  'RLS is enabled on transactions'
);
select ok(
  (select relrowsecurity from pg_class where oid = 'public.financial_goals'::regclass),
  'RLS is enabled on financial goals'
);

insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at)
values
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'one@example.com', '', now()),
  ('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'two@example.com', '', now());

insert into public.accounts (id, user_id, name, account_type)
values
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'User one cash', 'cash'),
  ('10000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'User one bank', 'bank'),
  ('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000002', 'User two cash', 'cash');

insert into public.financial_goals (user_id, name, target_amount_satang)
values
  ('00000000-0000-0000-0000-000000000001', 'User one goal', 100000),
  ('00000000-0000-0000-0000-000000000002', 'User two goal', 200000);

set local role authenticated;
set local "request.jwt.claim.sub" = '00000000-0000-0000-0000-000000000001';

select results_eq(
  'select count(*) from public.profiles',
  'values (1::bigint)',
  'a user sees only their profile'
);
select results_eq(
  'select count(*) from public.accounts',
  'values (2::bigint)',
  'a user sees only their accounts'
);
select results_eq(
  'select count(*) from public.financial_goals',
  'values (1::bigint)',
  'a user sees only their financial goals'
);
select lives_ok(
  $$insert into public.accounts (user_id, name, account_type)
    values ('00000000-0000-0000-0000-000000000001', 'My bank', 'bank')$$,
  'a user can insert their own account'
);
select throws_ok(
  $$insert into public.accounts (user_id, name, account_type)
    values ('00000000-0000-0000-0000-000000000002', 'Not mine', 'bank')$$,
  '42501',
  null,
  'a user cannot insert another users account'
);
select lives_ok(
  $$select public.complete_onboarding('User One', 'Cash', 'cash', 125050)$$,
  'authenticated user can complete onboarding'
);
select results_eq(
  $$select count(*) from public.profiles where onboarding_completed_at is not null$$,
  'values (1::bigint)',
  'onboarding completes the current profile'
);
select results_eq(
  $$select count(*) from public.categories where is_default$$,
  $$select count(*) from public.category_templates$$,
  'onboarding copies every category template'
);
select lives_ok(
  $$select public.save_financial_plan(
      '2026-08-01',
      3000000,
      '[{"name":"Needs","allocation_type":"percentage","percentage":50,"planned_amount_satang":null,"category_id":null},{"name":"Savings","allocation_type":"fixed","percentage":null,"planned_amount_satang":1000000,"category_id":null}]'::jsonb
    )$$,
  'a financial plan within expected income is saved atomically'
);
select throws_ok(
  $$select public.save_financial_plan(
      '2026-09-01',
      3000000,
      '[{"name":"Too much","allocation_type":"percentage","percentage":80,"planned_amount_satang":null,"category_id":null},{"name":"Also too much","allocation_type":"fixed","percentage":null,"planned_amount_satang":1000000,"category_id":null}]'::jsonb
    )$$,
  'P0001',
  null,
  'a financial plan cannot allocate more than expected income'
);
select lives_ok(
  $$insert into public.transactions
      (user_id, account_id, category_id, transaction_type, amount_satang, occurred_at)
    select '00000000-0000-0000-0000-000000000001',
      '10000000-0000-0000-0000-000000000001', id, 'expense', 8050, now()
    from public.categories where transaction_type = 'expense' limit 1$$,
  'a user can create an expense with a matching category'
);
select lives_ok(
  $$insert into public.transactions
      (user_id, account_id, destination_account_id, transaction_type, amount_satang, occurred_at)
    values ('00000000-0000-0000-0000-000000000001',
      '10000000-0000-0000-0000-000000000001',
      '10000000-0000-0000-0000-000000000003', 'transfer', 10000, now())$$,
  'a user can transfer between two owned accounts'
);
select throws_ok(
  $$insert into public.transactions
      (user_id, account_id, destination_account_id, transaction_type, amount_satang, occurred_at)
    values ('00000000-0000-0000-0000-000000000001',
      '10000000-0000-0000-0000-000000000001',
      '10000000-0000-0000-0000-000000000001', 'transfer', 10000, now())$$,
  '23514',
  null,
  'a transfer cannot use the same source and destination'
);
select throws_ok(
  $$insert into public.transactions
      (user_id, account_id, category_id, transaction_type, amount_satang, occurred_at)
    select '00000000-0000-0000-0000-000000000001',
      '10000000-0000-0000-0000-000000000001', id, 'expense', 5000, now()
    from public.categories where transaction_type = 'income' limit 1$$,
  '23503',
  null,
  'an expense cannot use an income category'
);
select lives_ok(
  $$select public.save_quest(
      null::uuid, 'Read 20 minutes', '', 'normal', 10::smallint,
      '2026-08-06'::date, null::date, 'weekly', array[4]::smallint[], '20:00'::time
    )$$,
  'a user can save a recurring quest atomically'
);
select results_eq(
  $$select count(*) from public.tasks where title = 'Read 20 minutes'$$,
  'values (1::bigint)',
  'the saved quest belongs to the current user'
);
select lives_ok(
  $$select public.set_quest_completion(
      (select id from public.tasks where title = 'Read 20 minutes'),
      '2026-08-06', true
    )$$,
  'a scheduled quest can be completed'
);
select lives_ok(
  $$select public.set_quest_completion(
      (select id from public.tasks where title = 'Read 20 minutes'),
      '2026-08-06', true
    )$$,
  'completing the same occurrence twice is idempotent'
);
select results_eq(
  $$select count(*) from public.task_completions where scheduled_date = '2026-08-06'$$,
  'values (1::bigint)',
  'duplicate completion does not add points twice'
);
select throws_ok(
  $$select public.set_quest_completion(
      (select id from public.tasks where title = 'Read 20 minutes'),
      '2026-08-07', true
    )$$,
  'P0001',
  null,
  'an unscheduled occurrence cannot be completed'
);

set local role anon;
set local "request.jwt.claim.sub" = '';
select throws_ok(
  'select count(*) from public.category_templates',
  '42501',
  null,
  'anonymous users cannot read category templates'
);

select * from finish();
rollback;
