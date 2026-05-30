import { NextResponse } from "next/server";

import { resolveRequestUserId } from "@/lib/access/request-user";
import { billingProduct, type BillingProductId } from "@/lib/billing/catalog";
import {
  getLatestPendingPaymentForUser,
  updatePaymentStatus,
} from "@/lib/billing/payment-recovery";
import { checkRateLimit, rateLimitKey } from "@/lib/billing/rate-limit";
import { sanitizeApiError } from "@/lib/services/shared/env";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { paymentProvider } from "@/services/payments/router";
import { nowPaymentsInvoiceUrl } from "@/services/payments/providers/nowpayments";

export const dynamic = "force-dynamic";

type PendingPaymentResponse =
  | {
      ok: true;
      invoiceId: string | null;
      paymentUrl: string | null;
      provider: string | null;
      status: string | null;
      productId: BillingProductId | null;
      reused: boolean;
    }
  | { ok: false; error: string };

/**
 * Recover the user's latest unpaid invoice for checkout resume UX.
 * Server is authoritative — clears stale/expired invoices from recovery.
 */
export async function GET(req: Request) {
  const rl = checkRateLimit(rateLimitKey(req, "billing/pending"), { limit: 30, windowMs: 60_000 });
  if (!rl.allowed) {
    return NextResponse.json(
      { ok: false, error: "Too many requests." },
      { status: 429, headers: { "Retry-After": String(Math.ceil(rl.retryAfterMs / 1000)) } },
    );
  }

  const admin = supabaseAdmin();
  if (!admin) {
    return NextResponse.json({ ok: false, error: "Billing service unavailable" }, { status: 503 });
  }

  const userId = await resolveRequestUserId(req, admin);
  if (!userId) {
    return NextResponse.json({ ok: false, error: "Authentication required" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const productIdParam = searchParams.get("productId")?.trim();
    const productId = productIdParam && billingProduct(productIdParam) ? productIdParam : undefined;

    const pending = await getLatestPendingPaymentForUser(
      admin,
      userId,
      productId as BillingProductId | undefined,
    );

    if (!pending) {
      return NextResponse.json({
        ok: true,
        invoiceId: null,
        paymentUrl: null,
        provider: null,
        status: null,
        productId: null,
        reused: false,
      } satisfies PendingPaymentResponse);
    }

    const provider = paymentProvider();
    const live = await provider.getInvoiceStatus({ invoiceId: pending.record.idempotency_key });

    if (!live.ok) {
      return NextResponse.json({
        ok: true,
        invoiceId: pending.record.idempotency_key,
        paymentUrl: nowPaymentsInvoiceUrl(pending.record.idempotency_key),
        provider: pending.record.provider,
        status: pending.record.status,
        productId: pending.record.product_id,
        reused: true,
      } satisfies PendingPaymentResponse);
    }

    if (live.status === "paid") {
      return NextResponse.json({
        ok: true,
        invoiceId: null,
        paymentUrl: null,
        provider: null,
        status: "paid",
        productId: pending.record.product_id,
        reused: false,
      } satisfies PendingPaymentResponse);
    }

    if (live.status === "expired" || live.status === "failed") {
      await updatePaymentStatus(admin, pending.record.idempotency_key, live.status);
      return NextResponse.json({
        ok: true,
        invoiceId: null,
        paymentUrl: null,
        provider: null,
        status: live.status,
        productId: pending.record.product_id,
        reused: false,
      } satisfies PendingPaymentResponse);
    }

    if (pending.likelyStale && live.status === "unpaid") {
      await updatePaymentStatus(admin, pending.record.idempotency_key, "expired");
      return NextResponse.json({
        ok: true,
        invoiceId: null,
        paymentUrl: null,
        provider: null,
        status: "expired",
        productId: pending.record.product_id,
        reused: false,
      } satisfies PendingPaymentResponse);
    }

    return NextResponse.json({
      ok: true,
      invoiceId: pending.record.idempotency_key,
      paymentUrl: nowPaymentsInvoiceUrl(pending.record.idempotency_key),
      provider: pending.record.provider,
      status: live.status,
      productId: pending.record.product_id,
      reused: true,
    } satisfies PendingPaymentResponse);
  } catch (e) {
    return NextResponse.json(
      {
        ok: false,
        error: sanitizeApiError(e instanceof Error ? e.message : "Pending payment lookup failed"),
      },
      { status: 500 },
    );
  }
}
