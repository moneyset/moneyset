/**
 * Authoritative payment record helpers.
 *
 * The `payments` table is the single source of truth for every payment event.
 * Access unlocks must only happen after a record is persisted here — never
 * based solely on client-supplied parameters.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

import type { BillingProductId } from "@/lib/billing/catalog";
import type { PaymentProviderId } from "@/types/billing";

export type PaymentStatus = "pending" | "confirming" | "paid" | "expired" | "failed";

export type PaymentRecord = {
  id: string;
  idempotency_key: string;   // provider invoice ID
  user_id: string;
  product_id: BillingProductId;
  provider: PaymentProviderId;
  order_id: string;
  expected_amount: number;
  paid_amount: number | null;
  currency: string | null;
  status: PaymentStatus;
  tx_hash: string | null;
  processed_at: string | null;
  webhook_payload: unknown;
  created_at: string;
  updated_at: string;
};

export type UpsertPaymentInput = {
  idempotencyKey: string;   // invoice ID from provider
  userId: string;
  productId: BillingProductId;
  provider: PaymentProviderId;
  orderId: string;
  expectedAmount: number;
  paidAmount?: number | null;
  currency?: string | null;
  status: PaymentStatus;
  txHash?: string | null;
  processedAt?: Date | null;
  webhookPayload?: unknown;
};

/**
 * Create an initial payment record when an invoice is generated.
 * Idempotent — if a record with this idempotency_key already exists, no-op.
 */
export async function createPendingPayment(
  admin: SupabaseClient,
  input: Omit<UpsertPaymentInput, "status" | "paidAmount" | "processedAt">,
): Promise<{ ok: true; recordId: string } | { ok: false; error: string }> {
  const { data, error } = await admin
    .from("payments")
    .insert({
      idempotency_key: input.idempotencyKey,
      user_id: input.userId,
      product_id: input.productId,
      provider: input.provider,
      order_id: input.orderId,
      expected_amount: input.expectedAmount,
      currency: input.currency ?? null,
      status: "pending",
      updated_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (error) {
    // Unique constraint violation = duplicate invoice, safe to ignore
    if (error.code === "23505") return { ok: true, recordId: "" };
    return { ok: false, error: error.message };
  }
  return { ok: true, recordId: (data as { id: string }).id };
}

/**
 * Mark a payment as paid and update amounts.
 * Returns ok:true even if already paid (idempotent).
 * Uses a SELECT-first check to prevent concurrent double-processing.
 */
export async function markPaymentPaid(
  admin: SupabaseClient,
  idempotencyKey: string,
  opts: {
    paidAmount: number | null;
    currency: string | null;
    txHash?: string | null;
    webhookPayload?: unknown;
  },
): Promise<{ ok: true; alreadyPaid: boolean } | { ok: false; error: string }> {
  // Atomic guard: only transition to "paid" from non-paid states
  const { data: existing, error: selectErr } = await admin
    .from("payments")
    .select("status, user_id, product_id, order_id, expected_amount")
    .eq("idempotency_key", idempotencyKey)
    .maybeSingle();

  if (selectErr) return { ok: false, error: selectErr.message };

  if (!existing) {
    return { ok: false, error: `Payment record not found for invoice: ${idempotencyKey}` };
  }

  if (existing.status === "paid") {
    return { ok: true, alreadyPaid: true };
  }

  // Atomic transition: the UPDATE returns the updated row only if it matched
  // (i.e. status was still not "paid"). If another concurrent request already
  // transitioned to "paid", PostgreSQL's row-level lock serializes the UPDATEs
  // and this UPDATE matches 0 rows — .select() returns an empty array, which
  // we treat as alreadyPaid: true, preventing double-processing.
  const { data: updated, error: updateErr } = await admin
    .from("payments")
    .update({
      status: "paid",
      paid_amount: opts.paidAmount,
      currency: opts.currency,
      tx_hash: opts.txHash ?? null,
      processed_at: new Date().toISOString(),
      webhook_payload: (opts.webhookPayload as Record<string, unknown>) ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq("idempotency_key", idempotencyKey)
    .neq("status", "paid")
    .select("id");   // returns [] if 0 rows matched = concurrent winner already did it

  if (updateErr) return { ok: false, error: updateErr.message };

  const didUpdate = Array.isArray(updated) && updated.length > 0;
  return { ok: true, alreadyPaid: !didUpdate };
}

/**
 * Look up a payment record by invoice ID (stored as idempotency_key).
 */
export async function getPaymentByInvoiceId(
  admin: SupabaseClient,
  invoiceId: string,
): Promise<PaymentRecord | null> {
  const { data, error } = await admin
    .from("payments")
    .select("*")
    .eq("idempotency_key", invoiceId)
    .maybeSingle();

  if (error || !data) return null;
  return data as PaymentRecord;
}

/** Look up a payment record by platform order_id. */
export async function getPaymentByOrderId(
  admin: SupabaseClient,
  orderId: string,
): Promise<PaymentRecord | null> {
  const { data, error } = await admin
    .from("payments")
    .select("*")
    .eq("order_id", orderId)
    .order("created_at", { ascending: false })
    .limit(1);

  if (error || !data?.length) return null;
  return data[0] as PaymentRecord;
}

/**
 * Resolve the payments.idempotency_key for webhook/status updates.
 * Always prefer invoice_id; fall back to an existing row matched by order_id.
 */
export async function resolvePaymentIdempotencyKey(
  admin: SupabaseClient,
  args: { invoiceId?: string | null; orderId: string },
): Promise<string> {
  const invoiceId = args.invoiceId?.trim();
  if (invoiceId) return invoiceId;

  const byOrder = await getPaymentByOrderId(admin, args.orderId);
  if (byOrder?.idempotency_key) return byOrder.idempotency_key;

  return args.orderId;
}

/**
 * Get all payment records for a user (for dashboard / payment history).
 */
export async function getPaymentsByUserId(
  admin: SupabaseClient,
  userId: string,
  limit = 20,
): Promise<PaymentRecord[]> {
  const { data, error } = await admin
    .from("payments")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !data) return [];
  return data as PaymentRecord[];
}
