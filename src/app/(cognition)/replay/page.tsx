"use client";

import dynamic from "next/dynamic";

import { PlatformAccessGate } from "@/components/access/platform-access-gate";
import { CognitionWorldFrame } from "@/components/cognition/cognition-world-frame";
import { WorldSurfaceChrome } from "@/components/cognition/world-surface-chrome";
import { WorkspaceSkeleton } from "@/components/ui/workspace-skeleton";
import { pickLocale } from "@/lib/i18n/cognition-dict";
import { useUiPrefsStore } from "@/store/ui-prefs-store";

const ReplayStudioWorkspace = dynamic(
  () => import("@/components/replay/replay-studio-workspace").then((m) => m.ReplayStudioWorkspace),
  {
    loading: () => <WorkspaceSkeleton variant="theater" label="Loading replay studio" />,
  },
);

export default function ReplayStudioPage() {
  const locale = useUiPrefsStore((s) => s.uiLocale);
  return (
    <CognitionWorldFrame world="replay" className="ms-page ms-cognition-surface relative">
      <WorldSurfaceChrome
        world="replay"
        eyebrow={pickLocale(locale, "Cinema", "Кинотеатр")}
        title={pickLocale(locale, "Replay Studio", "Replay Studio")}
        subtitle={pickLocale(
          locale,
          "Temporal cognition · scene gravity · institutional recall",
          "Временное прочтение · гравитация сцен · институциональное воспоминание",
        )}
      />
      <PlatformAccessGate
        capability="replayStudio"
        titleEn="Replay Studio"
        titleRu="Replay Studio"
        bodyEn="Step through past market states — see how structure, posture, and scenarios evolved over time to sharpen your pattern recognition."
        bodyRu="Пройдите через прошлые состояния рынка — как менялись структура, поза и сценарии, чтобы укрепить распознавание паттернов."
      >
        <ReplayStudioWorkspace />
      </PlatformAccessGate>
    </CognitionWorldFrame>
  );
}
