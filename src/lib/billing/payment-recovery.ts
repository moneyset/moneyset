import type { SupabaseClient } from "@supabase/supabase-js";

import type { BillingProductId } from "@/lib/billing/catalog";
import type { PaymentRecord, PaymentStatus } from "@/lib/billing/payment-record";

const ACTIVE_STATUSES: PaymentStatus[] = ["pending", "confirming"];

/** Recoverable pending payment window — older rows are verified with provider before reuse. */
export const PAYMENT_RECOVERY_MAX_AGE_MS = 72 * 60 * 60_000;

export type PendingPaymentRow = Readonly<{
  record: PaymentRecord;
  ageMs: number;
  likelyStale: boolean;
}>;

export async function getLatestPendingPaymentForUser(
  admin: SupabaseClient,
  userId: string,
  productId?: BillingProductId,
): Promise<PendingPaymentRow | null> {
  let query = admin
    .from("payments")
    .select("*")
    .eq("user_id", userId)
    .in("status", ACTIVE_STATUSES)
    .order("created_at", { ascending: false })
    .limit(1);

  if (productId) query = query.eq("product_id", productId);

  const { data, error } = await query.maybeSingle();
  if (error || !data) return null;

  const record = data as PaymentRecord;
  const ageMs = Date.now() - new Date(record.created_at).getTime();
  return { record, ageMs, likelyStale: ageMs > PAYMENT_RECOVERY_MAX_AGE_MS };
}

export async function updatePaymentStatus(
  admin: SupabaseClient,
  idempotencyKey: string,
  status: PaymentStatus,
): Promise<void> {
  await admin
    .from("payments")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("idempotency_key", idempotencyKey)
    .neq("status", "paid");
}
