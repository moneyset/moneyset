import type { CreateInvoiceInput, CreateInvoiceResult, InvoiceStatusResult, PaymentProviderId } from "@/types/billing";

export type PaymentProviderContext = Readonly<{ userId: string }>;

export type PaymentProvider = Readonly<{
  id: PaymentProviderId;
  createInvoice: (input: CreateInvoiceInput, ctx?: PaymentProviderContext) => Promise<CreateInvoiceResult>;
  getInvoiceStatus: (args: { invoiceId: string }) => Promise<InvoiceStatusResult>;
  /** Verify + parse webhook body (provider-specific). Returns invoice id and normalized status. */
  verifyWebhook?: (args: { rawBody: string; headers: Headers }) => Promise<{ invoiceId: string; status: string } | null>;
}>;

