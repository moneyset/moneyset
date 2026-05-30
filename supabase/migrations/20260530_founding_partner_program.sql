-- Founding Partner Program — referral tracking

CREATE TABLE IF NOT EXISTS public.founding_partners (
  code             TEXT PRIMARY KEY,
  label            TEXT,
  commission_rate  NUMERIC(5, 4) NOT NULL DEFAULT 0.5,
  disabled         BOOLEAN NOT NULL DEFAULT FALSE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by       UUID REFERENCES auth.users (id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS public.partner_referrals (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_code     TEXT NOT NULL REFERENCES public.founding_partners (code) ON DELETE CASCADE,
  user_id          UUID REFERENCES auth.users (id) ON DELETE SET NULL,
  purchase_amount  NUMERIC(12, 2),
  purchase_date    TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS partner_referrals_code_idx ON public.partner_referrals (partner_code);
CREATE INDEX IF NOT EXISTS partner_referrals_user_idx ON public.partner_referrals (user_id);
CREATE INDEX IF NOT EXISTS partner_referrals_purchase_idx ON public.partner_referrals (purchase_date)
  WHERE purchase_amount IS NOT NULL;

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS partner_code TEXT;

ALTER TABLE public.founding_partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_referrals ENABLE ROW LEVEL SECURITY;

NOTIFY pgrst, 'reload schema';
