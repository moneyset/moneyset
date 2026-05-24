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
  setPendingInvoice: (args: { provider: PaymentProviderId; invoiceId: string }) => void;
  setStatus: (status: SubscriptionRecord["status"]) => void;
};

const initial: SubscriptionRecord = {
  tier: "free",
  status: "inactive",
  provider: null,
  currentPeriodEndTs: null,
  lastInvoiceId: null,
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

      setPendingInvoice: ({ provider, invoiceId }) =>
        set((s) => ({
          provider,
          lastInvoiceId: invoiceId,
          status: s.status === "active" ? s.status : "inactive",
          updatedAtTs: Date.now(),
        })),

      setStatus: (status) => set(() => ({ status, updatedAtTs: Date.now() })),
    }),
    { name: "moneyset_subscription_v1", partialize: (s) => ({ tier: s.tier, status: s.status, provider: s.provider, currentPeriodEndTs: s.currentPeriodEndTs, lastInvoiceId: s.lastInvoiceId, updatedAtTs: s.updatedAtTs }), skipHydration: true },
  ),
);

