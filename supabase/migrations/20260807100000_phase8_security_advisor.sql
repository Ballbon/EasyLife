-- Trigger helpers run internally and must not be exposed as Data API RPCs.
revoke all on function public.handle_new_user() from public, anon, authenticated;

-- Hosted projects may include this platform event-trigger helper in public.
-- It is absent from some local stacks, so revoke it conditionally.
do $$
begin
  if to_regprocedure('public.rls_auto_enable()') is not null then
    execute 'revoke all on function public.rls_auto_enable() from public, anon, authenticated';
  end if;
end
$$;
