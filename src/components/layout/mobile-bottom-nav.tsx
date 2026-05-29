"use client";

import type { LucideIcon } from "lucide-react";
import { Binary, Map, Orbit, Radio, ScrollText, Target } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import type { CognitionWorldId } from "@/lib/cognition/cognition-worlds";
import type { I18nKey } from "@/lib/i18n/strings";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n/use-t";
import { useUiPrefsStore } from "@/store/ui-prefs-store";

type NavItem = { href: string; labelKey: I18nKey; icon: LucideIcon; world?: CognitionWorldId };

/** Six primary mobile surfaces — Memory & Labs live under Settings / drawer. */
const PRIMARY: NavItem[] = [
  { href: "/", labelKey: "nav.core", icon: Orbit, world: "execution" },
  { href: "/execution", labelKey: "nav.execution", icon: Target, world: "execution" },
  { href: "/scenarios", labelKey: "nav.scenarios", icon: Binary },
  { href: "/ops", labelKey: "nav.ops", icon: ScrollText },
  { href: "/maps", labelKey: "nav.maps", icon: Map },
  { href: "/agents", labelKey: "nav.agents", icon: Radio, world: "agents" },
];

export function MobileBottomNav() {
  const t = useT();
  const pathname = usePathname();
  const showLabels = useUiPrefsStore((s) => s.showMobileNavLabels);

  return (
    <nav
      aria-label="Mobile cognition navigation"
      className={cn(
        "ms-mobile-bottom-nav fixed inset-x-0 bottom-0 z-30 md:hidden",
        "border-t border-ms-border bg-ms-elevated/95 supports-[backdrop-filter]:bg-ms-elevated/95",
      )}
    >
      <div className="mx-auto max-w-[40rem] px-1.5 pt-2 pb-1.5">
        <div className="grid min-w-0 grid-cols-6 gap-0.5">
          {PRIMARY.map((item) => {
            const Icon = item.icon;
            const active =
              item.href === "/"
                ? pathname === "/"
                : pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                data-ms-nav-world={active && item.world ? item.world : undefined}
                className={cn(
                  "ms-mobile-bottom-nav__link ms-focus-ring group flex min-h-[48px] min-w-0 flex-col items-center justify-center gap-0.5 rounded-ms-md px-0.5 py-1",
                  "text-ms-muted transition-[color,background-color,transform] duration-200 ease-out",
                  "active:scale-[0.97] active:bg-ms-surface/60",
                  "hover:bg-ms-surface/50 hover:text-ms-text",
                  active && "ms-mobile-bottom-nav__link--active bg-ms-surface/55 text-ms-text",
                )}
              >
                <Icon
                  className={cn(
                    "size-[22px] shrink-0",
                    active ? "text-ms-cognition" : "text-ms-cognition/75 group-hover:text-ms-cognition",
                  )}
                  strokeWidth={1.45}
                  aria-hidden
                />
                <span
                  className={cn(
                    "ms-mobile-bottom-nav__link-label max-w-full truncate text-center text-[10px] font-medium leading-tight text-ms-muted group-hover:text-ms-text sm:text-[11px]",
                    !showLabels && "opacity-0",
                  )}
                >
                  {t(item.labelKey)}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
