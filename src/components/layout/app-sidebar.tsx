"use client";

import type { LucideIcon } from "lucide-react";
import {
  Archive,
  Binary,
  BookOpen,
  FlaskConical,
  Globe2,
  History,
  Link2,
  Map,
  Orbit,
  Radar,
  Radio,
  ScrollText,
  Settings,
  Target,
  Waypoints,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { useShellStore } from "@/store/shell-store";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n/use-t";
import type { I18nKey } from "@/lib/i18n/strings";
import { sectionPurpose, type PrimarySurfaceId } from "@/lib/i18n/section-ia";
import { useUiPrefsStore } from "@/store/ui-prefs-store";

type NavItem = { href: string; labelKey: I18nKey; icon: LucideIcon; surfaceId?: PrimarySurfaceId };

export function AppSidebar({ className }: { className?: string }) {
  const pathname = usePathname();
  const collapsed = useShellStore((s) => s.sidebarCollapsed);
  const setMobileNavOpen = useShellStore((s) => s.setMobileNavOpen);
  const t = useT();
  const locale = useUiPrefsStore((s) => s.uiLocale);

  const surfaces: NavItem[] = [
    { href: "/", labelKey: "nav.core", icon: Orbit, surfaceId: "core" },
    { href: "/execution", labelKey: "nav.execution", icon: Target, surfaceId: "execution" },
    { href: "/scenarios", labelKey: "nav.scenarios", icon: Binary, surfaceId: "scenarios" },
    { href: "/ops", labelKey: "nav.ops", icon: ScrollText, surfaceId: "ops" },
    { href: "/agents", labelKey: "nav.agents", icon: Radio, surfaceId: "agents" },
    { href: "/macro", labelKey: "nav.macro", icon: Globe2 },
    { href: "/cross-asset", labelKey: "nav.crossAsset", icon: Link2 },
    { href: "/risk-radar", labelKey: "nav.riskRadar", icon: Radar },
    { href: "/sentiment", labelKey: "nav.sentiment", icon: Waypoints },
    { href: "/maps", labelKey: "nav.maps", icon: Map, surfaceId: "maps" },
    { href: "/labs", labelKey: "nav.labs", icon: FlaskConical },
    { href: "/replay", labelKey: "nav.replay", icon: History },
    { href: "/memory", labelKey: "nav.memory", icon: Archive },
  ];

  const secondary: { href: string; labelKey: I18nKey; icon: LucideIcon }[] = [
    { href: "/journal", labelKey: "nav.journal", icon: BookOpen },
    { href: "/settings", labelKey: "nav.settings", icon: Settings },
  ];

  return (
    <aside
      className={cn(
        "relative z-30 flex w-[var(--ms-sidebar-width)] shrink-0 flex-col border-r border-ms-border bg-ms-elevated/92",
        collapsed ? "md:w-[4.25rem]" : "",
        className,
      )}
    >
      <div className="flex h-[var(--ms-intel-bar-height)] items-center border-b border-ms-border px-4">
        <span
          className={cn(
            "text-[11px] font-semibold tracking-tight text-ms-muted",
            collapsed && "md:sr-only",
          )}
        >
          MONEYSET
        </span>
      </div>
      <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto p-2" aria-label="Primary">
        <p
          className={cn(
            "px-3 pb-1 pt-1 text-[10px] font-medium text-ms-faint",
            collapsed && "md:sr-only",
          )}
        >
          {t("nav.surfaces")}
        </p>
        {surfaces.map((item) => {
          const Icon = item.icon;
          const active =
            item.href === "/"
              ? pathname === "/"
              : pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileNavOpen(false)}
              className={cn(
                "ms-focus-ring group flex items-center gap-3 rounded-ms-md px-3 py-2.5 text-[13px] font-medium leading-snug transition-colors",
                active
                  ? "bg-ms-surface text-ms-text"
                  : "text-ms-muted hover:bg-ms-surface/60 hover:text-ms-text",
              )}
            >
              <Icon className="size-4 shrink-0 text-ms-cognition" strokeWidth={1.5} aria-hidden />
              <span className={cn("min-w-0 truncate", collapsed && "md:sr-only")}>
                <span className="block truncate">{t(item.labelKey)}</span>
                {item.surfaceId && !collapsed ? (
                  <span className="block truncate text-[10px] font-normal leading-snug text-ms-faint">
                    {sectionPurpose(locale, item.surfaceId)}
                  </span>
                ) : null}
              </span>
            </Link>
          );
        })}
        <div className="my-2 h-px bg-ms-border/40" />
        {secondary.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileNavOpen(false)}
              className={cn(
                "ms-focus-ring group flex items-center gap-3 rounded-ms-md px-3 py-2.5 text-[13px] font-medium leading-snug transition-colors",
                active
                  ? "bg-ms-surface text-ms-text"
                  : "text-ms-muted hover:bg-ms-surface/60 hover:text-ms-text",
              )}
            >
              <Icon className="size-4 shrink-0 text-ms-cognition" strokeWidth={1.5} aria-hidden />
              <span className={cn("truncate", collapsed && "md:sr-only")}>{t(item.labelKey)}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
