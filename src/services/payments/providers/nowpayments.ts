import {
  billingProduct,
  buildOrderId,
  isSupportedPayCurrency,
  toNowPaymentsCurrency,
  type BillingProductId,
} from "@/lib/billing/catalog";
import { nowPaymentsIpnUrl, publicSiteUrl } from "@/lib/services/shared/env";
import type { CreateInvoiceInput, InvoiceStatus } from "@/types/billing";
import type { PaymentProvider } from "@/services/payments/provider";

const NOWPAYMENTS_BASE = "https://api.nowpayments.io/v1";

function hasConfig(): boolean {
  return Boolean(process.env.NOWPAYMENTS_API_KEY?.trim());
}

function resolveProductId(input: CreateInvoiceInput): BillingProductId {
  if (input.productId) return input.productId;
  if (input.tier === "premium" || input.tier === "pro") return "premium_monthly";
  return "founding_access";
}

export const nowPaymentsProvider: PaymentProvider = {
  id: "nowpayments",

  createInvoice: async (input, ctx) => {
    const productId = resolveProductId(input);
    const product = billingProduct(productId);
    if (!product) return { ok: false, error: "Unknown product" };

    if (!isSupportedPayCurrency(input.payCurrency)) {
      return { ok: false, error: "USDT is the only supported payment currency" };
    }

    const userId = ctx?.userId ?? "anonymous";
    const orderId = buildOrderId(productId, userId);
    const priceAmount = product.priceUsd;
    const payCurrency = toNowPaymentsCurrency(input.payCurrency);

    if (!hasConfig()) {
      if (process.env.NODE_ENV === "production") {
        return { ok: false, error: "Payment provider not configured" };
      }
      return {
        ok: true,
        provider: "nowpayments",
        invoiceId: `demo-np-${Date.now()}`,
        orderId,
        productId,
        status: "unpaid",
        payCurrency: input.payCurrency,
        priceAmount,
        payAddress: null,
        payAmount: null,
        paymentUrl: null,
        expiresAtTs: Date.now() + 25 * 60_000,
      };
    }

    const apiKey = process.env.NOWPAYMENTS_API_KEY!.trim();

    const res = await fetch(`${NOWPAYMENTS_BASE}/invoice`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
      },
      body: JSON.stringify({
        price_amount: priceAmount,
        price_currency: "usd",
        pay_currency: payCurrency,
        order_id: orderId,
        order_description: `MONEYSET · ${product.label}`,
        ipn_callback_url: nowPaymentsIpnUrl(),
        success_url: `${publicSiteUrl()}/`,
        cancel_url: `${publicSiteUrl()}/`,
      }),
    });

    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      return { ok: false, error: `NOWPayments invoice error (${res.status}): ${txt.slice(0, 240)}` };
    }

    const json = (await res.json()) as unknown;
    const obj = (json ?? {}) as Record<string, unknown>;
    const invoiceId = String((obj.id ?? obj.invoice_id ?? "") as string);
    const paymentUrl =
      typeof obj.invoice_url === "string"
        ? obj.invoice_url
        : typeof obj.payment_url === "string"
          ? obj.payment_url
          : null;

    if (!invoiceId) return { ok: false, error: "NOWPayments returned missing invoice id" };

    return {
      ok: true,
      provider: "nowpayments",
      invoiceId,
      orderId,
      productId,
      status: "unpaid",
      payCurrency: input.payCurrency,
      priceAmount,
      paymentUrl,
      payAddress: null,
      payAmount: null,
      expiresAtTs: null,
    };
  },

  getInvoiceStatus: async ({ invoiceId }) => {
    if (!hasConfig()) {
      if (process.env.NODE_ENV === "production") {
        return { ok: false, error: "Payment provider not configured" };
      }
      return { ok: true, provider: "nowpayments", invoiceId, status: "unpaid", expiresAtTs: null };
    }

    const apiKey = process.env.NOWPAYMENTS_API_KEY!.trim();
    const res = await fetch(`${NOWPAYMENTS_BASE}/invoice/${encodeURIComponent(invoiceId)}`, {
      headers: { "x-api-key": apiKey },
      cache: "no-store",
    });
    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      return { ok: false, error: `NOWPayments status error (${res.status}): ${txt.slice(0, 240)}` };
    }
    const json = (await res.json()) as unknown;
    const obj = (json ?? {}) as Record<string, unknown>;
    const s = String((obj.invoice_status ?? obj.status ?? "unknown") as string).toLowerCase();
    const status: InvoiceStatus =
      s.includes("paid") || s.includes("finished")
        ? "paid"
        : s.includes("confirm")
          ? "confirming"
          : s.includes("expired")
            ? "expired"
            : s.includes("fail")
              ? "failed"
              : "unpaid";
    return { ok: true, provider: "nowpayments", invoiceId, status, expiresAtTs: null };
  },
};
