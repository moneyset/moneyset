"use client";

import { useEffect } from "react";

import {
  COGNITION_SIMULATION_TICK_MS,
  useCognitionSimulationStore,
} from "@/store/cognition-simulation-store";

/** Single interval for deterministic simulation advance — dashboard shell owns the tick loop. */
export function useCognitionSimulationTick(enabled = true): void {
  const advance = useCognitionSimulationStore((s) => s.advance);

  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;
    const id = window.setInterval(() => advance(), COGNITION_SIMULATION_TICK_MS);
    return () => window.clearInterval(id);
  }, [advance, enabled]);
}
