"use client";

import { CryptoCheckoutModal } from "@/components/premium/crypto-checkout-modal";
import { useCheckoutModalStore } from "@/store/checkout-modal-store";

/** Checkout available before AppShell (e.g. institutional entry screen). */
export function GlobalCheckoutModal() {
  const checkoutOpen = useCheckoutModalStore((s) => s.open);
  const closeCheckout = useCheckoutModalStore((s) => s.closeCheckout);

  return <CryptoCheckoutModal open={checkoutOpen} onClose={closeCheckout} />;
}
