"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { useShallow } from "zustand/react/shallow";

import { deriveAttentionPlane, type AttentionPlane, type AttentionSurfaceKey } from "@/lib/cognition/information-priority";
import { useCognitionSimulationStore } from "@/store/cognition-simulation-store";
import { cn } from "@/lib/utils";

const AttentionContext = createContext<AttentionPlane | null>(null);

export function AttentionPriorityProvider({ children }: { children: ReactNode }) {
  const { derived, latent, history, scenarioBook, topScenario } = useCognitionSimulationStore(
    useShallow((s) => ({
      derived: s.derived,
      latent: s.latent,
      history: s.history,
      scenarioBook: s.scenarioBook,
      topScenario: s.topScenario,
    })),
  );

  const leadCard =
    scenarioBook.cards.find((c) => c.id === topScenario.scenarioId) ?? scenarioBook.cards[0] ?? null;

  const plane = useMemo(
    () => deriveAttentionPlane({ derived, latent, history, leadCard }),
    [derived, latent, history, leadCard],
  );

  return <AttentionContext.Provider value={plane}>{children}</AttentionContext.Provider>;
}

export function useAttentionPlane(): AttentionPlane {
  const v = useContext(AttentionContext);
  if (!v) {
    return {
      anchor: "structure",
      riskEscalated: false,
      structureStabilizing: false,
      scenarioLeadWeakening: false,
      invalidationElevated: false,
      executionDefensive: false,
      opacity: {
        hero: 1,
        regime: 1,
        risk: 1,
        core: 1,
        right: 1,
        execution: 1,
        lower: 1,
      },
    };
  }
  return v;
}

export function AttentionSurface({
  surface,
  className,
  children,
}: {
  surface: AttentionSurfaceKey;
  className?: string;
  children: ReactNode;
}) {
  const plane = useAttentionPlane();
  const o = plane.opacity[surface];
  return (
    <div
      style={{ opacity: o }}
      className={cn("transition-[opacity] duration-500 ease-out motion-reduce:transition-none", className)}
    >
      {children}
    </div>
  );
}
