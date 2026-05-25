"use client";

import { blufAriaLabel, blufLabel, hierarchySectionLabel } from "@/lib/i18n/section-ia";
import { cn } from "@/lib/utils";
import { useUiPrefsStore } from "@/store/ui-prefs-store";
import type { SurfaceBlufSnapshot } from "@/hooks/use-surface-bluf";

type SurfaceBlufBlockProps = {
  bluf: SurfaceBlufSnapshot;
  className?: string;
};

function toneClass(tone: SurfaceBlufSnapshot["rows"][number]["tone"]): string {
  if (tone === "risk") return "text-ms-danger/92";
  if (tone === "warning") return "text-ms-warning/90";
  if (tone === "cognition") return "text-ms-cognition";
  return "text-ms-text";
}

/** BLUF — conclusion first, above the fold on every major surface. */
export function SurfaceBlufBlock({ bluf, className }: SurfaceBlufBlockProps) {
  const locale = useUiPrefsStore((s) => s.uiLocale);

  return (
    <section
      className={cn(
        "mb-[var(--ms-block-gap)] overflow-hidden rounded-ms-xl border border-ms-cognition/22 bg-gradient-to-b from-ms-cognition/[0.06] via-ms-surface/25 to-ms-elevated/10",
        className,
      )}
      aria-label={blufAriaLabel(locale)}
    >
      <header className="border-b border-ms-border/20 px-4 py-2.5 sm:px-5">
        <p className="font-mono text-[10px] font-medium uppercase tracking-[0.2em] text-ms-cognition/85">
          {hierarchySectionLabel(locale, "conclusion")}
        </p>
      </header>

      <div className="grid gap-3 px-4 py-4 sm:grid-cols-2 sm:px-5 lg:grid-cols-4">
        {bluf.rows.map((row) => (
          <div key={row.labelKey} className="min-w-0 border-l border-ms-border/30 pl-3">
            <p className="ms-data-label text-ms-faint">{blufLabel(locale, row.labelKey)}</p>
            <p className={cn("mt-1 text-[13px] font-medium leading-snug", toneClass(row.tone))}>{row.value}</p>
          </div>
        ))}
      </div>

      <div className="border-t border-ms-border/20 bg-ms-elevated/12 px-4 py-3.5 sm:px-5">
        <p className="ms-data-label text-ms-faint">{blufLabel(locale, "primaryImplication")}</p>
        <p className="mt-1.5 text-pretty text-[13px] leading-relaxed text-ms-text sm:text-[14px]">{bluf.implication}</p>
      </div>
    </section>
  );
}
