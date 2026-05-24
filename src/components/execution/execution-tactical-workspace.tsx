"use client";

import { CognitionNavRail } from "@/components/cognition/cognition-nav-rail";
import { ExecutionMapLayer } from "@/components/execution/execution-map-layer";
import { ExecutionStructuralRail } from "@/components/execution/execution-structural-rail";
import { ExecutionTacticalTheater } from "@/components/execution/execution-tactical-theater";
import { useExecutionSurface } from "@/hooks/use-execution-surface";
import { executionSessionDeskStrip, utcSessionAmbientBarClass } from "@/lib/cognition/session-visual";
import { formatPriceRange } from "@/lib/execution/derive-execution-layer";
import { pickLocale } from "@/lib/i18n/cognition-dict";
import { cn } from "@/lib/utils";
import { useUiPrefsStore } from "@/store/ui-prefs-store";

export function ExecutionTacticalWorkspace({ className }: { className?: string }) {
  const locale = useUiPrefsStore((s) => s.uiLocale);
  const surface = useExecutionSurface();
  const anchorDisplay =
    surface.anchorPrice !== null
      ? formatPriceRange(locale, surface.anchorPrice, surface.anchorPrice)
      : "—";

  return (
    <section
      id="execution-posture"
      data-ms-focus
      className={cn("ms-exec-tactical-system scroll-mt-[calc(var(--ms-intel-bar-height)+0.5rem)]", className)}
      aria-label={pickLocale(locale, "Tactical execution environment", "Тактическая среда исполнения")}
    >
      <div className={cn("mb-4 h-px w-full rounded-full opacity-90", utcSessionAmbientBarClass())} aria-hidden />

      <header className="mb-5 flex flex-col gap-3 border-b border-ms-border/18 pb-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0 space-y-1">
          <p className="ms-data-label text-ms-faint">
            {pickLocale(locale, "Tactical execution", "Тактическое исполнение")}
          </p>
          <p className="text-[10px] leading-snug text-ms-muted">{executionSessionDeskStrip(locale)}</p>
        </div>
        <div className="min-w-0 shrink-0 text-end">
          <p className="ms-data-label text-ms-faint">{pickLocale(locale, "Anchor", "Якорь")}</p>
          <p className="text-[13px] font-medium tabular-nums text-ms-text/90">{anchorDisplay}</p>
          <p className="text-[10px] text-ms-faint/90">{surface.symbol}</p>
        </div>
      </header>

      <ExecutionMapLayer className="mb-5" />
      <ExecutionTacticalTheater />

      <details className="group mt-6 max-lg:hidden rounded-ms-lg border border-ms-border/20 bg-ms-surface/6">
        <summary className="ms-focus-ring cursor-pointer list-none px-4 py-3 text-[11px] font-medium text-ms-muted [&::-webkit-details-marker]:hidden">
          <span className="mr-1.5 inline-block text-ms-faint transition-transform group-open:rotate-90" aria-hidden>
            ›
          </span>
          {pickLocale(locale, "Structural rail — compressed reference", "Структурный рейл — сжатая справка")}
        </summary>
        <div className="border-t border-ms-border/12 px-4 pb-4 pt-3">
          <ExecutionStructuralRail
            zones={surface.zones}
            anchorPrice={surface.anchorPrice}
            locale={locale}
            cadenceSeries={surface.cadenceSeries}
            microCognition={surface.microCognition}
            className="min-h-[200px]"
          />
        </div>
      </details>

      <CognitionNavRail className="mt-6" links={[{ href: "/labs/chart", labelEn: "Chart Lab", labelRu: "Chart Lab" }]} />
    </section>
  );
}
