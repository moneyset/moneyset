"use client";

import { usePathname } from "next/navigation";

import {
  mobileWorldLabel,
  resolveMobileWorldFromPath,
} from "@/lib/cognition/mobile-cognition-routes";
import { cn } from "@/lib/utils";
import { useUiPrefsStore } from "@/store/ui-prefs-store";

/** Compact mobile dimension indicator — replaces verbose chrome on small screens. */
export function MobileWorldBeacon() {
  const pathname = usePathname();
  const locale = useUiPrefsStore((s) => s.uiLocale);
  const world = resolveMobileWorldFromPath(pathname);

  if (!world) return null;

  return (
    <div
      className={cn("ms-mobile-world-beacon md:hidden", `ms-mobile-world-beacon--${world}`)}
      aria-hidden
    >
      <span className="ms-mobile-world-beacon__pulse" />
      <span className="ms-mobile-world-beacon__label">{mobileWorldLabel(world, locale)}</span>
    </div>
  );
}
