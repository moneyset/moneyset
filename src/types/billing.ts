import type { BillingProductId } from "@/lib/billing/catalog";

export type SubscriptionTier = "free" | "premium" | "pro";

export type SubscriptionStatus = "inactive" | "trial" | "active" | "past_due" | "expired" | "canceled";

export type PaymentProviderId = "nowpayments" | "helio" | "coinbase_commerce";

export type InvoiceStatus =
  | "creating"
  | "unpaid"
  | "confirming"
  | "paid"
  | "expired"
  | "failed"
  | "unknown";

export type SubscriptionRecord = Readonly<{
  tier: SubscriptionTier;
  status: SubscriptionStatus;
  provider: PaymentProviderId | null;
  currentPeriodEndTs: number | null;
  lastInvoiceId: string | null;
  lastPaymentUrl: string | null;
  updatedAtTs: number | null;
}>;

export type CreateInvoiceInput = Readonly<{
  productId: BillingProductId;
  payCurrency: "USDT";
  symbol?: "BTCUSDT";
  /** @deprecated use productId */
  tier?: Exclude<SubscriptionTier, "free">;
  period?: "monthly";
}>;

export type CreateInvoiceResult = Readonly<{
  ok: true;
  provider: PaymentProviderId;
  invoiceId: string;
  orderId: string;
  productId: BillingProductId;
  status: InvoiceStatus;
  payCurrency: string;
  priceAmount: number;
  payAddress?: string | null;
  payAmount?: number | null;
  paymentUrl?: string | null;
  expiresAtTs?: number | null;
}> | Readonly<{ ok: false; error: string }>;

export type InvoiceStatusResult = Readonly<{
  ok: true;
  provider: PaymentProviderId;
  invoiceId: string;
  status: InvoiceStatus;
  /**
   * The order_id as stored at the payment provider.
   * Authoritative for ownership verification — comes from the provider's API response,
   * never from client-supplied query parameters.
   */
  providerOrderId: string | null;
  /** Price amount from the provider invoice — used for amount integrity checks. */
  providerPriceAmount: number | null;
  /** Pay currency from the provider invoice. */
  providerPayCurrency: string | null;
  paidAtTs?: number | null;
  expiresAtTs?: number | null;
}> | Readonly<{ ok: false; error: string }>;
