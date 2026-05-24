"use client";

import type { ReactNode } from "react";

import { CognitionPulseStrip } from "@/components/motion/cognition-pulse-strip";
import { ShellAtmosphere } from "@/components/layout/shell-atmosphere";
import { DesktopCommandCenter } from "@/components/desktop/desktop-command-center";
import { MobileCognitionViewport } from "@/components/mobile/mobile-cognition-viewport";
import { MobileWorldBeacon } from "@/components/mobile/mobile-world-beacon";
import { RouteFade } from "@/components/motion/route-fade";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { IntelligenceBar } from "@/components/layout/intelligence-bar";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";
import { MobileNavOverlay } from "@/components/layout/mobile-nav-overlay";
import { InvitationAccessBanner } from "@/components/access/invitation-access-banner";
import { UpgradeModal } from "@/components/premium/upgrade-modal";
import { useUpgradeModalStore } from "@/store/upgrade-modal-store";
import { CommandPalette } from "@/components/layout/command-palette";
import { CognitionOnboarding } from "@/components/onboarding/cognition-onboarding";
import { CognitionSurfaceErrorBoundary } from "@/components/system/cognition-surface-error-boundary";
import { cn } from "@/lib/utils";

export function AppShell({ children }: { children: ReactNode }) {
  const upgradeOpen = useUpgradeModalStore((s) => s.open);
  const closeUpgrade = useUpgradeModalStore((s) => s.closeUpgrade);
  return (
    <div className="ms-category-shell relative flex min-h-0 min-w-0 flex-1 flex-col bg-ms-canvas text-ms-text md:flex-row">
      <ShellAtmosphere />
      <div className="relative z-10 hidden min-h-0 md:flex">
        <AppSidebar />
      </div>
      <div className="relative z-10 ms-shell-primary-column flex min-h-0 min-w-0 flex-1 flex-col">
        <div className="ms-shell-chrome-stack">
          <InvitationAccessBanner />
          <IntelligenceBar />
          <CognitionPulseStrip />
          <MobileWorldBeacon />
        </div>
        <RouteFade>
          <div className="relative flex min-h-0 flex-1 flex-col">
            <MobileCognitionViewport>
              <div
                className={cn(
                  "ms-scroll-main ms-scroll-main--command-host ms-desktop-workspace-depth mx-auto min-h-0 w-full min-w-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-y-contain pb-[var(--ms-mobile-nav-pad)] md:scroll-smooth motion-reduce:scroll-auto md:pb-0",
                  "max-w-[var(--ms-content-max)] lg:max-w-none lg:overflow-hidden lg:pb-0",
                )}
              >
                <DesktopCommandCenter>
                  <CognitionSurfaceErrorBoundary>{children}</CognitionSurfaceErrorBoundary>
                </DesktopCommandCenter>
              </div>
            </MobileCognitionViewport>
          </div>
        </RouteFade>
      </div>
      <MobileNavOverlay />
      <MobileBottomNav />
      <UpgradeModal open={upgradeOpen} onClose={closeUpgrade} />
      <CommandPalette />
      <CognitionOnboarding />
    </div>
  );
}
