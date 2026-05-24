"use client";

import { useMemo } from "react";
import { useShallow } from "zustand/react/shallow";

import { deriveInstantCognitionChips } from "@/lib/cognition/visual-cognition-language";
import { cn } from "@/lib/utils";
import { useCognitionSimulationStore } from "@/store/cognition-simulation-store";
import { useUiPrefsStore } from "@/store/ui-prefs-store";

/** Instant cognition layer — compressed structural language, no paragraphs. */
export function CognitionInstantChips({ className }: { className?: string }) {
  const locale = useUiPrefsStore((s) => s.uiLocale);
  const { latent, derived } = useCognitionSimulationStore(
    useShallow((s) => ({ latent: s.latent, derived: s.derived })),
  );

  const chips = useMemo(
    () => deriveInstantCognitionChips(locale, latent, derived),
    [locale, latent, derived],
  );

  return (
    <ul className={cn("ms-cognition-instant-chips", className)} aria-label="Instant cognition">
      {chips.map((c) => (
        <li
          key={c.id}
          className={cn(
            "ms-cognition-instant-chip",
            c.tone === "stress" && "ms-cognition-instant-chip--stress",
            c.tone === "support" && "ms-cognition-instant-chip--support",
            c.tone === "critical" && "ms-cognition-instant-chip--critical",
          )}
        >
          {c.label}
        </li>
      ))}
    </ul>
  );
}
