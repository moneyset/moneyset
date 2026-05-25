"use client";

import dynamic from "next/dynamic";

import { CognitionWorldFrame } from "@/components/cognition/cognition-world-frame";
import { SurfaceBlufBlock } from "@/components/cognition/surface-bluf-block";
import { WorldSurfaceChrome } from "@/components/cognition/world-surface-chrome";
import { WorkspaceSkeleton } from "@/components/ui/workspace-skeleton";
import { useSurfaceBluf } from "@/hooks/use-surface-bluf";
import { sectionChromeSubtitle, sectionPurpose, sectionTitle } from "@/lib/i18n/section-ia";
import { useUiPrefsStore } from "@/store/ui-prefs-store";

const ExecutionTacticalWorkspace = dynamic(
  () =>
    import("@/components/execution/execution-tactical-workspace").then((m) => m.ExecutionTacticalWorkspace),
  {
    ssr: false,
    loading: () => <WorkspaceSkeleton variant="theater" label="Loading execution workspace" className="mt-4" />,
  },
);

export default function ExecutionSurfacePage() {
  const locale = useUiPrefsStore((s) => s.uiLocale);
  const bluf = useSurfaceBluf("execution");

  return (
    <CognitionWorldFrame world="execution" className="ms-page ms-cognition-surface relative lg:grid lg:grid-cols-12 lg:gap-x-6">
      <div className="min-w-0 lg:col-span-12">
        <WorldSurfaceChrome
          world="execution"
          eyebrow={sectionTitle(locale, "execution")}
          title={sectionTitle(locale, "execution")}
          purpose={sectionPurpose(locale, "execution")}
          subtitle={sectionChromeSubtitle(locale, "execution")}
        />
        <SurfaceBlufBlock bluf={bluf} />
        <ExecutionTacticalWorkspace />
      </div>
    </CognitionWorldFrame>
  );
}
