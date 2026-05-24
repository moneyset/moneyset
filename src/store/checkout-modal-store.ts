"use client";

import { create } from "zustand";

import type { BillingProductId } from "@/lib/billing/catalog";

type CheckoutModalState = {
  open: boolean;
  productId: BillingProductId;
  openCheckout: (productId?: BillingProductId) => void;
  closeCheckout: () => void;
};

export const useCheckoutModalStore = create<CheckoutModalState>((set) => ({
  open: false,
  productId: "premium_monthly",
  openCheckout: (productId = "premium_monthly") => set({ open: true, productId }),
  closeCheckout: () => set({ open: false }),
}));
