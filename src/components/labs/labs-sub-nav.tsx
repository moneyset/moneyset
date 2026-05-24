"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { LABS_OVERVIEW_ICON, LAB_ICONS } from "@/components/labs/labs-icons";
import { allLabModules, labCopy } from "@/lib/labs/labs-modules";
import { pickLocale } from "@/lib/i18n/cognition-dict";
import { cn } from "@/lib/utils";
import { useUiPrefsStore } from "@/store/ui-prefs-store";

const OverviewIcon = LABS_OVERVIEW_ICON;

/** Intentional entry into Level-3 analysis — compact, scannable, not Core chrome. */
export function LabsSubNav({ className }: { className?: string }) {
  const pathname = usePathname();
  const locale = useUiPrefsStore((s) => s.uiLocale);
  const modules = allLabModules();
  const hub = pathname === "/labs" || pathname === "/labs/";

  return (
    <nav
      aria-label={pickLocale(locale, "Labs modules", "Модули Labs")}
      className={cn(
        "mb-6 flex flex-col gap-3 border-b border-ms-border/25 pb-5 sm:mb-7 sm:pb-6",
        className,
      )}
    >
      <div className="ms-labs-sub-nav-scroll flex min-w-0 flex-nowrap items-center gap-2 pb-0.5">
        <Link
          href="/labs"
          className={cn(
            "ms-focus-ring inline-flex items-center gap-1.5 rounded-ms-md border px-2.5 py-1.5 text-[11px] font-medium transition-colors",
            hub
              ? "border-ms-cognition/35 bg-ms-cognition-dim/20 text-ms-text"
              : "border-ms-border/60 bg-ms-surface/25 text-ms-muted hover:border-ms-border-mid hover:text-ms-text",
          )}
        >
          <OverviewIcon className="size-3.5 shrink-0 opacity-80" strokeWidth={1.5} aria-hidden />
          {pickLocale(locale, "Overview", "Обзор")}
        </Link>
        {modules.map((m) => {
          const href = `/labs/${m.slug}`;
          const active = pathname === href || pathname.startsWith(`${href}/`);
          const Icon = LAB_ICONS[m.slug];
          return (
            <Link
              key={m.slug}
              href={href}
              className={cn(
                "ms-focus-ring inline-flex max-w-full items-center gap-1.5 rounded-ms-md border px-2.5 py-1.5 text-[11px] font-medium transition-colors",
                active
                  ? "border-ms-cognition/35 bg-ms-cognition-dim/20 text-ms-text"
                  : "border-ms-border/50 bg-ms-elevated/20 text-ms-muted hover:border-ms-border-mid hover:text-ms-text",
              )}
            >
              <Icon className="size-3.5 shrink-0 opacity-80" strokeWidth={1.5} aria-hidden />
              <span className="truncate">{labCopy(locale, m.title)}</span>
            </Link>
          );
        })}
      </div>
      <p className="text-[10px] leading-relaxed text-ms-faint sm:text-[11px]">
        {pickLocale(
          locale,
          "Level 3 — deep analysis environments. Distinct from Core and primary execution surfaces.",
          "Уровень 3 — глубокие аналитические среды. Отдельно от Core и основных поверхностей исполнения.",
        )}
      </p>
    </nav>
  );
}
