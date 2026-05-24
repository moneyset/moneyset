"use client";

import { useMemo } from "react";

import { InterpretationLayer } from "@/components/intelligence/interpretation-blocks";
import { ReplayCinemaTheater } from "@/components/replay/replay-cinema-theater";
import type { ReplayLayerBundle } from "@/lib/intelligence/replay-studio-view";
import { pickLocale } from "@/lib/i18n/cognition-dict";
import { cn } from "@/lib/utils";
import { useReplayCinema } from "@/hooks/use-replay-cinema";
import { useUiPrefsStore } from "@/store/ui-prefs-store";

function EvolutionTrailFixed({ trail, locale }: { trail: readonly { t: number; v: number }[]; locale: "en" | "ru" }) {
  if (trail.length === 0) {
    return <div className="h-12 rounded-ms-md border border-dashed border-ms-border/20 bg-ms-surface/6" />;
  }
  return (
    <div
      className="ms-replay-trail flex h-14 items-end gap-px rounded-ms-md border border-ms-border/15 bg-ms-surface/8 px-1 pb-1 pt-2"
      role="img"
      aria-label={pickLocale(locale, "Evolution trail", "След эволюции")}
    >
      {trail.map((p) => (
        <div
          key={p.t}
          className="ms-replay-trail-bar min-w-[2px] flex-1 rounded-t-[2px] bg-gradient-to-t from-ms-cognition/25 via-ms-flow/20 to-ms-consensus/18"
          style={{ height: `${Math.max(8, Math.round(p.v * 100))}%` }}
        />
      ))}
    </div>
  );
}

function ArchiveLayerCard({ layer, locale }: { layer: ReplayLayerBundle; locale: "en" | "ru" }) {
  return (
    <InterpretationLayer title={layer.title}>
      <p className="text-[10px] leading-snug text-ms-faint">{layer.synopsis}</p>
      <EvolutionTrailFixed trail={layer.trail} locale={locale} />
      <ul className="mt-3 max-h-[12rem] space-y-2 overflow-y-auto border-l border-ms-cognition/15 pl-3">
        {layer.moments.slice(0, 4).map((m) => (
          <li key={`${layer.title}-${m.clock}`} className="text-[10px] leading-snug">
            <p className="font-mono tabular-nums text-[9px] text-ms-faint">{m.clock}</p>
            <p className="mt-0.5 font-medium text-ms-text/92">{m.headline}</p>
          </li>
        ))}
      </ul>
    </InterpretationLayer>
  );
}

export function ReplayStudioWorkspace({ className }: { className?: string }) {
  const locale = useUiPrefsStore((s) => s.uiLocale);
  const bundle = useReplayCinema();
  const { layers } = bundle;

  const archive = useMemo(
    () => (
      <div className="mt-8 hidden border-t border-ms-border/15 pt-8 lg:block">
        <p className="mb-4 text-[10px] font-medium text-ms-faint">
          {pickLocale(locale, "Deep layer archive — six cognition lenses", "Архив глубоких слоёв — шесть линз прочтения")}
        </p>
        <div className="grid gap-5 lg:grid-cols-2">
          <div className="space-y-5">
            <ArchiveLayerCard layer={layers.structural} locale={locale} />
            <ArchiveLayerCard layer={layers.execution} locale={locale} />
            <ArchiveLayerCard layer={layers.scenario} locale={locale} />
          </div>
          <div className="space-y-5">
            <ArchiveLayerCard layer={layers.session} locale={locale} />
            <ArchiveLayerCard layer={layers.pressure} locale={locale} />
            <ArchiveLayerCard layer={layers.conviction} locale={locale} />
          </div>
        </div>
      </div>
    ),
    [locale, layers],
  );

  return (
    <section
      id="replay-studio-workspace"
      data-ms-focus
      className={cn("scroll-mt-[calc(var(--ms-intel-bar-height)+0.5rem)]", className)}
      aria-label={pickLocale(locale, "Replay studio", "Replay Studio")}
    >
      <ReplayCinemaTheater />
      {archive}
    </section>
  );
}
