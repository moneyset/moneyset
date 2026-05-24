"use client";

import dynamic from "next/dynamic";

import { SurfaceChrome } from "@/components/surfaces/surface-chrome";
import { WorkspaceSkeleton } from "@/components/ui/workspace-skeleton";
import { pickLocale } from "@/lib/i18n/cognition-dict";
import { useUiPrefsStore } from "@/store/ui-prefs-store";

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

export default function MapsSurfacePage() {
  const locale = useUiPrefsStore((s) => s.uiLocale);

  return (
    <div className="ms-page ms-cognition-surface relative">
      <SurfaceChrome
        tone="support"
        eyebrow={pickLocale(locale, "Surface", "Поверхность")}
        title={pickLocale(locale, "Maps", "Карты")}
        subtitle={pickLocale(
          locale,
          "Structural topology intelligence — spatial execution cognition, not retail heatmaps.",
          "Интеллект структурной топологии — пространственное прочтение исполнения, не ритейл-теплокарты.",
        )}
      />
      <MapsTopologyWorkspace />

      <section className="mt-6" aria-labelledby="maps-exec-map-heading">
        <h2 id="maps-exec-map-heading" className="sr-only">
          {pickLocale(locale, "Execution mapping", "Картирование исполнения")}
        </h2>
        <ExecutionMapLayer />
      </section>

      <p className="mt-4 text-[10px] leading-snug text-ms-faint">
        {pickLocale(
          locale,
          "Topology fields update with lattice drivers; tape-anchored lanes appear when mark/last anchors zones.",
          "Поля топологии следуют за драйверами решётки; полосы по ленте — при привязке метки/последней к зонам.",
        )}
      </p>
    </div>
  );
}
