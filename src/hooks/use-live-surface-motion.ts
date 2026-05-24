"use client";

import type { CSSProperties } from "react";

import type { CognitionWorldId } from "@/lib/cognition/cognition-worlds";
import { useMarketMotionContext } from "@/components/motion/market-motion-context";

/** Per-surface live motion CSS variables for theaters and workspaces. */
export function useLiveSurfaceMotion(world: CognitionWorldId): {
  className: string;
  style: CSSProperties;
  phase: string;
} {
  const motion = useMarketMotionContext();
  const accent = motion?.worldAccents[world];

  const pressure = (motion?.pressureDrift ?? 0.3) * (accent?.pressureScale ?? 1);
  const tension = (motion?.tension ?? 0.25) * (accent?.tensionScale ?? 1);
  const breath = motion?.breathPhase ?? 0;

  return {
    className: "ms-live-surface",
    phase: motion?.phase ?? "calm",
    style: {
      "--ms-live-pressure": pressure.toFixed(3),
      "--ms-live-tension": tension.toFixed(3),
      "--ms-live-breath": breath.toFixed(4),
      "--ms-live-instability": (motion?.instabilitySpread ?? 0.3).toFixed(3),
    } as CSSProperties,
  };
}
