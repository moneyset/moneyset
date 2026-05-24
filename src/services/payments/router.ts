import type { PaymentProvider } from "@/services/payments/provider";
import { nowPaymentsProvider } from "@/services/payments/providers/nowpayments";

export function paymentProvider(): PaymentProvider {
  // MVP: default to NOWPayments. Future: select via env or user region.
  return nowPaymentsProvider;
}

