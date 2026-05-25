/**
 * Modular product catalog — server-side pricing & order metadata.
 */

export type BillingProductId = "premium_monthly" | "founding_access";

export type BillingProduct = Readonly<{
  id: BillingProductId;
  label: string;
  description: string;
  priceUsd: number;
  /** founding = lifetime early access; premium = subscription window */
  kind: "subscription" | "founding";
  subscriptionDays: number | null;
}>;

export const BILLING_PRODUCTS: Record<BillingProductId, BillingProduct> = {
  premium_monthly: {
    id: "premium_monthly",
    label: "Premium Intelligence",
    description: "Execution map · tactical framework · advanced interpretation",
    priceUsd: 29,
    kind: "subscription",
    subscriptionDays: 30,
  },
  founding_access: {
    id: "founding_access",
    label: "Founding Access",
    description: "Execution intelligence · institutional interpretation · early member layer",
    priceUsd: 79,
    kind: "founding",
    subscriptionDays: null,
  },
};

export function billingProduct(id: string): BillingProduct | null {
  if (id in BILLING_PRODUCTS) return BILLING_PRODUCTS[id as BillingProductId];
  return null;
}

/** Supported checkout currencies — must match NOWPayments account configuration. */
export const SUPPORTED_PAY_CURRENCIES = ["USDT"] as const;
export type SupportedPayCurrency = (typeof SUPPORTED_PAY_CURRENCIES)[number];

export function isSupportedPayCurrency(raw: string): raw is SupportedPayCurrency {
  return SUPPORTED_PAY_CURRENCIES.includes(raw.toUpperCase() as SupportedPayCurrency);
}

/** Map UI currency to NOWPayments pay_currency code. */
export function toNowPaymentsCurrency(currency: SupportedPayCurrency): string {
  return currency === "USDT" ? "usdttrc20" : currency;
}

function compactUserId(userId: string): string {
  return userId.replace(/[^a-f0-9]/gi, "").slice(0, 32).toLowerCase();
}

function expandUserId(compact: string): string | null {
  if (compact.length !== 32) return null;
  return `${compact.slice(0, 8)}-${compact.slice(8, 12)}-${compact.slice(12, 16)}-${compact.slice(16, 20)}-${compact.slice(20)}`;
}

function normalizeProductId(raw: string): BillingProductId | null {
  if (raw === "premium_monthly" || raw === "founding_access") return raw;
  if (raw === "founding") return "founding_access";
  if (raw === "premium") return "premium_monthly";
  return null;
}

/** Order id: ms-{productId}-{32-char-userId}-{timestamp} — UUID hyphens stripped for parsing. */
export function buildOrderId(productId: BillingProductId, userId: string): string {
  return `ms-${productId}-${compactUserId(userId)}-${Date.now()}`;
}

export function parseOrderId(orderId: string): { productId: BillingProductId | null; userId: string | null } {
  const modern = orderId.match(/^ms-(premium_monthly|founding_access|founding|premium)-([a-f0-9]{32})-(\d+)$/i);
  if (modern) {
    const productId = normalizeProductId(modern[1]!.toLowerCase());
    const userId = expandUserId(modern[2]!.toLowerCase());
    return { productId, userId };
  }

  const parts = orderId.split("-");
  if (parts[0] !== "ms" || parts.length < 4) return { productId: null, userId: null };
  const productId = normalizeProductId(parts[1] ?? "");
  if (!productId) return { productId: null, userId: null };

  const ts = parts[parts.length - 1] ?? "";
  if (!/^\d+$/.test(ts)) return { productId: null, userId: null };

  const userSegment = parts.slice(2, -1).join("-");
  const userId =
    userSegment.length === 32 ? expandUserId(userSegment.toLowerCase()) : userSegment.includes("-") ? userSegment : expandUserId(userSegment.toLowerCase());

  return { productId, userId };
}
