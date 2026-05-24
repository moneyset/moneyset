"use client";

import { useEffect, useRef } from "react";

import { useAiCognitionStore } from "@/store/ai-cognition-store";
import { useCognitionSimulationStore } from "@/store/cognition-simulation-store";
import { useMarketStore } from "@/store/market-store";
import { useMemoryStore } from "@/store/memory-store";
import { useShallow } from "zustand/react/shallow";

function nid(): string {
  return `snap-${Date.now()}-${Math.floor(Math.random() * 10_000)}`;
}

type ArchiveKey = Readonly<{
  phase: string;
  dangerBand: string;
  consensus: string;
  volBand: "compressing" | "neutral" | "expanding" | null;
  ts: number;
}>;

function shouldCapture(prev: ArchiveKey | null, next: ArchiveKey): boolean {
  if (!prev) return true;
  if (next.phase !== prev.phase) return true;
  if (next.dangerBand !== prev.dangerBand) return true;
  if (next.consensus !== prev.consensus) return true;
  if (next.volBand !== prev.volBand) return true;
  // periodic fallback every ~6 minutes if live
  if (next.ts && prev.ts && next.ts - prev.ts >= 6 * 60_000) return true;
  return false;
}

function volBand(v: number | null): "compressing" | "neutral" | "expanding" | null {
  if (v === null) return null;
  if (v <= 18) return "compressing";
  if (v >= 46) return "expanding";
  return "neutral";
}

/** Captures historical cognition snapshots into local memory (future Supabase-ready). */
export function useCognitionArchiver(enabled = true) {
  const addSnapshot = useMemoryStore((s) => s.addSnapshot);

  const market = useMarketStore((s) => s);
  const sim = useCognitionSimulationStore(
    useShallow((s) => ({
      derived: s.derived,
      scenarioBook: s.scenarioBook,
      operationalLog: s.operationalLog,
    })),
  );
  const orch = useAiCognitionStore((s) => s.orchestrator);

  const prevKey = useRef<ArchiveKey | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const key = {
      phase: sim.derived.phase,
      dangerBand: sim.derived.dangerBand,
      consensus: sim.derived.consensus,
      volBand: volBand(market.realizedVol),
      ts: market.ts ?? Date.now(),
    };
    if (!shouldCapture(prevKey.current, key)) return;
    prevKey.current = key;

    addSnapshot({
      id: nid(),
      ts: Date.now(),
      symbol: market.symbol,
      price: market.price,
      realizedVol: market.realizedVol,
      momentum: market.momentum,
      fundingRate: market.fundingRate,
      openInterest: market.openInterest,
      connection: market.connection,
      phase: sim.derived.phase,
      dangerBand: sim.derived.dangerBand,
      dangerScore: sim.derived.dangerScore,
      consensus: sim.derived.consensus,
      divergenceIndex: sim.derived.divergenceIndex,
      scenarios: sim.scenarioBook.cards.slice(0, 4).map((c) => ({ id: c.id, p: c.probabilityPct })),
      orchestratorLine: orch?.synthesis,
      ops: sim.operationalLog.slice(0, 6).map((e) => ({
        entryType: e.entryType,
        priority: e.priority,
        headline: e.headline,
        summary: e.summary,
        simulatedClockLabel: e.simulatedClockLabel,
        message: e.message,
      })),
    });
  }, [
    addSnapshot,
    enabled,
    market.connection,
    market.fundingRate,
    market.momentum,
    market.openInterest,
    market.price,
    market.realizedVol,
    market.symbol,
    market.ts,
    sim.derived.consensus,
    sim.derived.dangerBand,
    sim.derived.dangerScore,
    sim.derived.divergenceIndex,
    sim.derived.phase,
    sim.operationalLog,
    sim.scenarioBook.cards,
    orch?.synthesis,
  ]);
}

