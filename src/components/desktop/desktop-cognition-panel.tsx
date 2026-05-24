"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import type { DesktopPanelState } from "@/lib/desktop/desktop-command-orchestrator";
import { mobileWorldLabel } from "@/lib/cognition/mobile-cognition-routes";
import { pickLocale } from "@/lib/i18n/cognition-dict";
import { cn } from "@/lib/utils";
import { useUiPrefsStore } from "@/store/ui-prefs-store";

export type DesktopCognitionPanelProps = {
  panel: DesktopPanelState;
  headline: string;
  stateLine?: string;
  children?: React.ReactNode;
  className?: string;
};

/** Adaptive live cognition tile — expands when orchestration elevates priority. */
export function DesktopCognitionPanel({
  panel,
  headline,
  stateLine,
  children,
  className,
}: DesktopCognitionPanelProps) {
  const pathname = usePathname();
  const locale = useUiPrefsStore((s) => s.uiLocale);
  const active = pathname === panel.href || pathname.startsWith(`${panel.href}/`);
  const flexGrow = 0.65 + panel.weight * 0.85;

  return (
    <Link
      href={panel.href}
      data-ms-world={panel.world}
      data-ms-desk-panel={panel.id}
      data-ms-desk-priority={panel.priority}
      data-ms-desk-active={active ? "true" : undefined}
      className={cn(
        "ms-desk-panel group relative flex flex-col overflow-hidden rounded-ms-xl border transition-[flex-grow,border-color,box-shadow,transform] duration-500 ease-out",
        "border-ms-border/35 bg-ms-surface/25 hover:border-ms-border-mid hover:bg-ms-surface/40",
        panel.priority === "primary" && "ms-desk-panel--primary border-ms-cognition/35 shadow-[0_0_40px_-12px_var(--ms-cognition-dim)]",
        panel.priority === "elevated" && "ms-desk-panel--elevated",
        panel.expanded ? "ms-desk-panel--expanded" : "ms-desk-panel--collapsed",
        panel.syncEffect,
        active && "ms-desk-panel--route-active ring-1 ring-ms-cognition/25",
        className,
      )}
      style={{ flexGrow, flexBasis: panel.expanded ? "12rem" : "7rem" }}
    >
      <div className="ms-desk-panel__atmosphere" aria-hidden />
      <div className="ms-desk-panel__header relative z-[1] flex items-start justify-between gap-2 px-3 pt-3">
        <div className="min-w-0">
          <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-ms-faint">
            {mobileWorldLabel(panel.world, locale)}
          </p>
          <p className="mt-1 line-clamp-2 text-[12px] font-semibold leading-snug text-ms-text">{headline}</p>
        </div>
        <span
          className={cn(
            "ms-desk-panel__weight mt-0.5 shrink-0 tabular-nums text-[10px] font-medium",
            panel.priority === "primary" ? "text-ms-cognition" : "text-ms-faint",
          )}
          aria-hidden
        >
          {Math.round(panel.weight * 100)}
        </span>
      </div>
      {stateLine ? (
        <p className="relative z-[1] px-3 text-[10px] leading-snug text-ms-muted">{stateLine}</p>
      ) : null}
      <div className="relative z-[1] flex min-h-0 flex-1 flex-col px-3 pb-3 pt-2">
        {children}
        <span className="mt-auto pt-2 text-[9px] font-medium text-ms-faint opacity-0 transition-opacity group-hover:opacity-100">
          {pickLocale(locale, "Open surface →", "Открыть →")}
        </span>
      </div>
    </Link>
  );
}
