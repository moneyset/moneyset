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

export function buildOrderId(productId: BillingProductId, userId: string): string {
  const safeUser = userId.replace(/[^a-zA-Z0-9-]/g, "").slice(0, 36);
  return `ms-${productId}-${safeUser}-${Date.now()}`;
}

export function parseOrderId(orderId: string): { productId: BillingProductId | null; userId: string | null } {
  const parts = orderId.split("-");
  if (parts[0] !== "ms" || parts.length < 4) return { productId: null, userId: null };
  const productRaw = parts[1];
  const productId =
    productRaw === "premium_monthly" || productRaw === "founding_access"
      ? (productRaw as BillingProductId)
      : productRaw === "founding"
        ? "founding_access"
        : productRaw === "premium"
          ? "premium_monthly"
          : null;
  const userId = parts[2] ?? null;
  return { productId, userId };
}
