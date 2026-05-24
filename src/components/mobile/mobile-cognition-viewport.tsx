"use client";

import { usePathname } from "next/navigation";
import { useEffect, type ReactNode } from "react";

import {
  getMobileWorldTransition,
  resolveMobileWorldFromPath,
} from "@/lib/cognition/mobile-cognition-routes";
import { cn } from "@/lib/utils";

/** Mobile-only cinematic viewport — sets world atmosphere on scroll root. */
export function MobileCognitionViewport({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const world = resolveMobileWorldFromPath(pathname);
  const profile = world ? getMobileWorldTransition(world) : null;

  useEffect(() => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    if (world) {
      root.dataset.msMobileWorld = world;
      root.dataset.msMobileCadence = profile?.cadenceClass.replace("ms-mobile-cadence--", "") ?? "";
      root.style.setProperty("--ms-mobile-depth-scale", String(profile?.depthScale ?? 1));
      root.style.setProperty("--ms-mobile-breath-scale", String(profile?.breathScale ?? 1));
    } else {
      delete root.dataset.msMobileWorld;
      delete root.dataset.msMobileCadence;
      root.style.removeProperty("--ms-mobile-depth-scale");
      root.style.removeProperty("--ms-mobile-breath-scale");
    }
    return () => {
      delete root.dataset.msMobileWorld;
      delete root.dataset.msMobileCadence;
    };
  }, [world, profile]);

  return (
    <div
      className={cn(
        "ms-mobile-cognition-viewport flex min-h-0 min-w-0 flex-1 flex-col md:contents",
        world && profile?.cadenceClass,
        world && `ms-mobile-world--${world}`,
      )}
      data-ms-mobile-world={world ?? undefined}
    >
      {children}
    </div>
  );
}
