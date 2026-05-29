import { NextResponse } from "next/server";

import { billingProduct, parseOrderId } from "@/lib/billing/catalog";
import { unlockProfileForProduct } from "@/lib/billing/access-unlock";
import {
  createPendingPayment,
  getPaymentByInvoiceId,
  markPaymentPaid,
  resolvePaymentIdempotencyKey,
} from "@/lib/billing/payment-record";
import { verifyNowPaymentsIpnSignature } from "@/lib/billing/nowpayments-ipn";
import { checkRateLimit, rateLimitKey } from "@/lib/billing/rate-limit";
import { logOpsEvent } from "@/lib/ops/operational-events";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/**
 * Full IPN body shape from NOWPayments.
 * Only the fields relevant to access activation are declared; the full body
 * is stored in webhook_payload for audit purposes.
 */
type NowPaymentsIpn = {
  payment_status?: string;
  order_id?: string;
  payment_id?: string | number;
  invoice_id?: string | number;
  price_amount?: number | string;
  pay_amount?: number | string;
  actually_paid?: number | string;
  pay_currency?: string;
  outcome_amount?: number | string;
  outcome_currency?: string;
  payment_extra_id?: string;
};

/**
 * NOWPayments IPN handler — the AUTHORITATIVE entitlement activation path.
 *
 * Security contract:
 * 1. HMAC-SHA512 signature is verified first. If NOWPAYMENTS_IPN_SECRET is
 *    not configured in production, this throws — no silent fallback.
 * 2. Only "finished" / "confirmed" / "sent" statuses trigger an unlock.
 * 3. The order_id in the IPN body is parsed to extract user + product.
 * 4. Catalog price is verified: paid_amount >= expected_amount.
 * 5. The payments table is the idempotency gate — a paid record cannot be
 *    processed twice even under concurrent requests.
 */
export async function POST(req: Request) {
  // Rate limit: 30 webhook calls per IP per minute (per-instance best-effort)
  const rl = checkRateLimit(rateLimitKey(req, "billing/webhook"), { limit: 30, windowMs: 60_000 });
  if (!rl.allowed) {
    return NextResponse.json(
      { ok: false, error: "Too many requests" },
      { status: 429, headers: { "Retry-After": String(Math.ceil(rl.retryAfterMs / 1000)) } },
    );
  }

  let body: NowPaymentsIpn;
  try {
    body = (await req.json()) as NowPaymentsIpn;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid body" }, { status: 400 });
  }

  // ── 1. Verify HMAC signature ─────────────────────────────────────────────
  const sig = req.headers.get("x-nowpayments-sig");
  let signatureValid: boolean;
  try {
    signatureValid = verifyNowPaymentsIpnSignature(body, sig);
  } catch (e) {
    // In production: throws if NOWPAYMENTS_IPN_SECRET is not configured.
    // Return 503 so NOWPayments retries and the error is visible in logs.
    const msg = e instanceof Error ? e.message : "Webhook configuration error";
    console.error("[billing/webhook] signature check error:", msg);
    return NextResponse.json({ ok: false, error: msg }, { status: 503 });
  }

  if (!signatureValid) {
    return NextResponse.json({ ok: false, error: "Invalid signature" }, { status: 401 });
  }

  // ── 2. Check payment status ──────────────────────────────────────────────
  const status = (body.payment_status ?? "").toLowerCase();
  const isPaid =
    status === "finished" || status === "confirmed" || status === "sent";
  if (!isPaid) {
    return NextResponse.json({ ok: true, ignored: true, status });
  }

  // ── 3. Parse order_id to get user + product ──────────────────────────────
  const orderId = (body.order_id ?? "").trim();
  if (!orderId) {
    return NextResponse.json(
      { ok: false, error: "IPN missing order_id" },
      { status: 422 },
    );
  }

  const { productId, userId } = parseOrderId(orderId);
  if (!productId || !userId) {
    // Valid IPN but not a MONEYSET order — log and acknowledge
    console.warn("[billing/webhook] unrecognised order_id:", orderId);
    return NextResponse.json({ ok: true, recorded: false, reason: "unrecognised order format" });
  }

  // ── 4. Resolve product and verify amount ─────────────────────────────────
  const product = billingProduct(productId);
  if (!product) {
    console.error("[billing/webhook] unknown productId in orderId:", productId, orderId);
    return NextResponse.json({ ok: true, recorded: false, reason: "unknown product" });
  }

  // Determine how much was actually paid — try several NOWPayments fields
  const rawPaid = body.actually_paid ?? body.outcome_amount ?? body.pay_amount ?? null;
  const paidAmount = rawPaid !== null ? parseFloat(String(rawPaid)) : null;
  const rawExpected = body.price_amount ?? null;
  const priceAmount = rawExpected !== null ? parseFloat(String(rawExpected)) : null;

  // Amount integrity check: null amount is not tolerated — if the IPN contains no
  // amount fields at all, reject rather than silently skipping the check.
  // priceAmount (price_amount) is preferred; paidAmount (actually_paid / pay_amount)
  // is the fallback for providers that omit price_amount in the IPN.
  const amountToCheck = priceAmount ?? paidAmount;
  if (amountToCheck === null) {
    console.error("[billing/webhook] IPN missing all amount fields:", { orderId });
    return NextResponse.json(
      { ok: false, error: "IPN missing payment amount — cannot verify price integrity." },
      { status: 422 },
    );
  }
  if (amountToCheck < product.priceUsd) {
    console.error(
      "[billing/webhook] amount too low:",
      { orderId, amountToCheck, expectedMin: product.priceUsd },
    );
    return NextResponse.json(
      { ok: false, error: "Payment amount below product price" },
      { status: 422 },
    );
  }

  // ── 5. Idempotency via payments table ────────────────────────────────────
  const admin = supabaseAdmin();
  if (!admin) {
    return NextResponse.json({ ok: false, error: "Billing service unavailable" }, { status: 503 });
  }

  const invoiceIdRaw =
    body.invoice_id !== undefined && body.invoice_id !== null
      ? String(body.invoice_id).trim()
      : null;
  const idempotencyKey = await resolvePaymentIdempotencyKey(admin, {
    invoiceId: invoiceIdRaw,
    orderId,
  });

  const existing = await getPaymentByInvoiceId(admin, idempotencyKey);
  if (existing?.status === "paid") {
    await unlockProfileForProduct(admin, userId, productId, orderId);
    return NextResponse.json({ ok: true, alreadyProcessed: true, orderId });
  }

  // Create record if it doesn't exist (IPN can arrive before status poll)
  if (!existing) {
    const currency = (body.pay_currency ?? body.outcome_currency ?? "").toLowerCase() || null;
    const createResult = await createPendingPayment(admin, {
      idempotencyKey,
      userId,
      productId,
      provider: "nowpayments",
      orderId,
      expectedAmount: product.priceUsd,
      currency,
    });
    if (!createResult.ok) {
      logOpsEvent("payment_webhook_failure", { stage: "create_pending", orderId });
      return NextResponse.json(
        { ok: false, error: "Payment record could not be created" },
        { status: 502 },
      );
    }
  }

  // Mark as paid
  const currency = (body.pay_currency ?? body.outcome_currency ?? "").toLowerCase() || null;
  const markResult = await markPaymentPaid(admin, idempotencyKey, {
    paidAmount: paidAmount ?? amountToCheck,
    currency,
    webhookPayload: body,
  });

  if (!markResult.ok) {
    console.error("[billing/webhook] markPaymentPaid error:", markResult.error);
    return NextResponse.json(
      { ok: false, error: "Payment record could not be updated" },
      { status: 502 },
    );
  }

  // Always ensure profile unlock — idempotent via last_payment_order_id.
  const unlockResult = await unlockProfileForProduct(admin, userId, productId, orderId);
  if (!unlockResult.ok) {
    console.error("[billing/webhook] unlockProfileForProduct error:", unlockResult.error);
    return NextResponse.json(
      { ok: false, error: "Access upgrade could not be applied" },
      { status: 502 },
    );
  }

  if (markResult.alreadyPaid) {
    return NextResponse.json({ ok: true, alreadyProcessed: true, orderId, unlocked: true });
  }

  return NextResponse.json({
    ok: true,
    upgraded: true,
    orderId,
    productId,
    userId,
  });
}
