"use client";

import dynamic from "next/dynamic";

import { SurfaceBlufBlock } from "@/components/cognition/surface-bluf-block";
import { SurfaceChrome } from "@/components/surfaces/surface-chrome";
import { WorkspaceSkeleton } from "@/components/ui/workspace-skeleton";
import { useSurfaceBluf } from "@/hooks/use-surface-bluf";
import { pickLocale } from "@/lib/i18n/cognition-dict";
import { sectionChromeSubtitle, sectionPurpose, sectionTitle } from "@/lib/i18n/section-ia";
import { useUiPrefsStore, type UiLocale } from "@/store/ui-prefs-store";

const MapsTopologyWorkspace = dynamic(
  () => import("@/components/maps/maps-topology-workspace").then((m) => m.MapsTopologyWorkspace),
  {
    loading: () => <WorkspaceSkeleton variant="standard" label="Loading maps topology" />,
  },
);

const ExecutionMapLayer = dynamic(
  () => import("@/components/execution/execution-map-layer").then((m) => m.ExecutionMapLayer),
  { loading: () => <WorkspaceSkeleton variant="compact" label="Loading execution map" className="mt-4" /> },
);

function MapsReaderGuide({ locale }: { locale: UiLocale }) {
  return (
    <div className="mb-[var(--ms-block-gap)] grid gap-3 sm:grid-cols-3">
      <div className="rounded-ms-xl border border-ms-border/14 bg-ms-elevated/8 px-4 py-3.5">
        <p className="ms-data-label text-ms-faint">
          {pickLocale(locale, "What am I looking at?", "На что я смотрю?")}
        </p>
        <p className="mt-1.5 text-[12px] leading-relaxed text-ms-muted">
          {pickLocale(
            locale,
            "Layered structural geometry — where structure, liquidity, and stress concentrate in the current market field. Not price targets. Pressure zones.",
            "Многослойная структурная геометрия — где в текущем поле сходятся структура, ликвидность и стресс. Не ценовые цели. Зоны давления.",
          )}
        </p>
      </div>

      <div className="rounded-ms-xl border border-ms-border/14 bg-ms-elevated/8 px-4 py-3.5">
        <p className="ms-data-label text-ms-cognition/80">
          {pickLocale(locale, "Why does it matter?", "Почему это важно?")}
        </p>
        <p className="mt-1.5 text-[12px] leading-relaxed text-ms-muted">
          {pickLocale(
            locale,
            "The map shows invisible forces — where liquidity is thin, where stress is building, where structure is aligned or fragmented. These forces precede price movement.",
            "Карта показывает невидимые силы — где ликвидность тонкая, где нарастает стресс, где структура выровнена или фрагментирована. Эти силы предшествуют движению цены.",
          )}
        </p>
      </div>

      <div className="rounded-ms-xl border border-ms-border/14 bg-ms-elevated/8 px-4 py-3.5">
        <p className="ms-data-label text-ms-flow/80">
          {pickLocale(locale, "What should I do with this?", "Что мне делать с этим?")}
        </p>
        <p className="mt-1.5 text-[12px] leading-relaxed text-ms-muted">
          {pickLocale(
            locale,
            "Use the map to anchor your invalidation zones. Where structure clusters, that's where execution decisions get sharper. Go to Execution to apply the read.",
            "Используйте карту для привязки зон инвалидации. Там, где концентрируется структура, решения об исполнении становятся чётче. Перейдите в Execution для применения прочтения.",
          )}
        </p>
      </div>
    </div>
  );
}

export default function MapsSurfacePage() {
  const locale = useUiPrefsStore((s) => s.uiLocale);
  const bluf = useSurfaceBluf("maps");

  return (
    <div className="ms-page ms-cognition-surface relative">
      <SurfaceChrome
        tone="support"
        eyebrow={sectionTitle(locale, "maps")}
        title={sectionTitle(locale, "maps")}
        purpose={sectionPurpose(locale, "maps")}
        subtitle={sectionChromeSubtitle(locale, "maps")}
      />
      <SurfaceBlufBlock bluf={bluf} />
      <MapsReaderGuide locale={locale} />
      <MapsTopologyWorkspace />

      <section className="mt-6" aria-labelledby="maps-exec-map-heading">
        <h2 id="maps-exec-map-heading" className="sr-only">
          {sectionTitle(locale, "execution")}
        </h2>
        <ExecutionMapLayer />
      </section>
    </div>
  );
}
