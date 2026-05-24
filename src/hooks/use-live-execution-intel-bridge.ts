"use client";

import { useEffect, useMemo, useRef } from "react";
import { useShallow } from "zustand/react/shallow";

import { deriveLiveExecutionIntel } from "@/lib/live/derive-live-execution-intel";
import { LIVE_INTEL_BUFFER_COALESCE_MS } from "@/lib/live/live-pipeline";
import { useCognitionSimulationStore } from "@/store/cognition-simulation-store";
import { useExecutionEvolutionStore } from "@/store/execution-evolution-store";
import { useLiveExecutionIntelStore } from "@/store/live-execution-intel-store";
import { useMarketStore } from "@/store/market-store";
import { useUiPrefsStore } from "@/store/ui-prefs-store";

/**
 * Single dashboard mount: derives live execution intelligence, publishes to `live-execution-intel-store`,
 * and appends the evolution buffer (coalesced). Downstream UI reads the store — do not mount twice.
 */
export function useLiveExecutionIntelBridge(enabled = true): void {
  const locale = useUiPrefsStore((s) => s.uiLocale);
  const market = useMarketStore(
    useShallow((s) => ({
      price: s.price,
      markPrice: s.markPrice,
      realizedVol: s.realizedVol,
      momentum: s.momentum,
      fundingRate: s.fundingRate,
      openInterest: s.openInterest,
      connection: s.connection,
      ts: s.ts,
    })),
  );
  // Do not wrap nested objects in useShallow — each getSnapshot would build fresh inner objects and
  // React's useSyncExternalStore would see an unstable snapshot ("cache getSnapshot" / infinite loop).
  const derived = useCognitionSimulationStore((s) => s.derived);
  const latent = useCognitionSimulationStore((s) => s.latent);

  const intel = useMemo(() => deriveLiveExecutionIntel({ locale, market, derived, latent }), [locale, market, derived, latent]);

  const intelRef = useRef(intel);
  intelRef.current = intel;

  const lastSig = useRef<string | null>(null);
  const lastPushMs = useRef(0);

  useEffect(() => {
    if (!enabled) return;
    const cur = intelRef.current;
    useLiveExecutionIntelStore.getState().setIntel(cur);

    const now = Date.now();
    const changed = cur.signature !== lastSig.current;
    if (!changed && now - lastPushMs.current < LIVE_INTEL_BUFFER_COALESCE_MS) return;

    lastSig.current = cur.signature;
    lastPushMs.current = now;
    useExecutionEvolutionStore.getState().pushDistinct({
      ts: Date.now(),
      signature: cur.signature,
      emphasisId: cur.emphasisId,
      emphasisLine: cur.emphasisLine,
      behaviorLine: cur.behaviorLine,
    });
  }, [enabled, intel.signature]);
}
