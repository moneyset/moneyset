-- ============================================================
-- MONEYSET Billing Security Patch — payments table
-- Run in: Supabase Dashboard → SQL Editor → Run
-- ============================================================

CREATE TABLE IF NOT EXISTS payments (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Provider invoice ID — unique per payment attempt, used for idempotency
  idempotency_key    TEXT UNIQUE NOT NULL,

  -- Owning user — links to Supabase auth
  user_id            UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Billing catalog product: "founding_access" | "premium_monthly"
  product_id         TEXT NOT NULL,

  -- Payment provider: "nowpayments"
  provider           TEXT NOT NULL,

  -- Structured order reference: ms-{product}-{userId}-{ts}
  -- This is what was embedded into the invoice at creation time
  order_id           TEXT NOT NULL,

  -- Catalog price at time of invoice creation (server-side, not client-supplied)
  expected_amount    NUMERIC(12,2) NOT NULL,

  -- Actual amount received (from IPN or status check)
  paid_amount        NUMERIC(12,2),

  -- Payment currency (e.g. "usdttrc20")
  currency           TEXT,

  -- Payment lifecycle state
  status             TEXT NOT NULL DEFAULT 'pending',
  -- Allowed: pending | confirming | paid | expired | failed

  -- Blockchain transaction hash (if available from provider)
  tx_hash            TEXT,

  -- When the payment was marked as paid/failed
  processed_at       TIMESTAMPTZ,

  -- Full IPN payload for audit trail and replay debugging
  webhook_payload    JSONB,

  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Fast lookup by user (payment history)
CREATE INDEX IF NOT EXISTS payments_user_id_idx ON payments(user_id);

-- Fast lookup by order_id (webhook processing)
CREATE INDEX IF NOT EXISTS payments_order_id_idx ON payments(order_id);

-- Row Level Security: users can read only their own payment records
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own payments"
  ON payments FOR SELECT
  USING (auth.uid() = user_id);

-- Service role bypasses RLS automatically (used by webhook + status API routes)
