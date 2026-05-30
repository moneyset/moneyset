"use client";

import { LazyMotion, domAnimation } from "framer-motion";
import type { ReactNode } from "react";

import { TelegramWebAppBridge } from "@/components/layout/telegram-webapp-bridge";
import { TelegramAuthBootstrap } from "@/components/auth/telegram-auth-bootstrap";
import { TelegramInstitutionalIntro } from "@/components/telegram/telegram-institutional-intro";
import { PersistRehydration } from "@/providers/persist-rehydration";
import { ThemeProvider } from "@/providers/theme-provider";
import { AccessSyncBanner } from "@/components/system/access-sync-banner";
import { AuthBootstrap } from "@/components/auth/auth-bootstrap";
import { IntelligenceBootstrap } from "@/components/intelligence/intelligence-bootstrap";
import { MoneysetEntryOnboarding } from "@/components/onboarding/moneyset-entry-onboarding";
import { ClientModalErrorBoundary } from "@/components/system/client-modal-error-boundary";
import { GlobalAuthModal } from "@/components/auth/global-auth-modal";
import { GlobalCheckoutModal } from "@/components/premium/global-checkout-modal";
import { GlobalProfileCenterModal } from "@/components/profile/global-profile-center-modal";

export function ClientProviders({ children }: { children: ReactNode }) {
  return (
    <LazyMotion features={domAnimation} strict>
      <PersistRehydration />
      <ThemeProvider>
        <TelegramWebAppBridge />
        <TelegramAuthBootstrap />
        <TelegramInstitutionalIntro />
        <AuthBootstrap />
        <AccessSyncBanner />
        <MoneysetEntryOnboarding />
        <ClientModalErrorBoundary label="auth-modal">
          <GlobalAuthModal />
        </ClientModalErrorBoundary>
        <ClientModalErrorBoundary label="profile-center">
          <GlobalProfileCenterModal />
        </ClientModalErrorBoundary>
        <ClientModalErrorBoundary label="checkout-modal">
          <GlobalCheckoutModal />
        </ClientModalErrorBoundary>
        <IntelligenceBootstrap />
        {children}
      </ThemeProvider>
    </LazyMotion>
  );
}
