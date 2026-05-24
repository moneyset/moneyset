"use client";

import { useMemo } from "react";
import { useShallow } from "zustand/react/shallow";

import {
  deriveExecutionInterpretation,
  deriveExecutionInterpretationPreview,
} from "@/lib/execution/derive-execution-interpretation";
import { useExecutionSurface } from "@/hooks/use-execution-surface";
import { useExtendedCognitionAccess } from "@/hooks/use-extended-cognition-access";
import { useCognitionSimulationStore } from "@/store/cognition-simulation-store";
import { useUiPrefsStore } from "@/store/ui-prefs-store";

export function useExecutionInterpretation() {
  const locale = useUiPrefsStore((s) => s.uiLocale);
  const extended = useExtendedCognitionAccess();
  const surface = useExecutionSurface();
  const { derived, latent, leadCard } = useCognitionSimulationStore(
    useShallow((s) => ({
      derived: s.derived,
      latent: s.latent,
      leadCard: s.scenarioBook.cards[0] ?? null,
    })),
  );

  const full = useMemo(
    () =>
      deriveExecutionInterpretation({
        locale,
        surface,
        derived,
        latent,
        leadScenario: leadCard,
      }),
    [locale, surface, derived, latent, leadCard],
  );

  const preview = useMemo(() => deriveExecutionInterpretationPreview(full), [full]);

  return { full, preview, extended, surface };
}
