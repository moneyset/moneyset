"use client";

import { usePathname } from "next/navigation";
import type { CSSProperties, ReactNode } from "react";

import { DesktopCommandDeck } from "@/components/desktop/desktop-command-deck";
import { DesktopCommandRail } from "@/components/desktop/desktop-command-rail";
import { useDesktopCommand } from "@/hooks/use-desktop-command";
import { useDesktopViewport } from "@/hooks/use-desktop-viewport";
import { isDesktopCommandRoute } from "@/lib/desktop/desktop-command-orchestrator";
import { cn } from "@/lib/utils";

/** Desktop-only command grid — mobile/tablet use direct children (single scroll). */
export function DesktopCommandCenter({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isDesktop = useDesktopViewport();
  const orchestration = useDesktopCommand();
  const enabled = isDesktopCommandRoute(pathname);

  if (!isDesktop || !enabled) {
    return <>{children}</>;
  }

  return (
    <div
      className="ms-desktop-command-center relative flex min-h-0 min-w-0 flex-1 flex-col"
      data-ms-desk-phase={orchestration.deckPhase}
      data-ms-desk-focus={orchestration.focusPanel ?? undefined}
      data-ms-route-world={orchestration.routeWorld ?? undefined}
      style={orchestration.cssVars as CSSProperties}
    >
      <div className="ms-desk-command-atmosphere" aria-hidden />
      <DesktopCommandDeck />
      <div
        className={cn(
          "ms-desk-command-grid relative z-[1] flex min-h-0 flex-1 gap-3 px-3 pb-4 pt-3 xl:gap-4 xl:px-5",
          orchestration.crossSync.map((fx) => `ms-desk-cross--${fx}`),
        )}
      >
        <DesktopCommandRail side="left" orchestration={orchestration} className="w-[min(15rem,18vw)] shrink-0" />
        <main className="ms-desk-command-main min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-y-contain scroll-smooth rounded-ms-2xl border border-ms-border/30 bg-ms-elevated/8 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
          <div className="ms-desk-command-main__inner">{children}</div>
        </main>
        <DesktopCommandRail side="right" orchestration={orchestration} className="w-[min(15rem,18vw)] shrink-0" />
      </div>
    </div>
  );
}
