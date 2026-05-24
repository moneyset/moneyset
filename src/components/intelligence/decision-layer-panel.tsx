"use client";

import { Lock } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useDecisionLayer } from "@/hooks/use-decision-layer";
import { useCanAccessCapability } from "@/hooks/use-capabilities";
import { useT } from "@/lib/i18n/use-t";
import { useLocale } from "@/lib/i18n/use-t";
import { cn } from "@/lib/utils";
import { useUpgradeModalStore } from "@/store/upgrade-modal-store";
import type { PictureChangeKind } from "@/lib/intelligence/decision-layer-engine";

function pictureGlyph(kind: PictureChangeKind): string {
  if (kind === "confirm") return "✓";
  if (kind === "invalidate") return "✗";
  return "◆";
}

export function DecisionLayerPanel({ className }: { className?: string }) {
  const t = useT();
  const locale = useLocale();
  const decision = useDecisionLayer();
  const canExecutionPlan = useCanAccessCapability("executionLayer");
  const openUpgrade = useUpgradeModalStore((s) => s.openUpgrade);

  const displayHeadline =
    locale === "en" ? decision.headline.toUpperCase() : decision.headline;

  return (
    <section
      className={cn(
        "mb-6 min-w-0 overflow-hidden rounded-ms-xl border border-ms-cognition/25 bg-gradient-to-b from-ms-cognition/[0.07] via-ms-surface/20 to-ms-elevated/12",
        className,
      )}
      aria-label={t("decision.aria")}
    >
      <div className="border-b border-ms-border/20 px-4 py-4 sm:px-5 sm:py-5">
        <p className="font-mono text-[10px] font-medium uppercase tracking-[0.22em] text-ms-cognition/80">
          {t("decision.marketPosture")}
        </p>
        <h1 className="mt-3 text-pretty text-[clamp(1.35rem,4.2vw,2rem)] font-semibold leading-[1.12] tracking-[-0.02em] text-ms-text">
          {displayHeadline}
        </h1>
        <p className="mt-3 max-w-4xl text-pretty text-[13px] leading-relaxed text-ms-muted sm:text-[14px]">
          {decision.subline}
        </p>
      </div>

      <div className="relative border-b border-ms-border/15 px-4 py-4 sm:px-5 sm:py-5">
        <p className="font-mono text-[10px] font-medium uppercase tracking-[0.18em] text-ms-faint">
          {t("decision.whatToDo")}
        </p>

        {!canExecutionPlan ? (
          <div className="relative mt-3 overflow-hidden rounded-ms-lg border border-ms-border/30 bg-ms-surface/15">
            <ul
              className="pointer-events-none select-none space-y-2.5 px-3 py-3 blur-[4px] opacity-[0.38]"
              aria-hidden
            >
              {decision.whatToDoNow.map((line, i) => (
                <li key={i} className="flex gap-2.5 text-[12px] leading-snug text-ms-text sm:text-[13px]">
                  <span className="shrink-0 text-ms-cognition">✓</span>
                  <span>{line}</span>
                </li>
              ))}
            </ul>
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-ms-canvas/55 px-4 py-6 backdrop-blur-[2px]">
              <div className="flex size-10 items-center justify-center rounded-ms-md border border-ms-border/50 bg-ms-elevated/30 text-ms-muted">
                <Lock className="size-4" strokeWidth={1.35} aria-hidden />
              </div>
              <p className="max-w-sm text-center text-[12px] leading-snug text-ms-text sm:text-[13px]">
                {t("decision.foundingGate")}
              </p>
              <Button type="button" variant="cognition" size="sm" className="mt-1" onClick={openUpgrade}>
                {t("decision.foundingCta")}
              </Button>
            </div>
          </div>
        ) : (
          <ul className="mt-3 space-y-2.5">
            {decision.whatToDoNow.map((line) => (
              <li key={line} className="flex gap-2.5 text-[12px] leading-snug text-ms-text sm:text-[13px]">
                <span className="mt-0.5 shrink-0 font-mono text-[11px] text-ms-cognition" aria-hidden>
                  ✓
                </span>
                <span className="text-pretty">{line}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="px-4 py-4 sm:px-5 sm:py-5">
        <p className="font-mono text-[10px] font-medium uppercase tracking-[0.18em] text-ms-faint">
          {t("decision.pictureChanges")}
        </p>
        <p className="mt-2 text-[11px] leading-snug text-ms-dim">{t("decision.pictureLegend")}</p>
        <ul className="mt-3 grid gap-2 sm:gap-2.5">
          {decision.pictureChanges.map((row, idx) => (
            <li
              key={`${idx}-${row.text.slice(0, 24)}`}
              className={cn(
                "flex gap-2.5 rounded-ms-md border px-3 py-2 text-[11px] leading-snug sm:text-[12px]",
                row.kind === "confirm" && "border-ms-flow/25 bg-ms-flow/[0.04]",
                row.kind === "weaken" && "border-ms-warning/22 bg-ms-warning/[0.04]",
                row.kind === "invalidate" && "border-ms-danger/22 bg-ms-danger/[0.04]",
              )}
            >
              <span className="shrink-0 font-mono tabular-nums opacity-85" aria-hidden>
                {pictureGlyph(row.kind)}
              </span>
              <span
                className={cn(
                  "min-w-0 text-pretty",
                  row.kind === "invalidate" ? "text-ms-danger/92" : "text-ms-muted",
                )}
              >
                {row.text}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
