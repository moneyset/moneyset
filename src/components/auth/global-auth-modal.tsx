"use client";

import { AuthModal } from "@/components/auth/auth-modal";
import { useAuthModalStore } from "@/store/auth-modal-store";

/** Auth modal before AppShell (invite redeem, entry checkout, etc.). */
export function GlobalAuthModal() {
  const authOpen = useAuthModalStore((s) => s.open);
  const closeAuth = useAuthModalStore((s) => s.closeAuth);

  return <AuthModal open={authOpen} onClose={closeAuth} />;
}
