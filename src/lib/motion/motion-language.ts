/**
 * Institutional motion language — restrained, structural, environmental.
 * Not consumer animation; not casino effects.
 */

import { MS_MOTION } from "@/lib/theme/tokens";

export const MOTION_LANGUAGE = {
  ease: MS_MOTION.ease,
  durationMs: MS_MOTION.durationMs,
  /** Breath cycle bounds (seconds) — intensity maps inversely. */
  breathSec: { calm: 9.5, strained: 6.5, critical: 4.2 },
  /** Max simultaneous cognition pulses surfaced. */
  maxPulses: 3,
  /** Event flash decay ticks (simulation). */
  eventFlashTicks: 2,
} as const;

export type MarketMotionPhase = "calm" | "building" | "strained" | "critical";

export type MarketMotionEventId =
  | "vol_expansion"
  | "vol_compression"
  | "consensus_fracture"
  | "liquidity_stress"
  | "macro_distortion"
  | "phase_transition"
  | "leverage_tension";

export type CognitionPulseId =
  | "structural_shift"
  | "fragility_accel"
  | "sentiment_deterioration"
  | "pressure_concentration"
  | "execution_warning"
  | "sponsorship_decay"
  | "consensus_tension"
  | "volatility_breath";

export type CognitionPulse = Readonly<{
  id: CognitionPulseId;
  severity: "watch" | "elevated" | "urgent";
  headlineEn: string;
  headlineRu: string;
}>;

export type WorldMotionAccent = Readonly<{
  pressureScale: number;
  tensionScale: number;
  breathScale: number;
}>;
