-- PostgreSQL grants EXECUTE on new functions to PUBLIC by default. Keep every
-- application RPC private unless a role is explicitly listed here.
revoke all on function public.complete_onboarding(text, text, text, bigint)
  from public, anon;
revoke all on function public.save_financial_plan(date, bigint, jsonb)
  from public, anon;
revoke all on function public.save_quest(
  uuid, text, text, text, smallint, date, date, text, smallint[], time
) from public, anon;
revoke all on function public.set_quest_completion(uuid, date, boolean)
  from public, anon;

grant execute on function public.complete_onboarding(text, text, text, bigint)
  to authenticated;
grant execute on function public.save_financial_plan(date, bigint, jsonb)
  to authenticated;
grant execute on function public.save_quest(
  uuid, text, text, text, smallint, date, date, text, smallint[], time
) to authenticated;
grant execute on function public.set_quest_completion(uuid, date, boolean)
  to authenticated;
