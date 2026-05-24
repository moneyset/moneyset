import type { CognitionWorldId } from "@/lib/cognition/cognition-worlds";
import type { DerivedCognitionSnapshot } from "@/lib/simulation/engine-evolve";
import type {
  CognitiveSnapshot,
  ConsensusEvolutionLabel,
  DangerBandId,
  LatentDrivers,
  VolatilityTone,
} from "@/lib/simulation/cognition-types";

import {
  MOTION_LANGUAGE,
  type CognitionPulse,
  type CognitionPulseId,
  type MarketMotionEventId,
  type MarketMotionPhase,
  type WorldMotionAccent,
} from "./motion-language";

export type MarketMotionInput = Readonly<{
  simTick: number;
  derived: DerivedCognitionSnapshot;
  latent: LatentDrivers;
  history: readonly CognitiveSnapshot[];
  breathPhase: number;
  prevDangerBand: DangerBandId | null;
  prevVolTone: VolatilityTone | null;
  prevConsensus: ConsensusEvolutionLabel | null;
  prevPhase: string | null;
}>;

export type MarketMotionBundle = Readonly<{
  simTick: number;
  breathPhase: number;
  breathDurationSec: number;
  intensity: number;
  tension: number;
  calm: number;
  pressureDrift: number;
  instabilitySpread: number;
  volatilityGlow: number;
  narrativeAccel: number;
  phase: MarketMotionPhase;
  activeEvent: MarketMotionEventId | null;
  eventFlash: number;
  pulses: readonly CognitionPulse[];
  worldAccents: Record<CognitionWorldId, WorldMotionAccent>;
  cssVars: Readonly<Record<string, string>>;
}>;

const WORLD_IDS: CognitionWorldId[] = [
  "liquidity",
  "agents",
  "replay",
  "macro",
  "sentiment",
  "memory",
  "risk",
  "transmission",
  "execution",
];

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n));
}

function dangerWeight(band: DangerBandId): number {
  if (band === "calm") return 0.08;
  if (band === "moderate") return 0.22;
  if (band === "elevated") return 0.42;
  if (band === "dangerous") return 0.62;
  return 0.82;
}

function phaseFromSignals(intensity: number, tension: number): MarketMotionPhase {
  if (intensity >= 0.72 || tension >= 0.78) return "critical";
  if (intensity >= 0.48 || tension >= 0.52) return "strained";
  if (intensity >= 0.26 || tension >= 0.3) return "building";
  return "calm";
}

function detectEvent(input: MarketMotionInput): MarketMotionEventId | null {
  const { derived, latent, prevDangerBand, prevVolTone, prevConsensus, prevPhase } = input;
  if (prevVolTone && derived.volTone === "expanding" && prevVolTone !== "expanding") return "vol_expansion";
  if (prevVolTone && derived.volTone === "compressing" && prevVolTone !== "compressing") return "vol_compression";
  if (prevConsensus && derived.consensus === "divergence_increasing" && prevConsensus !== "divergence_increasing") {
    return "consensus_fracture";
  }
  if (latent.liquidityStructuralStress >= 72 && latent.positioningPressure >= 58) return "liquidity_stress";
  if (latent.macroLiquidityBackdrop >= 74 && derived.dangerScore >= 55) return "macro_distortion";
  if (prevPhase && prevPhase !== derived.phase) return "phase_transition";
  if (latent.positioningPressure >= 70 && latent.volatilityImpulse >= 62) return "leverage_tension";
  if (prevDangerBand && dangerWeight(derived.dangerBand) - dangerWeight(prevDangerBand) >= 0.2) {
    return "liquidity_stress";
  }
  return null;
}

function pushPulse(
  out: CognitionPulse[],
  id: CognitionPulseId,
  severity: CognitionPulse["severity"],
  headlineEn: string,
  headlineRu: string,
): void {
  if (out.some((p) => p.id === id)) return;
  out.push({ id, severity, headlineEn, headlineRu });
}

function derivePulses(input: MarketMotionInput): CognitionPulse[] {
  const { derived, latent, history } = input;
  const pulses: CognitionPulse[] = [];
  const last = history[history.length - 1];
  const prev = history.length >= 2 ? history[history.length - 2] : null;

  if (derived.phase === "regime_transition" || derived.phase === "fragile_continuation") {
    pushPulse(pulses, "structural_shift", "elevated", "Structure shifting", "Структура смещается");
  }

  if (latent.liquidityStructuralStress >= 65 && latent.volatilityImpulse >= 55) {
    pushPulse(pulses, "fragility_accel", "elevated", "Fragility accelerating", "Хрупкость нарастает");
  }

  if (latent.sentimentThermal >= 68 && derived.consensus !== "consensus_strengthening") {
    pushPulse(pulses, "sentiment_deterioration", "watch", "Sentiment deteriorating", "Настроение ухудшается");
  }

  if (latent.liquidityStructuralStress >= 60 || latent.positioningPressure >= 62) {
    pushPulse(pulses, "pressure_concentration", "watch", "Pressure concentrating", "Давление концентрируется");
  }

  if (derived.dangerBand === "dangerous" || derived.dangerBand === "critical") {
    pushPulse(pulses, "execution_warning", "urgent", "Execution conditions stressed", "Исполнение под стрессом");
  }

  if (prev && last && last.consensusSpreadPct - prev.consensusSpreadPct >= 4) {
    pushPulse(pulses, "sponsorship_decay", "watch", "Sponsorship weakening", "Спонсорство ослабевает");
  }

  if (derived.consensus === "divergence_increasing" || derived.divergenceIndex >= 58) {
    pushPulse(pulses, "consensus_tension", "elevated", "Consensus tension rising", "Напряжение консенсуса растёт");
  }

  if (derived.volTone === "expanding") {
    pushPulse(pulses, "volatility_breath", "watch", "Volatility breathing wider", "Волатильность расширяется");
  }

  const rank = { urgent: 0, elevated: 1, watch: 2 };
  return pulses.sort((a, b) => rank[a.severity] - rank[b.severity]).slice(0, MOTION_LANGUAGE.maxPulses);
}

function worldAccents(
  intensity: number,
  tension: number,
  latent: LatentDrivers,
): Record<CognitionWorldId, WorldMotionAccent> {
  const base = { pressureScale: 1, tensionScale: 1, breathScale: 1 };
  const out = {} as Record<CognitionWorldId, WorldMotionAccent>;
  for (const id of WORLD_IDS) {
    out[id] = { ...base };
  }
  out.liquidity = {
    pressureScale: 1 + intensity * 0.35 + latent.liquidityStructuralStress / 200,
    tensionScale: 1 + tension * 0.2,
    breathScale: 0.92,
  };
  out.agents = {
    pressureScale: 1 + tension * 0.25,
    tensionScale: 1 + tension * 0.45,
    breathScale: 1.08,
  };
  out.execution = {
    pressureScale: 1 + intensity * 0.4,
    tensionScale: 1 + latent.volatilityImpulse / 180,
    breathScale: 0.88,
  };
  out.macro = {
    pressureScale: 1 + latent.macroLiquidityBackdrop / 220,
    tensionScale: 1 + tension * 0.3,
    breathScale: 1.05,
  };
  out.risk = {
    pressureScale: 1 + latent.liquidityStructuralStress / 190,
    tensionScale: 1 + intensity * 0.35,
    breathScale: 0.85,
  };
  out.replay = {
    pressureScale: 1,
    tensionScale: 1 + tension * 0.15,
    breathScale: 1.12,
  };
  out.sentiment = {
    pressureScale: 1 + latent.sentimentThermal / 200,
    tensionScale: 1 + tension * 0.22,
    breathScale: 1,
  };
  out.memory = {
    pressureScale: 1 + intensity * 0.12,
    tensionScale: 1,
    breathScale: 1.15,
  };
  out.transmission = {
    pressureScale: 1 + intensity * 0.28,
    tensionScale: 1 + tension * 0.32,
    breathScale: 0.95,
  };
  return out;
}

export function deriveMarketMotionBundle(input: MarketMotionInput): MarketMotionBundle {
  const { derived, latent, breathPhase, simTick } = input;

  const danger = dangerWeight(derived.dangerBand);
  const stress =
    latent.liquidityStructuralStress * 0.32 +
    latent.volatilityImpulse * 0.28 +
    latent.positioningPressure * 0.18 +
    derived.divergenceIndex * 0.22;
  const intensity = clamp01(stress / 88 + danger * 0.35);
  const tension = clamp01(
    derived.divergenceIndex / 100 +
      (derived.consensus === "divergence_increasing" ? 0.22 : 0) +
      (derived.consensus === "risk_layer_escalating" ? 0.18 : 0) +
      latent.liquidityStructuralStress / 140,
  );
  const calm = clamp01(1 - intensity * 0.72 - tension * 0.38);

  const phase = phaseFromSignals(intensity, tension);
  const activeEvent = detectEvent(input);
  const eventFlash = activeEvent ? clamp01(1 - (simTick % MOTION_LANGUAGE.eventFlashTicks) / MOTION_LANGUAGE.eventFlashTicks) : 0;

  const breathDurationSec =
    phase === "critical"
      ? MOTION_LANGUAGE.breathSec.critical
      : phase === "strained"
        ? MOTION_LANGUAGE.breathSec.strained
        : MOTION_LANGUAGE.breathSec.calm;

  const pressureDrift = clamp01(latent.liquidityStructuralStress / 100);
  const instabilitySpread = clamp01((latent.volatilityImpulse + latent.liquidityStructuralStress) / 180);
  const volatilityGlow = derived.volTone === "expanding" ? clamp01(intensity + 0.15) : intensity * 0.55;
  const narrativeAccel = clamp01(latent.sentimentThermal / 100 + (derived.consensus === "macro_dominance_rising" ? 0.2 : 0));

  const accents = worldAccents(intensity, tension, latent);
  const pulses = derivePulses(input);

  const cssVars: Record<string, string> = {
    "--ms-motion-intensity": intensity.toFixed(3),
    "--ms-motion-tension": tension.toFixed(3),
    "--ms-motion-calm": calm.toFixed(3),
    "--ms-motion-breath": breathPhase.toFixed(4),
    "--ms-motion-breath-duration": `${breathDurationSec}s`,
    "--ms-motion-pressure": pressureDrift.toFixed(3),
    "--ms-motion-instability": instabilitySpread.toFixed(3),
    "--ms-motion-vol-glow": volatilityGlow.toFixed(3),
    "--ms-motion-narrative": narrativeAccel.toFixed(3),
    "--ms-motion-event-flash": eventFlash.toFixed(3),
    "--ms-motion-pulse-count": String(pulses.length),
  };

  return {
    simTick,
    breathPhase,
    breathDurationSec,
    intensity,
    tension,
    calm,
    pressureDrift,
    instabilitySpread,
    volatilityGlow,
    narrativeAccel,
    phase,
    activeEvent,
    eventFlash,
    pulses,
    worldAccents: accents,
    cssVars,
  };
}
