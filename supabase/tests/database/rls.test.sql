begin;

create extension if not exists pgtap with schema extensions;
select plan(11);

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

insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at)
values
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'one@example.com', '', now()),
  ('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'two@example.com', '', now());

insert into public.accounts (id, user_id, name, account_type)
values
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'User one cash', 'cash'),
  ('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000002', 'User two cash', 'cash');

set local role authenticated;
set local "request.jwt.claim.sub" = '00000000-0000-0000-0000-000000000001';

select results_eq(
  'select count(*) from public.profiles',
  'values (1::bigint)',
  'a user sees only their profile'
);
select results_eq(
  'select count(*) from public.accounts',
  'values (1::bigint)',
  'a user sees only their accounts'
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
