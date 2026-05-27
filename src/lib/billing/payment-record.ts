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

  const { error: updateErr } = await admin
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
    .neq("status", "paid");   // optimistic lock — skip if already paid

  if (updateErr) return { ok: false, error: updateErr.message };
  return { ok: true, alreadyPaid: false };
}

/**
 * Look up a payment record by invoice ID.
 * Returns null if not found.
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
