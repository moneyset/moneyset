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
 * - Ownership is verified BEFORE calling the payment provider API:
 *   (a) If a payments table record exists, user_id must match the authenticated user.
 *   (b) If no record exists yet (invoice just created), ownership is verified via the
 *       provider's order_id after the provider call — and the result is only returned
 *       to the owner.
 * - Access is only unlocked when:
 *   (a) Authenticated user ID matches the user encoded in the provider's order_id
 *   (b) provider's price_amount is not null AND >= the product's catalog price
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

  const authUserId = await resolveRequestUserId(req, admin);
  if (!authUserId) {
    return NextResponse.json({ ok: false, error: "Authentication required" }, { status: 401 });
  }

  if (!admin) {
    return NextResponse.json({ ok: false, error: "Billing service unavailable" }, { status: 503 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const invoiceId = searchParams.get("invoiceId")?.trim();
    if (!invoiceId) {
      return NextResponse.json({ ok: false, error: "Missing invoiceId" }, { status: 400 });
    }

    // ── Ownership pre-check via payments table ───────────────────────────────
    // If a record exists for this invoice, enforce ownership BEFORE calling the
    // provider. This prevents any authenticated user from probing arbitrary invoice IDs.
    const existingRecord = await getPaymentByInvoiceId(admin, invoiceId);
    if (existingRecord) {
      if (existingRecord.user_id !== authUserId) {
        return NextResponse.json(
          { ok: false, error: "This invoice does not belong to your account." },
          { status: 403 },
        );
      }
      // If already paid, ensure the profile is unlocked and return immediately
      if (existingRecord.status === "paid") {
        await unlockProfileForProduct(
          admin,
          authUserId,
          existingRecord.product_id,
          existingRecord.order_id,
        );
        return NextResponse.json({
          ok: true,
          provider: existingRecord.provider,
          invoiceId,
          status: "paid",
        });
      }
    }

    // ── Call provider to get current status ──────────────────────────────────
    const provider = paymentProvider();
    const result = await provider.getInvoiceStatus({ invoiceId });

    if (!result.ok) {
      return NextResponse.json(
        { ok: false, error: sanitizeApiError(result.error) },
        { status: 502 },
      );
    }

    // Not yet paid — return status now (no unlock needed)
    if (result.status !== "paid") {
      return NextResponse.json({
        ok: true,
        provider: result.provider,
        invoiceId: result.invoiceId,
        status: result.status,
      });
    }

    // ── Payment is "paid" — full verification before granting access ─────────

    // 1. Get the order_id from the PROVIDER — fall back to our payment record
    const providerOrderId = result.providerOrderId ?? existingRecord?.order_id ?? null;
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

    // 3. Verify authenticated user owns this order (second ownership check — defense in depth)
    if (orderUserId !== authUserId) {
      return NextResponse.json(
        { ok: false, error: "This invoice does not belong to your account." },
        { status: 403 },
      );
    }

    // 4. Look up catalog product
    const product = billingProduct(productId);
    if (!product) {
      return NextResponse.json(
        { ok: false, error: "Unknown product in order." },
        { status: 422 },
      );
    }

    // 5. Amount integrity — reject null amounts (do not silently skip the check)
    const providerAmount =
      result.providerPriceAmount ?? existingRecord?.expected_amount ?? null;
    if (providerAmount === null) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Provider did not return a payment amount. Cannot verify payment integrity. Contact support.",
        },
        { status: 502 },
      );
    }
    if (providerAmount < product.priceUsd) {
      return NextResponse.json(
        {
          ok: false,
          error: `Payment amount insufficient. Expected $${product.priceUsd}, received $${providerAmount}.`,
        },
        { status: 422 },
      );
    }

    // 6. Create payment record if it doesn't exist yet
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

    // 7. Mark as paid (idempotent — see markPaymentPaid for TOCTOU handling)
    const markResult = await markPaymentPaid(admin, invoiceId, {
      paidAmount: providerAmount,
      currency: result.providerPayCurrency,
    });

    if (!markResult.ok) {
      console.error("[billing/status] markPaymentPaid failed:", markResult.error);
      return NextResponse.json(
        { ok: false, error: "Payment record could not be updated. Please contact support." },
        { status: 502 },
      );
    }

    // If concurrent webhook already processed and unlocked, still call unlock
    // here — unlockProfileForProduct is idempotent via last_payment_order_id.

    // 8. Unlock profile entitlement
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
      {
        ok: false,
        error: sanitizeApiError(e instanceof Error ? e.message : "Billing status error"),
      },
      { status: 500 },
    );
  }
}
