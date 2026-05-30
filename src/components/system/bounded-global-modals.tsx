"use client";

import { useAuthModalStore } from "@/store/auth-modal-store";
import { useCheckoutModalStore } from "@/store/checkout-modal-store";
import { useProfileCenterStore } from "@/store/profile-center-store";
import { GlobalAuthModal } from "@/components/auth/global-auth-modal";
import { GlobalCheckoutModal } from "@/components/premium/global-checkout-modal";
import { GlobalProfileCenterModal } from "@/components/profile/global-profile-center-modal";
import { ClientModalErrorBoundary } from "@/components/system/client-modal-error-boundary";

export function BoundedGlobalAuthModal() {
  const open = useAuthModalStore((s) => s.open);
  return (
    <ClientModalErrorBoundary label="auth-modal" resetKey={open}>
      <GlobalAuthModal />
    </ClientModalErrorBoundary>
  );
}

export function BoundedGlobalProfileCenterModal() {
  const open = useProfileCenterStore((s) => s.open);
  return (
    <ClientModalErrorBoundary label="profile-center" resetKey={open}>
      <GlobalProfileCenterModal />
    </ClientModalErrorBoundary>
  );
}

export function BoundedGlobalCheckoutModal() {
  const open = useCheckoutModalStore((s) => s.open);
  return (
    <ClientModalErrorBoundary label="checkout-modal" resetKey={open}>
      <GlobalCheckoutModal />
    </ClientModalErrorBoundary>
  );
}
