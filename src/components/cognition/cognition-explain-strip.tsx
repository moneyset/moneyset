"use client";

import { deriveConsensusWhy, deriveDangerWhy } from "@/lib/cognition/strategic-read";
import { cn } from "@/lib/utils";
import type { AgentLatticeRow, LatentDrivers } from "@/lib/simulation/cognition-types";
import type { DerivedCognitionSnapshot } from "@/lib/simulation/engine-evolve";
import { useUiPrefsStore } from "@/store/ui-prefs-store";
import { useT } from "@/lib/i18n/use-t";

type CognitionExplainStripProps = {
  derived: DerivedCognitionSnapshot;
  latent: LatentDrivers;
  rows: readonly AgentLatticeRow[];
  className?: string;
};

/** Latent ↔ tape reconcile (deep mode only in feed). */
export function CognitionExplainStrip({ derived, latent, rows, className }: CognitionExplainStripProps) {
  const locale = useUiPrefsStore((s) => s.uiLocale);
  const t = useT();
  const cons = deriveConsensusWhy(locale, derived, latent, rows);
  const dng = deriveDangerWhy(locale, derived, latent);

  return (
    <div className={cn("rounded-ms-lg bg-ms-elevated/10 px-3 py-2.5 sm:px-4", className)}>
      <p className="text-[10px] font-medium text-ms-faint/90">{t("explain.drivers")}</p>
      <div className="mt-2 grid grid-cols-1 gap-3 lg:grid-cols-2 lg:gap-4">
        <ul className="space-y-1 border-l border-ms-consensus/20 pl-2 text-[10px] leading-snug text-ms-muted/95">
          {cons.map((b) => (
            <li key={b}>{b}</li>
          ))}
        </ul>
        <ul className="space-y-1 border-l border-ms-danger/15 pl-2 text-[10px] leading-snug text-ms-muted/95">
          {dng.map((b) => (
            <li key={b}>{b}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
