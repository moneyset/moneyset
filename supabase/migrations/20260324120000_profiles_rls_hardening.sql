-- Prevent self-escalation: profile tier fields are service-role only.
drop policy if exists "profiles_update_own_limited" on public.profiles;
