"use client";

import { AnimatePresence, m } from "framer-motion";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { useDesktopViewport } from "@/hooks/use-desktop-viewport";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { msFade, msTransition } from "@/lib/theme";

/**
 * Stable route transitions — no blur, no wait-unmount on mobile/tablet.
 * Desktop uses a light opacity fade only.
 */
export function RouteFade({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const reduceMotion = useReducedMotion();
  const isDesktop = useDesktopViewport();

  if (!isDesktop || reduceMotion) {
    return (
      <div key={pathname} className="flex min-h-0 min-w-0 flex-1 flex-col">
        {children}
      </div>
    );
  }

  const transition = msTransition.medium;

  return (
    <AnimatePresence mode="sync" initial={false}>
      <m.div
        key={pathname}
        className="flex min-h-0 min-w-0 flex-1 flex-col"
        initial={msFade.initial}
        animate={msFade.animate}
        exit={msFade.exit}
        transition={transition}
      >
        {children}
      </m.div>
    </AnimatePresence>
  );
}
