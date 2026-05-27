import { NextResponse } from "next/server";

import { billingProduct, parseOrderId } from "@/lib/billing/catalog";
import { unlockProfileForProduct } from "@/lib/billing/access-unlock";
import {
  createPendingPayment,
  getPaymentByInvoiceId,
  markPaymentPaid,
} from "@/lib/billing/payment-record";
import { resolveRequestUserId } from "@/lib/access/request-user";
import { checkRateLimit, rateLimitKey } from "@/lib/billing/rate-limit";
import { sanitizeApiError } from "@/lib/services/shared/env";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { paymentProvider } from "@/services/payments/router";

export const dynamic = "force-dynamic";

/**
 * Poll invoice status.
 *
 * Security model:
 * - The client supplies an invoiceId only.
 * - The orderId and amount are retrieved from the payment provider's API —
 *   never from client-supplied query parameters.
 * - Access is only unlocked when:
 *   (a) The authenticated user ID matches the user encoded in the provider's order_id
 *   (b) The provider's price_amount >= the product's catalog price
 *   (c) Payment status is "paid"
 * - This endpoint is a UX polling fallback. The webhook is the authoritative path.
 */
export async function GET(req: Request) {
  // Rate limit: 20 status polls per IP per minute
  const rl = checkRateLimit(rateLimitKey(req, "billing/status"), { limit: 20, windowMs: 60_000 });
  if (!rl.allowed) {
    return NextResponse.json(
      { ok: false, error: "Too many requests. Slow down polling." },
      { status: 429, headers: { "Retry-After": String(Math.ceil(rl.retryAfterMs / 1000)) } },
    );
  }

  const admin = supabaseAdmin();

  // Require authentication for all status checks
  const authUserId = await resolveRequestUserId(req, admin);
  if (!authUserId) {
    return NextResponse.json({ ok: false, error: "Authentication required" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const invoiceId = searchParams.get("invoiceId")?.trim();
    if (!invoiceId) {
      return NextResponse.json({ ok: false, error: "Missing invoiceId" }, { status: 400 });
    }

    const provider = paymentProvider();
    const result = await provider.getInvoiceStatus({ invoiceId });

    if (!result.ok) {
      return NextResponse.json(
        { ok: false, error: sanitizeApiError(result.error) },
        { status: 502 },
      );
    }

    // ── If not yet paid, return status immediately — nothing to unlock ──────
    if (result.status !== "paid") {
      return NextResponse.json({
        ok: true,
        provider: result.provider,
        invoiceId: result.invoiceId,
        status: result.status,
      });
    }

    // ── Payment is "paid" — verify before granting access ───────────────────

    if (!admin) {
      return NextResponse.json(
        { ok: false, error: "Billing service unavailable" },
        { status: 503 },
      );
    }

    // 1. Get the order_id from the PROVIDER — not from the client
    const providerOrderId = result.providerOrderId;
    if (!providerOrderId) {
      return NextResponse.json(
        { ok: false, error: "Provider returned no order reference. Contact support." },
        { status: 502 },
      );
    }

    // 2. Parse the order_id to extract product and user
    const { productId, userId: orderUserId } = parseOrderId(providerOrderId);
    if (!productId || !orderUserId) {
      return NextResponse.json(
        { ok: false, error: "Invoice does not belong to this platform." },
        { status: 422 },
      );
    }

    // 3. Verify authenticated user owns this order
    if (orderUserId !== authUserId) {
      return NextResponse.json(
        { ok: false, error: "This invoice does not belong to your account." },
        { status: 403 },
      );
    }

    // 4. Look up catalog product and verify price integrity
    const product = billingProduct(productId);
    if (!product) {
      return NextResponse.json(
        { ok: false, error: "Unknown product in order." },
        { status: 422 },
      );
    }

    const providerAmount = result.providerPriceAmount;
    if (providerAmount !== null && providerAmount < product.priceUsd) {
      // Amount paid is less than the catalog price — reject
      return NextResponse.json(
        {
          ok: false,
          error: `Payment amount insufficient. Expected $${product.priceUsd}, got $${providerAmount}.`,
        },
        { status: 422 },
      );
    }

    // 5. Check if we already processed this invoice (idempotency via payments table)
    const existingRecord = await getPaymentByInvoiceId(admin, invoiceId);
    if (existingRecord?.status === "paid") {
      // Already processed — ensure profile is unlocked and return success
      await unlockProfileForProduct(admin, authUserId, productId, providerOrderId);
      return NextResponse.json({
        ok: true,
        provider: result.provider,
        invoiceId: result.invoiceId,
        status: "paid",
      });
    }

    // 6. Create or update the payment record, then unlock
    if (!existingRecord) {
      await createPendingPayment(admin, {
        idempotencyKey: invoiceId,
        userId: authUserId,
        productId,
        provider: result.provider,
        orderId: providerOrderId,
        expectedAmount: product.priceUsd,
        currency: result.providerPayCurrency,
      });
    }

    const markResult = await markPaymentPaid(admin, invoiceId, {
      paidAmount: providerAmount,
      currency: result.providerPayCurrency,
    });

    if (!markResult.ok) {
      // Non-fatal — log but continue with profile unlock
      console.error("[billing/status] markPaymentPaid failed:", markResult.error);
    }

    // 7. Unlock profile entitlement
    const unlockResult = await unlockProfileForProduct(admin, authUserId, productId, providerOrderId);
    if (!unlockResult.ok) {
      return NextResponse.json(
        { ok: false, error: "Access could not be activated. Please contact support." },
        { status: 502 },
      );
    }

    return NextResponse.json({
      ok: true,
      provider: result.provider,
      invoiceId: result.invoiceId,
      status: "paid",
    });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: sanitizeApiError(e instanceof Error ? e.message : "Billing status error") },
      { status: 500 },
    );
  }
}
