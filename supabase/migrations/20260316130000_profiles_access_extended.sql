-- Extend profiles: access_level, subscription_status, payment metadata

alter table public.profiles
  add column if not exists access_level text not null default 'free'
    check (access_level in ('free', 'premium', 'founding', 'admin'));

alter table public.profiles
  add column if not exists subscription_status text not null default 'inactive'
    check (subscription_status in ('inactive', 'trial', 'active', 'founding', 'past_due', 'expired', 'canceled'));

alter table public.profiles
  add column if not exists last_payment_order_id text;

create index if not exists profiles_access_level_idx on public.profiles (access_level);
create index if not exists profiles_subscription_status_idx on public.profiles (subscription_status);
