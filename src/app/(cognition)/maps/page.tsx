"use client";

import dynamic from "next/dynamic";

import { SurfaceBlufBlock } from "@/components/cognition/surface-bluf-block";
import { SurfaceChrome } from "@/components/surfaces/surface-chrome";
import { WorkspaceSkeleton } from "@/components/ui/workspace-skeleton";
import { useSurfaceBluf } from "@/hooks/use-surface-bluf";
import { sectionChromeSubtitle, sectionPurpose, sectionTitle } from "@/lib/i18n/section-ia";
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
