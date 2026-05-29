"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

import type { PaymentProviderId, SubscriptionRecord, SubscriptionTier } from "@/types/billing";

type SubscriptionState = SubscriptionRecord & {
  setTierActive: (
    tier: Exclude<SubscriptionTier, "free">,
    args?: { provider?: PaymentProviderId; periodDays?: number | null },
  ) => void;
  setFree: () => void;
  setPendingInvoice: (args: {
    provider: PaymentProviderId;
    invoiceId: string;
    paymentUrl?: string | null;
  }) => void;
  clearPendingInvoice: () => void;
  setStatus: (status: SubscriptionRecord["status"]) => void;
};

const initial: SubscriptionRecord = {
  tier: "free",
  status: "inactive",
  provider: null,
  currentPeriodEndTs: null,
  lastInvoiceId: null,
  lastPaymentUrl: null,
  updatedAtTs: null,
};

export const useSubscriptionStore = create<SubscriptionState>()(
  persist(
    (set) => ({
      ...initial,

      setTierActive: (tier, args) =>
        set(() => ({
          tier,
          status: "active",
          provider: args?.provider ?? null,
          currentPeriodEndTs:
            args?.periodDays === null
              ? null
              : Date.now() + (args?.periodDays ?? 30) * 24 * 60 * 60_000,
          updatedAtTs: Date.now(),
        })),

      setFree: () =>
        set(() => ({
          ...initial,
          updatedAtTs: Date.now(),
        })),

      setPendingInvoice: ({ provider, invoiceId, paymentUrl }) =>
        set((s) => ({
          provider,
          lastInvoiceId: invoiceId,
          lastPaymentUrl: paymentUrl ?? s.lastPaymentUrl,
          status: s.status === "active" ? s.status : "inactive",
          updatedAtTs: Date.now(),
        })),

      clearPendingInvoice: () =>
        set((s) => ({
          lastInvoiceId: null,
          lastPaymentUrl: null,
          status: s.status,
          updatedAtTs: Date.now(),
        })),

      setStatus: (status) => set(() => ({ status, updatedAtTs: Date.now() })),
    }),
    {
      name: "moneyset_subscription_v1",
      partialize: (s) => ({
        // tier/status intentionally excluded: entitlement-like fields must not be
        // stored in localStorage. They are in-memory only — reset on every page load
        // and re-populated from server state via the checkout/status flow.
        // lastInvoiceId is persisted solely for the resume-on-reload UX (re-opening
        // a pending payment after a refresh) — it carries no access authority.
        lastInvoiceId: s.lastInvoiceId,
        lastPaymentUrl: s.lastPaymentUrl,
        provider: s.provider,
        updatedAtTs: s.updatedAtTs,
      }),
      skipHydration: true,
    },
  ),
);

