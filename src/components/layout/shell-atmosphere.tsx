"use client";

import { AmbientBackdrop } from "@/components/motion/ambient-backdrop";
import { MarketBreathOverlay } from "@/components/motion/market-breath-overlay";
import { useDesktopViewport } from "@/hooks/use-desktop-viewport";

/** Atmospheric layers — desktop only to keep mobile/TG scroll performant. */
export function ShellAtmosphere() {
  const isDesktop = useDesktopViewport();
  if (!isDesktop) return null;

  return (
    <>
      <AmbientBackdrop />
      <MarketBreathOverlay />
    </>
  );
}
