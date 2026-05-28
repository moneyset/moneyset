import { NextResponse } from "next/server";

import { billingProduct } from "@/lib/billing/catalog";
import { getPaymentsByUserId } from "@/lib/billing/payment-record";
import { checkRateLimit, rateLimitKey } from "@/lib/billing/rate-limit";
import { resolveRequestUserId } from "@/lib/access/request-user";
import { sanitizeApiError } from "@/lib/services/shared/env";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export type PaymentHistoryItem = {
  id: string;
  productId: string;
  productLabel: string;
  amount: number;
  currency: string;
  status: string;
  provider: string;
  createdAt: string;
  processedAt: string | null;
};

/**
 * Read-only payment history for the authenticated user.
 * Returns sanitized rows — no webhook payloads or internal keys.
 */
export async function GET(req: Request) {
  const rl = checkRateLimit(rateLimitKey(req, "billing/history"), { limit: 30, windowMs: 60_000 });
  if (!rl.allowed) {
    return NextResponse.json(
      { ok: false, error: "Too many requests." },
      { status: 429, headers: { "Retry-After": String(Math.ceil(rl.retryAfterMs / 1000)) } },
    );
  }

  const admin = supabaseAdmin();
  const userId = await resolveRequestUserId(req, admin);

  if (!userId) {
    return NextResponse.json({ ok: false, error: "Authentication required" }, { status: 401 });
  }

  if (!admin) {
    return NextResponse.json({ ok: false, error: "Billing service unavailable" }, { status: 503 });
  }

  try {
    const payments = await getPaymentsByUserId(admin, userId, 50);

    const items: PaymentHistoryItem[] = payments.map((p) => ({
      id: p.id,
      productId: p.product_id,
      productLabel: billingProduct(p.product_id)?.label ?? p.product_id,
      amount: p.paid_amount ?? p.expected_amount,
      currency: (p.currency ?? "USDT").toUpperCase(),
      status: p.status,
      provider: p.provider,
      createdAt: p.created_at,
      processedAt: p.processed_at,
    }));

    return NextResponse.json({ ok: true, payments: items });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: sanitizeApiError(e instanceof Error ? e.message : "Payment history error") },
      { status: 500 },
    );
  }
}
