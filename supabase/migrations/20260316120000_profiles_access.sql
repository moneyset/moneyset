-- MONEYSET profiles + access roles (run in Supabase SQL editor or via CLI)

create type public.user_role as enum ('admin', 'beta', 'premium', 'guest');

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  role public.user_role not null default 'guest',
  access_tier text not null default 'free' check (access_tier in ('free', 'premium')),
  founding_access boolean not null default false,
  premium_until timestamptz,
  telegram_user_id bigint unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists profiles_role_idx on public.profiles (role);
create index if not exists profiles_telegram_idx on public.profiles (telegram_user_id);

alter table public.profiles enable row level security;

create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles_update_own_limited"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Service role manages tier upgrades via API routes / webhooks

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, role, access_tier)
  values (new.id, new.email, 'guest', 'free')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
