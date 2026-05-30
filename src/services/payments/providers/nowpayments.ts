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
const NOWPAYMENTS_INVOICE_URL = "https://nowpayments.io/payment/";

export function nowPaymentsInvoiceUrl(invoiceId: string): string {
  const id = invoiceId.trim();
  return `${NOWPAYMENTS_INVOICE_URL}?iid=${encodeURIComponent(id)}`;
}

type NowPaymentRow = Readonly<{
  payment_id?: string | number;
  payment_status?: string;
  order_id?: string;
  price_amount?: number | string;
  pay_currency?: string;
  actually_paid?: number | string;
  pay_amount?: number | string;
}>;

function hasConfig(): boolean {
  return Boolean(process.env.NOWPAYMENTS_API_KEY?.trim());
}

function resolveProductId(input: CreateInvoiceInput): BillingProductId {
  if (input.productId) return input.productId;
  if (input.tier === "premium" || input.tier === "pro") return "premium_monthly";
  return "founding_access";
}

function extractPaymentRows(json: unknown): NowPaymentRow[] {
  if (Array.isArray(json)) return json as NowPaymentRow[];
  const obj = (json ?? {}) as Record<string, unknown>;
  if (Array.isArray(obj.data)) return obj.data as NowPaymentRow[];
  if (Array.isArray(obj.payments)) return obj.payments as NowPaymentRow[];
  return [];
}

const PAID_STATUSES = new Set(["finished", "confirmed"]);
const CONFIRMING_STATUSES = new Set(["confirming", "waiting", "partially_paid", "sending"]);
const FAILED_STATUSES = new Set(["failed", "refunded"]);

function mapProviderPaymentStatus(raw: string | undefined): InvoiceStatus {
  const s = (raw ?? "unknown").toLowerCase();
  if (PAID_STATUSES.has(s)) return "paid";
  if (CONFIRMING_STATUSES.has(s)) return "confirming";
  if (s === "expired") return "expired";
  if (FAILED_STATUSES.has(s)) return "failed";
  return "unpaid";
}

function paymentPriority(status: string | undefined): number {
  const s = (status ?? "").toLowerCase();
  if (PAID_STATUSES.has(s)) return 4;
  if (CONFIRMING_STATUSES.has(s)) return 3;
  if (s === "expired" || FAILED_STATUSES.has(s)) return 1;
  return 2;
}

function pickBestPayment(rows: NowPaymentRow[]): NowPaymentRow | null {
  if (!rows.length) return null;
  return [...rows].sort(
    (a, b) => paymentPriority(b.payment_status) - paymentPriority(a.payment_status),
  )[0];
}

function parseAmount(raw: unknown): number | null {
  if (typeof raw === "number" && Number.isFinite(raw)) return raw;
  if (typeof raw === "string") {
    const n = parseFloat(raw);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function mapPaymentRow(row: NowPaymentRow, invoiceId: string) {
  const providerOrderId =
    typeof row.order_id === "string" ? row.order_id.trim() || null : null;
  const providerPriceAmount =
    parseAmount(row.price_amount) ??
    parseAmount(row.actually_paid) ??
    parseAmount(row.pay_amount);
  const providerPayCurrency =
    typeof row.pay_currency === "string" ? row.pay_currency.trim().toLowerCase() || null : null;

  return {
    ok: true as const,
    provider: "nowpayments" as const,
    invoiceId,
    status: mapProviderPaymentStatus(row.payment_status),
    providerOrderId,
    providerPriceAmount,
    providerPayCurrency,
    providerPaymentId:
      row.payment_id !== undefined && row.payment_id !== null
        ? String(row.payment_id)
        : null,
    expiresAtTs: null,
  };
}

async function fetchPaymentsByInvoiceId(apiKey: string, invoiceId: string): Promise<NowPaymentRow[]> {
  const qs = new URLSearchParams({
    invoiceid: invoiceId,
    limit: "10",
    orderBy: "desc",
    sortBy: "created_at",
  });
  const res = await fetch(`${NOWPAYMENTS_BASE}/payment/?${qs.toString()}`, {
    headers: { "x-api-key": apiKey },
    cache: "no-store",
  });

  if (res.status === 404) return [];
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`NOWPayments status error (${res.status}): ${txt.slice(0, 240)}`);
  }

  const json = (await res.json()) as unknown;
  return extractPaymentRows(json);
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
      return {
        ok: true,
        provider: "nowpayments",
        invoiceId,
        status: "unpaid",
        providerOrderId: null,
        providerPriceAmount: null,
        providerPayCurrency: null,
        expiresAtTs: null,
      };
    }

    const apiKey = process.env.NOWPAYMENTS_API_KEY!.trim();

    try {
      const payments = await fetchPaymentsByInvoiceId(apiKey, invoiceId);
      const best = pickBestPayment(payments);
      if (best) return mapPaymentRow(best, invoiceId);

      // Invoice exists but user has not started a payment yet — not an error.
      return {
        ok: true,
        provider: "nowpayments",
        invoiceId,
        status: "unpaid",
        providerOrderId: null,
        providerPriceAmount: null,
        providerPayCurrency: null,
        expiresAtTs: null,
      };
    } catch (e) {
      return {
        ok: false,
        error: e instanceof Error ? e.message : "NOWPayments status error",
      };
    }
  },
};
