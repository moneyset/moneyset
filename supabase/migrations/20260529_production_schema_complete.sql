-- =============================================================================
-- MONEYSET production schema (complete, idempotent)
-- Project: krhfflntjnwfcdaktzjw
--
-- TABLES REFERENCED BY APPLICATION CODE (via supabaseAdmin().from(...)):
--   public.profiles              — auth link, roles, subscription_status, premium_until, entitlements source
--   public.payments              — NOWPayments billing records
--   public.invitation_codes      — invite code admin
--   public.invitation_redemptions — invite redemption audit
--
-- NOT SEPARATE DB TABLES (computed in application code):
--   subscriptions  → profiles.subscription_status + profiles.premium_until
--   entitlements   → entitlementsFor(profile) in src/lib/access/roles.ts
--   user_access    → not used; access stored on profiles.access_level / access_tier
--
-- MIGRATION SOURCES MERGED:
--   20260316120000_profiles_access.sql
--   20260316130000_profiles_access_extended.sql
--   20260323120000_invitation_access.sql
--   20260324120000_profiles_rls_hardening.sql
--   20260527_payments_table.sql
-- =============================================================================

-- ── Enum ─────────────────────────────────────────────────────────────────────
DO $$
BEGIN
  CREATE TYPE public.user_role AS ENUM ('admin', 'beta', 'premium', 'guest');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ── Profiles (single source of truth for access + subscription state) ─────────
CREATE TABLE IF NOT EXISTS public.profiles (
  id                    UUID PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  email                 TEXT,
  role                  public.user_role NOT NULL DEFAULT 'guest',
  access_tier           TEXT NOT NULL DEFAULT 'free' CHECK (access_tier IN ('free', 'premium')),
  founding_access       BOOLEAN NOT NULL DEFAULT FALSE,
  premium_until         TIMESTAMPTZ,
  telegram_user_id      BIGINT UNIQUE,
  access_level          TEXT NOT NULL DEFAULT 'free',
  subscription_status   TEXT NOT NULL DEFAULT 'inactive',
  last_payment_order_id TEXT,
  invitation_until      TIMESTAMPTZ,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role public.user_role NOT NULL DEFAULT 'guest';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS access_tier TEXT NOT NULL DEFAULT 'free';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS founding_access BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS premium_until TIMESTAMPTZ;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS telegram_user_id BIGINT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS access_level TEXT NOT NULL DEFAULT 'free';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS subscription_status TEXT NOT NULL DEFAULT 'inactive';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_payment_order_id TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS invitation_until TIMESTAMPTZ;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_access_tier_check;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_access_tier_check CHECK (access_tier IN ('free', 'premium'));

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_access_level_check;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_access_level_check
  CHECK (access_level IN ('free', 'premium', 'founding', 'admin', 'invitation'));

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_subscription_status_check;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_subscription_status_check
  CHECK (subscription_status IN ('inactive', 'trial', 'active', 'founding', 'past_due', 'expired', 'canceled'));

CREATE UNIQUE INDEX IF NOT EXISTS profiles_telegram_idx ON public.profiles (telegram_user_id);
CREATE INDEX IF NOT EXISTS profiles_role_idx ON public.profiles (role);
CREATE INDEX IF NOT EXISTS profiles_access_level_idx ON public.profiles (access_level);
CREATE INDEX IF NOT EXISTS profiles_subscription_status_idx ON public.profiles (subscription_status);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
CREATE POLICY "profiles_select_own"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_update_own_limited" ON public.profiles;
-- RLS hardening: tier fields are service-role only (no client UPDATE policy)

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role, access_tier, access_level, subscription_status)
  VALUES (NEW.id, NEW.email, 'guest', 'free', 'free', 'inactive')
  ON CONFLICT (id) DO UPDATE SET
    email = COALESCE(EXCLUDED.email, public.profiles.email),
    updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

INSERT INTO public.profiles (id, email, role, access_tier, access_level, subscription_status)
SELECT u.id, u.email, 'guest', 'free', 'free', 'inactive'
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE p.id IS NULL;

-- ── Invitation access ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.invitation_codes (
  code            TEXT PRIMARY KEY,
  label           TEXT,
  duration_days   INTEGER NOT NULL DEFAULT 7,
  code_expires_at TIMESTAMPTZ,
  max_uses        INTEGER NOT NULL DEFAULT 1,
  use_count       INTEGER NOT NULL DEFAULT 0,
  disabled        BOOLEAN NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by      UUID REFERENCES auth.users (id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS public.invitation_redemptions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code              TEXT NOT NULL REFERENCES public.invitation_codes (code) ON DELETE CASCADE,
  user_id           UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  redeemed_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  invitation_until  TIMESTAMPTZ NOT NULL,
  UNIQUE (code, user_id)
);

CREATE INDEX IF NOT EXISTS invitation_redemptions_user_idx ON public.invitation_redemptions (user_id);
CREATE INDEX IF NOT EXISTS invitation_codes_disabled_idx ON public.invitation_codes (disabled);

ALTER TABLE public.invitation_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitation_redemptions ENABLE ROW LEVEL SECURITY;

-- ── Payments ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.payments (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  idempotency_key    TEXT UNIQUE NOT NULL,
  user_id            UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  product_id         TEXT NOT NULL,
  provider           TEXT NOT NULL,
  order_id           TEXT NOT NULL,
  expected_amount    NUMERIC(12, 2) NOT NULL,
  paid_amount        NUMERIC(12, 2),
  currency           TEXT,
  status             TEXT NOT NULL DEFAULT 'pending',
  tx_hash            TEXT,
  processed_at       TIMESTAMPTZ,
  webhook_payload    JSONB,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS payments_user_id_idx ON public.payments (user_id);
CREATE INDEX IF NOT EXISTS payments_order_id_idx ON public.payments (order_id);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read own payments" ON public.payments;
CREATE POLICY "Users read own payments"
  ON public.payments FOR SELECT
  USING (auth.uid() = user_id);

NOTIFY pgrst, 'reload schema';
