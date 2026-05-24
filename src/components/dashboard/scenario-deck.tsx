"use client";

import { ScenariosWorkspace } from "@/components/scenarios/scenarios-workspace";

type ScenarioDeckProps = {
  className?: string;
};

/** Kept for existing imports; delegates to `ScenariosWorkspace`. */
export function ScenarioDeck({ className }: ScenarioDeckProps) {
  return <ScenariosWorkspace className={className} />;
}
