-- Invitation access + profile invitation window

alter table public.profiles
  add column if not exists invitation_until timestamptz;

alter table public.profiles drop constraint if exists profiles_access_level_check;
alter table public.profiles
  add constraint profiles_access_level_check
  check (access_level in ('free', 'premium', 'founding', 'admin', 'invitation'));

create table if not exists public.invitation_codes (
  code text primary key,
  label text,
  duration_days integer not null default 7,
  code_expires_at timestamptz,
  max_uses integer not null default 1,
  use_count integer not null default 0,
  disabled boolean not null default false,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users (id) on delete set null
);

create table if not exists public.invitation_redemptions (
  id uuid primary key default gen_random_uuid(),
  code text not null references public.invitation_codes (code) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  redeemed_at timestamptz not null default now(),
  invitation_until timestamptz not null,
  unique (code, user_id)
);

create index if not exists invitation_redemptions_user_idx on public.invitation_redemptions (user_id);
create index if not exists invitation_codes_disabled_idx on public.invitation_codes (disabled);

alter table public.invitation_codes enable row level security;
alter table public.invitation_redemptions enable row level security;
