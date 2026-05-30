import { NextResponse } from "next/server";

import { resolveRequestUserId } from "@/lib/access/request-user";
import { billingProduct, isSupportedPayCurrency, type BillingProductId } from "@/lib/billing/catalog";
import { createPendingPayment } from "@/lib/billing/payment-record";
import { getLatestPendingPaymentForUser, updatePaymentStatus } from "@/lib/billing/payment-recovery";
import { checkRateLimit, rateLimitKey } from "@/lib/billing/rate-limit";
import { sanitizeApiError } from "@/lib/services/shared/env";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { nowPaymentsInvoiceUrl } from "@/services/payments/providers/nowpayments";
import { paymentProvider } from "@/services/payments/router";
import type { CreateInvoiceInput } from "@/types/billing";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  // Rate limit: 5 invoice creation attempts per IP per minute
  const rl = checkRateLimit(rateLimitKey(req, "billing/create"), { limit: 5, windowMs: 60_000 });
  if (!rl.allowed) {
    return NextResponse.json(
      { ok: false, error: "Too many requests. Please wait before creating another invoice." },
      {
        status: 429,
        headers: { "Retry-After": String(Math.ceil(rl.retryAfterMs / 1000)) },
      },
    );
  }

  try {
    const body = (await req.json()) as CreateInvoiceInput;
    const productId: BillingProductId =
      body.productId ??
      (body.tier === "premium" || body.tier === "pro"
        ? "premium_monthly"
        : "founding_access");

    if (!body?.payCurrency || !billingProduct(productId)) {
      return NextResponse.json({ ok: false, error: "Missing product or currency" }, { status: 400 });
    }
    if (!isSupportedPayCurrency(body.payCurrency)) {
      return NextResponse.json(
        { ok: false, error: "USDT is the only supported payment currency" },
        { status: 400 },
      );
    }

    const admin = supabaseAdmin();
    if (!admin) {
      return NextResponse.json({ ok: false, error: "Billing service unavailable" }, { status: 503 });
    }

    const userId = await resolveRequestUserId(req, admin);
    if (!userId) {
      return NextResponse.json({ ok: false, error: "Sign in required for checkout" }, { status: 401 });
    }

    const product = billingProduct(productId)!;
    const provider = paymentProvider();

    const existingPending = await getLatestPendingPaymentForUser(admin, userId, productId);
    if (existingPending) {
      const live = await provider.getInvoiceStatus({ invoiceId: existingPending.record.idempotency_key });
      if (existingPending.likelyStale && live.ok && live.status === "unpaid") {
        await updatePaymentStatus(admin, existingPending.record.idempotency_key, "expired");
      } else if (
        live.ok &&
        live.status !== "paid" &&
        live.status !== "expired" &&
        live.status !== "failed"
      ) {
        return NextResponse.json({
          ok: true,
          provider: existingPending.record.provider,
          invoiceId: existingPending.record.idempotency_key,
          orderId: existingPending.record.order_id,
          productId,
          status: live.status,
          payCurrency: body.payCurrency,
          priceAmount: product.priceUsd,
          paymentUrl: nowPaymentsInvoiceUrl(existingPending.record.idempotency_key),
          payAddress: null,
          payAmount: null,
          expiresAtTs: null,
        });
      }
      if (live.ok && (live.status === "expired" || live.status === "failed")) {
        await updatePaymentStatus(admin, existingPending.record.idempotency_key, live.status);
      }
    }

    const result = await provider.createInvoice({ ...body, productId }, { userId });

    if (!result.ok) {
      return NextResponse.json(
        { ok: false, error: sanitizeApiError(result.error) },
        { status: 502 },
      );
    }

    // Create authoritative server-side payment record when invoice is generated
    const pending = await createPendingPayment(admin, {
        idempotencyKey: result.invoiceId,
        userId,
        productId,
        provider: result.provider,
        orderId: result.orderId,
        expectedAmount: product.priceUsd,
        currency: result.payCurrency.toLowerCase(),
      });
      if (!pending.ok) {
        console.error("[billing/create] createPendingPayment failed:", pending.error);
        return NextResponse.json(
          { ok: false, error: "Could not persist payment record. Try again." },
          { status: 502 },
        );
      }

    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json(
      {
        ok: false,
        error: sanitizeApiError(e instanceof Error ? e.message : "Billing create error"),
      },
      { status: 500 },
    );
  }
}
