"use client";

import { useShallow } from "zustand/react/shallow";

import { useDesktopCommand } from "@/hooks/use-desktop-command";
import {
  dangerBandLabel,
  phaseLabel,
  pickLocale,
} from "@/lib/i18n/cognition-dict";
import { cn } from "@/lib/utils";
import { useCognitionSimulationStore } from "@/store/cognition-simulation-store";
import { useMarketStore } from "@/store/market-store";
import { useUiPrefsStore } from "@/store/ui-prefs-store";

/** Synchronized institutional command deck — live structural awareness strip. */
export function DesktopCommandDeck() {
  const locale = useUiPrefsStore((s) => s.uiLocale);
  const orchestration = useDesktopCommand();
  const { derived, simTick } = useCognitionSimulationStore(
    useShallow((s) => ({ derived: s.derived, simTick: s.simTick })),
  );
  const market = useMarketStore(useShallow((s) => ({ connection: s.connection, price: s.price })));

  return (
    <div
      className={cn(
        "ms-desk-command-deck hidden border-b border-ms-border/40 lg:block",
        `ms-desk-command-deck--${orchestration.deckPhase}`,
      )}
      role="status"
      aria-live="polite"
      data-ms-desk-phase={orchestration.deckPhase}
      data-ms-sim-tick={simTick}
    >
      <div className="ms-desk-command-deck__glow" aria-hidden />
      <div className="relative z-[1] flex flex-wrap items-center gap-x-6 gap-y-2 px-4 py-2.5 xl:px-6">
        <div className="flex min-w-0 items-center gap-2">
          <span className="ms-desk-deck-beacon" aria-hidden />
          <p className="text-[11px] font-semibold tracking-wide text-ms-text">
            {pickLocale(locale, "Command deck", "Командная палуба")}
          </p>
        </div>
        <p className="text-[11px] tabular-nums text-ms-muted">
          {phaseLabel(locale, derived.phase)} · {dangerBandLabel(locale, derived.dangerBand)}
        </p>
        {market.price ? (
          <p className="text-[11px] tabular-nums text-ms-faint">BTC {market.price.toFixed(0)}</p>
        ) : null}
        {orchestration.focusPanel ? (
          <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-ms-cognition">
            {pickLocale(locale, "Priority", "Приоритет")}: {orchestration.focusPanel}
          </p>
        ) : null}
        <ul className="ms-desk-sync-tags ml-auto flex flex-wrap gap-1.5">
          {orchestration.crossSync.map((fx) => (
            <li key={fx} className="ms-desk-sync-tag rounded-full px-2 py-0.5 text-[9px] font-medium uppercase tracking-wider">
              {fx.replace(/-/g, " ")}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
