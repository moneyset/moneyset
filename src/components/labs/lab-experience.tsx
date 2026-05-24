"use client";

import dynamic from "next/dynamic";

import { WorkspaceSkeleton } from "@/components/ui/workspace-skeleton";
import type { LabSlug } from "@/lib/labs/labs-modules";

const ChartLabExperience = dynamic(
  () => import("@/components/labs/experiences/chart-lab-experience").then((m) => m.ChartLabExperience),
  { loading: () => <LabExperienceSkeleton /> },
);
const LiquidityLabExperience = dynamic(
  () => import("@/components/labs/experiences/liquidity-lab-experience").then((m) => m.LiquidityLabExperience),
  { loading: () => <LabExperienceSkeleton /> },
);
const MacroLabExperience = dynamic(
  () => import("@/components/labs/experiences/macro-lab-experience").then((m) => m.MacroLabExperience),
  { loading: () => <LabExperienceSkeleton /> },
);
const SentimentLabExperience = dynamic(
  () => import("@/components/labs/experiences/sentiment-lab-experience").then((m) => m.SentimentLabExperience),
  { loading: () => <LabExperienceSkeleton /> },
);
const ReplayLabExperience = dynamic(
  () => import("@/components/labs/experiences/replay-lab-experience").then((m) => m.ReplayLabExperience),
  { loading: () => <LabExperienceSkeleton /> },
);
const MemoryLabExperience = dynamic(
  () => import("@/components/labs/experiences/memory-lab-experience").then((m) => m.MemoryLabExperience),
  { loading: () => <LabExperienceSkeleton /> },
);
const CrossAssetLabExperience = dynamic(
  () => import("@/components/labs/experiences/cross-asset-lab-experience").then((m) => m.CrossAssetLabExperience),
  { loading: () => <LabExperienceSkeleton /> },
);
const RiskRadarLabExperience = dynamic(
  () => import("@/components/labs/experiences/risk-radar-lab-experience").then((m) => m.RiskRadarLabExperience),
  { loading: () => <LabExperienceSkeleton /> },
);

function LabExperienceSkeleton() {
  return <WorkspaceSkeleton variant="theater" label="Loading lab module" className="rounded-ms-2xl" />;
}

export function LabExperience({ slug }: { slug: LabSlug }) {
  switch (slug) {
    case "chart":
      return <ChartLabExperience />;
    case "liquidity":
      return <LiquidityLabExperience />;
    case "macro":
      return <MacroLabExperience />;
    case "sentiment":
      return <SentimentLabExperience />;
    case "replay":
      return <ReplayLabExperience />;
    case "strategy-memory":
      return <MemoryLabExperience />;
    case "cross-asset":
      return <CrossAssetLabExperience />;
    case "risk-radar":
      return <RiskRadarLabExperience />;
    default:
      return null;
  }
}
