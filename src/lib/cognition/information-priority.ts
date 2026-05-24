import type { CognitiveSnapshot, LatentDrivers } from "@/lib/simulation/cognition-types";
import type { DerivedCognitionSnapshot } from "@/lib/simulation/engine-evolve";
import type { ScenarioEngineCard } from "@/lib/simulation/scenario-engine";
import type { JournalCognitiveLayers } from "@/types/memory";

/** Single dominant attention anchor — institutional “one focal read”. */
export type AttentionAnchor =
  | "stress"
  | "liquidity"
  | "scenario"
  | "structure"
  | "session"
  | "invalidation"
  | "execution";

export type AttentionSurfaceKey = "hero" | "regime" | "risk" | "core" | "right" | "execution" | "lower";

export type AttentionPlane = Readonly<{
  anchor: AttentionAnchor;
  riskEscalated: boolean;
  structureStabilizing: boolean;
  scenarioLeadWeakening: boolean;
  invalidationElevated: boolean;
  executionDefensive: boolean;
  /** Opacity multipliers per surface — calm hierarchy, no flashing. */
  opacity: Readonly<Record<AttentionSurfaceKey, number>>;
}>;

function stressSlope(history: readonly CognitiveSnapshot[]): number {
  const tail = history.slice(-6);
  if (tail.length < 2) return 0;
  const a = tail[0]!.dangerScore;
  const b = tail[tail.length - 1]!.dangerScore;
  return (b - a) / Math.max(1, tail.length - 1);
}

function utcHour(): number {
  return new Date().getUTCHours();
}

function buildOpacity(anchor: AttentionAnchor): Record<AttentionSurfaceKey, number> {
  const base: Record<AttentionSurfaceKey, number> = {
    hero: 0.9,
    regime: 0.88,
    risk: 0.84,
    core: 0.86,
    right: 0.84,
    execution: 0.88,
    lower: 0.74,
  };

  const lift = (k: AttentionSurfaceKey, v: number) => {
    base[k] = Math.min(1, v);
  };
  const quiet = (except: AttentionSurfaceKey[], factor: number) => {
    (Object.keys(base) as AttentionSurfaceKey[]).forEach((key) => {
      if (!except.includes(key)) base[key] = Math.max(0.58, base[key] * factor);
    });
  };

  switch (anchor) {
    case "stress":
      lift("risk", 1);
      lift("hero", 0.92);
      quiet(["risk"], 0.88);
      base.lower = Math.max(0.62, base.lower * 0.92);
      break;
    case "liquidity":
      lift("risk", 1);
      lift("regime", 0.93);
      quiet(["risk", "regime"], 0.9);
      break;
    case "scenario":
      lift("core", 1);
      lift("hero", 0.93);
      lift("lower", 0.82);
      quiet(["core"], 0.88);
      break;
    case "structure":
      lift("regime", 1);
      lift("hero", 0.94);
      quiet(["regime"], 0.87);
      break;
    case "session":
      lift("hero", 1);
      lift("regime", 0.9);
      quiet(["hero"], 0.86);
      break;
    case "invalidation":
    case "execution":
      lift("execution", 1);
      lift("risk", 0.9);
      quiet(["execution"], 0.85);
      break;
    default:
      break;
  }

  return base;
}

/**
 * Institutional attention plane — one anchor, supporting surfaces quieted with opacity only.
 */
export function deriveAttentionPlane(args: {
  derived: DerivedCognitionSnapshot;
  latent: LatentDrivers;
  history: readonly CognitiveSnapshot[];
  leadCard: ScenarioEngineCard | null;
}): AttentionPlane {
  const { derived, latent, history, leadCard } = args;
  const { dangerBand, dangerScore, volTone, divergenceIndex, phase } = derived;
  const liq = latent.liquidityStructuralStress;
  const slope = stressSlope(history);

  const riskEscalated =
    dangerBand === "dangerous" ||
    dangerBand === "critical" ||
    (dangerBand === "elevated" && dangerScore >= 64) ||
    dangerScore >= 70 ||
    slope >= 1.1;

  const structureStabilizing =
    volTone === "compressing" &&
    (dangerBand === "calm" || dangerBand === "moderate") &&
    divergenceIndex <= 38;

  const scenarioLeadWeakening =
    leadCard?.evolutionState === "weakening" || leadCard?.evolutionState === "deteriorating";

  const invalidationElevated =
    (leadCard?.invalidationPressure?.length ?? 0) >= 2 &&
    (dangerBand === "elevated" || dangerBand === "dangerous" || dangerBand === "critical" || dangerScore >= 56);

  const executionDefensive =
    invalidationElevated ||
    dangerBand === "elevated" ||
    dangerBand === "dangerous" ||
    dangerBand === "critical" ||
    (volTone === "expanding" && dangerScore >= 52);

  let anchor: AttentionAnchor = "structure";
  const h = utcHour();
  const overlap = h >= 13 && h < 16;

  if (riskEscalated) anchor = "stress";
  else if (liq >= 70) anchor = "liquidity";
  else if (invalidationElevated && dangerScore >= 54) anchor = "invalidation";
  else if (scenarioLeadWeakening) anchor = "scenario";
  else if (volTone === "expanding" && dangerScore >= 50) anchor = "structure";
  else if (overlap && divergenceIndex >= 44 && dangerScore >= 48) anchor = "session";
  else if (executionDefensive && dangerScore >= 58) anchor = "execution";
  else if (phase === "fragile_continuation" || phase === "liquidity_compression") anchor = "structure";

  const opacityRaw = { ...buildOpacity(anchor) };
  if (structureStabilizing) {
    opacityRaw.risk = Math.min(opacityRaw.risk, 0.86);
    opacityRaw.regime = Math.max(opacityRaw.regime, 0.93);
    opacityRaw.hero = Math.max(opacityRaw.hero, 0.92);
  }
  if (scenarioLeadWeakening) {
    opacityRaw.core = Math.max(opacityRaw.core, 0.96);
    opacityRaw.lower = Math.min(opacityRaw.lower, 0.72);
  }
  const opacity = opacityRaw;

  return {
    anchor,
    riskEscalated,
    structureStabilizing,
    scenarioLeadWeakening,
    invalidationElevated,
    executionDefensive,
    opacity,
  };
}

/** Meaningful transition in replay — phase/stress/consensus arrow deltas, not empty captures. */
export function journalReplayHighPriority(layers: JournalCognitiveLayers | undefined): boolean {
  if (!layers?.stateShift) return false;
  return layers.stateShift.includes("→");
}
