"use client";

import { usePathname } from "next/navigation";
import { useMemo } from "react";
import { useShallow } from "zustand/react/shallow";

import { useCognitionDrama } from "@/hooks/use-cognition-drama";
import {
  deriveDesktopCommandOrchestration,
  type DesktopCommandOrchestration,
} from "@/lib/desktop/desktop-command-orchestrator";
import { useCognitionSimulationStore } from "@/store/cognition-simulation-store";

export function useDesktopCommand(): DesktopCommandOrchestration {
  const pathname = usePathname();
  const { latent, derived } = useCognitionSimulationStore(
    useShallow((s) => ({ latent: s.latent, derived: s.derived })),
  );
  const drama = useCognitionDrama();

  return useMemo(
    () =>
      deriveDesktopCommandOrchestration({
        pathname,
        latent,
        derived,
        drama,
      }),
    [pathname, latent, derived, drama],
  );
}
