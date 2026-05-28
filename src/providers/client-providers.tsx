"use client";

import { LazyMotion, domAnimation } from "framer-motion";
import type { ReactNode } from "react";

import { TelegramWebAppBridge } from "@/components/layout/telegram-webapp-bridge";
import { TelegramInstitutionalIntro } from "@/components/telegram/telegram-institutional-intro";
import { PersistRehydration } from "@/providers/persist-rehydration";
import { ThemeProvider } from "@/providers/theme-provider";
import { AccessSyncBanner } from "@/components/system/access-sync-banner";
import { AuthBootstrap } from "@/components/auth/auth-bootstrap";
import { IntelligenceBootstrap } from "@/components/intelligence/intelligence-bootstrap";
import { MoneysetEntryOnboarding } from "@/components/onboarding/moneyset-entry-onboarding";
import { GlobalAuthModal } from "@/components/auth/global-auth-modal";
import { GlobalCheckoutModal } from "@/components/premium/global-checkout-modal";
import { GlobalProfileCenterModal } from "@/components/profile/global-profile-center-modal";

export function ClientProviders({ children }: { children: ReactNode }) {
  return (
    <LazyMotion features={domAnimation} strict>
      <PersistRehydration />
      <ThemeProvider>
        <TelegramWebAppBridge />
        <TelegramInstitutionalIntro />
        <AuthBootstrap />
        <AccessSyncBanner />
        <MoneysetEntryOnboarding />
        <GlobalAuthModal />
        <GlobalProfileCenterModal />
        <GlobalCheckoutModal />
        <IntelligenceBootstrap />
        {children}
      </ThemeProvider>
    </LazyMotion>
  );
}
