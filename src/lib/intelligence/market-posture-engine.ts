/**
 * Market Posture Engine — conclusion-first desk read from simulation + agents + execution structure.
 * POSTURE → IMPLICATION → EVIDENCE (agents support confidence/risk; no retail signal vocabulary).
 */

import type { ExecutionLayerSurface, ExecutionStructuralZone } from "@/lib/execution/derive-execution-layer";
import { formatPriceRange } from "@/lib/execution/derive-execution-layer";
import { pickLocale } from "@/lib/i18n/cognition-dict";
import type { AgentOutput, OrchestratorOutput } from "@/lib/openrouter/prompts";
import type { DerivedCognitionSnapshot } from "@/lib/simulation/engine-evolve";
import type {
  AgentLatticeRow,
  CognitiveSnapshot,
  DangerBandId,
  LatentDrivers,
  MarketPhaseId,
} from "@/lib/simulation/cognition-types";
import type { ScenarioEngineCard } from "@/lib/simulation/scenario-engine";
import type { UiLocale } from "@/store/ui-prefs-store";
import { deriveExecutionImplication } from "@/lib/intelligence/pipeline/execution-implication";

export type MarketPostureId =
  | "defensive"
  | "constructive"
  | "aggressive"
  | "reactive"
  | "neutral"
  | "fragile_continuation"
  | "expansion"
  | "compression";

export type PostureConfidence = "low" | "moderate" | "high";

export type ExecutionBiasId =
  | "patience_favored"
  | "reactive_participation"
  | "controlled_aggression"
  | "risk_reduction"
  | "acceptance_required";

export type PostureRiskLevel = "low" | "medium" | "elevated" | "high";

export type PostureChangeId =
  | "risk_increasing"
  | "risk_easing"
  | "posture_defensive_shift"
  | "posture_constructive_shift"
  | "continuation_weakening"
  | "continuation_strengthening"
  | "stable";

export type MarketPostureSnapshot = Readonly<{
  posture: MarketPostureId;
  confidence: PostureConfidence;
  executionBias: ExecutionBiasId;
  riskLevel: PostureRiskLevel;
  primaryAcceptanceZone: string;
  primaryRiskZone: string;
  why: readonly [string, string, string];
  executionImplication: string;
  invalidationRead: string;
  history: Readonly<{
    priorPosture: MarketPostureId | null;
    change: PostureChangeId;
  }>;
}>;

const PRIOR_TICK_OFFSET = 24;

function postureFromPhase(phase: MarketPhaseId, derived: DerivedCognitionSnapshot, latent: LatentDrivers): MarketPostureId {
  if (derived.dangerBand === "critical" || derived.dangerBand === "dangerous") return "defensive";
  if (phase === "fragile_continuation") return "fragile_continuation";
  if (phase === "liquidity_compression" || derived.volTone === "compressing") return "compression";
  if (phase === "stable_expansion" || phase === "controlled_trend") {
    return latent.positioningPressure >= 68 && derived.dangerBand === "calm" ? "expansion" : "constructive";
  }
  if (phase === "overheated_momentum") return "aggressive";
  if (phase === "volatility_expansion" || phase === "regime_transition") return "reactive";
  if (phase === "distribution_phase" || phase === "panic_risk") return "defensive";
  return "neutral";
}

function confidenceFromSignals(args: {
  derived: DerivedCognitionSnapshot;
  agentLattice: readonly AgentLatticeRow[];
  orchestrator: OrchestratorOutput | null;
}): PostureConfidence {
  const { derived, agentLattice, orchestrator } = args;
  const div = derived.divergenceIndex;
  const spread =
    agentLattice.length > 0
      ? Math.max(...agentLattice.map((a) => a.confidencePct)) - Math.min(...agentLattice.map((a) => a.confidencePct))
      : derived.consensusSpreadPct;

  if (
    derived.dangerBand === "critical" ||
    div >= 58 ||
    derived.consensus === "divergence_increasing" ||
    derived.consensus === "risk_layer_escalating"
  ) {
    return "low";
  }

  if (
    derived.dangerBand === "calm" &&
    div <= 28 &&
    spread <= 22 &&
    (orchestrator?.consensusState === "Alignment up" || derived.consensus === "consensus_strengthening")
  ) {
    return "high";
  }

  if (derived.dangerBand === "moderate" && div <= 38) return "high";
  return "moderate";
}

function executionBiasFromSignals(args: {
  derived: DerivedCognitionSnapshot;
  latent: LatentDrivers;
  surface: ExecutionLayerSurface;
  orchestrator: OrchestratorOutput | null;
}): ExecutionBiasId {
  const { derived, latent, surface, orchestrator } = args;

  if (orchestrator?.actionBias === "tighten_risk") return "risk_reduction";
  if (orchestrator?.actionBias === "wait_for_acceptance") return "acceptance_required";

  switch (surface.executionBiasVariant) {
    case "defensive_posture":
    case "aggression_reduced":
      return "risk_reduction";
    case "reclaim_required":
      return "acceptance_required";
    case "favor_responsive_long":
    case "favor_responsive_short":
      return "reactive_participation";
    case "continuation_strengthening":
      return "controlled_aggression";
    default:
      break;
  }

  if (derived.dangerBand === "elevated" || derived.dangerBand === "dangerous") return "risk_reduction";
  if (derived.volTone === "compressing" || latent.liquidityStructuralStress >= 62) return "patience_favored";
  if (derived.phase === "controlled_trend" && latent.positioningPressure >= 60) return "controlled_aggression";
  if (derived.phase === "volatility_expansion") return "reactive_participation";
  return "patience_favored";
}

function riskLevelFromBand(band: DangerBandId): PostureRiskLevel {
  if (band === "calm") return "low";
  if (band === "moderate") return "medium";
  if (band === "elevated") return "elevated";
  return "high";
}

function pickZone(
  zones: readonly ExecutionStructuralZone[],
  kinds: ExecutionStructuralZone["kind"][],
): ExecutionStructuralZone | null {
  for (const kind of kinds) {
    const z = zones.find((x) => x.kind === kind);
    if (z) return z;
  }
  return null;
}

function zoneRead(locale: UiLocale, zone: ExecutionStructuralZone | null, fallbackEn: string, fallbackRu: string): string {
  if (!zone) return pickLocale(locale, fallbackEn, fallbackRu);
  return pickLocale(
    locale,
    `${zone.ladderTitle} · ${formatPriceRange(locale, zone.low, zone.high)}`,
    `${zone.ladderTitle} · ${formatPriceRange(locale, zone.low, zone.high)}`,
  );
}

function whyBullets(args: {
  locale: UiLocale;
  latent: LatentDrivers;
  derived: DerivedCognitionSnapshot;
  agentLattice: readonly AgentLatticeRow[];
  leadCard: ScenarioEngineCard | null;
  aiAgents?: readonly AgentOutput[];
}): readonly [string, string, string] {
  const { locale, latent, derived, agentLattice, leadCard, aiAgents } = args;
  const candidates: string[] = [];

  if (aiAgents?.length) {
    for (const a of aiAgents) {
      if (a.keyDrivers[0]) candidates.push(a.keyDrivers[0]!);
      if (a.fragilityFactors[0]) candidates.push(a.fragilityFactors[0]!);
    }
  }

  const risk = agentLattice.find((a) => a.role === "Risk");
  const flow = agentLattice.find((a) => a.role === "Flow");
  const liq = agentLattice.find((a) => a.role === "Liquidity");
  const macro = agentLattice.find((a) => a.role === "Macro");

  if (liq && latent.liquidityStructuralStress >= 55) {
    candidates.push(
      pickLocale(
        locale,
        liq.analyticLine.length > 12 ? liq.analyticLine : "Liquidity remains overhead",
        liq.analyticLine.length > 12 ? liq.analyticLine : "Ликвидность остаётся над структурой",
      ),
    );
  }
  if (flow) {
    candidates.push(
      pickLocale(
        locale,
        derived.divergenceIndex >= 48
          ? "Participation quality deteriorating"
          : flow.analyticLine.length > 12
            ? flow.analyticLine
            : "Participation quality holds on the tape",
        derived.divergenceIndex >= 48
          ? "Качество участия ухудшается"
          : flow.analyticLine.length > 12
            ? flow.analyticLine
            : "Качество участия держится на ленте",
      ),
    );
  }
  if (risk) {
    candidates.push(
      pickLocale(
        locale,
        risk.analyticLine.length > 12 ? risk.analyticLine : "Tail asymmetry elevated in the risk layer",
        risk.analyticLine.length > 12 ? risk.analyticLine : "Асимметрия хвоста повышена в слое риска",
      ),
    );
  }
  if (macro && latent.macroLiquidityBackdrop <= 48) {
    candidates.push(
      pickLocale(locale, "Macro liquidity path tightening", "Макро-ликвидностный контур сжимается"),
    );
  }
  if (latent.volatilityImpulse >= 58) {
    candidates.push(pickLocale(locale, "Volatility expansion accelerating", "Расширение волатильности ускоряется"));
  }
  if (latent.positioningPressure >= 65 && derived.volTone !== "compressing") {
    candidates.push(pickLocale(locale, "Funding pressure building in positioning", "Давление фандинга в позиционировании"));
  }
  if (leadCard?.pathConvictionLine) {
    candidates.push(leadCard.pathConvictionLine);
  }

  const uniq = [...new Set(candidates.filter((c) => c.length > 4))];
  while (uniq.length < 3) {
    uniq.push(
      pickLocale(
        locale,
        derived.consensus === "consensus_strengthening"
          ? "Agent lattice alignment improving"
          : "Structural read unchanged on this tick",
        derived.consensus === "consensus_strengthening"
          ? "Сходимость агентов улучшается"
          : "Структурное прочтение без сдвига на этом тике",
      ),
    );
  }
  return [uniq[0]!, uniq[1]!, uniq[2]!];
}

function postureFromSnapshot(snap: CognitiveSnapshot): MarketPostureId {
  const derived = {
    phase: snap.phase,
    dangerBand: snap.dangerBand,
    volTone: "neutral" as const,
    divergenceIndex: snap.divergenceIndex,
  } as DerivedCognitionSnapshot;
  const latent: LatentDrivers = {
    liquidityStructuralStress: snap.liquidityStructuralStress,
    positioningPressure: snap.positioningPressure,
    volatilityImpulse: snap.volatilityImpulse,
    sentimentThermal: 50,
    macroLiquidityBackdrop: 50,
  };
  return postureFromPhase(snap.phase, derived, latent);
}

function deriveChange(prior: MarketPostureId | null, current: MarketPostureId, priorRisk: DangerBandId, currentRisk: DangerBandId): PostureChangeId {
  const riskRank: Record<PostureRiskLevel, number> = { low: 0, medium: 1, elevated: 2, high: 3 };
  const pr = riskRank[riskLevelFromBand(priorRisk)];
  const cr = riskRank[riskLevelFromBand(currentRisk)];
  if (cr > pr) return "risk_increasing";
  if (cr < pr) return "risk_easing";

  const defensive: MarketPostureId[] = ["defensive", "compression", "reactive"];
  const constructive: MarketPostureId[] = ["constructive", "expansion", "aggressive"];
  if (prior && defensive.includes(current) && constructive.includes(prior)) return "posture_defensive_shift";
  if (prior && constructive.includes(current) && defensive.includes(prior)) return "posture_constructive_shift";
  if (prior === "fragile_continuation" && current === "defensive") return "continuation_weakening";
  if (prior === "defensive" && (current === "constructive" || current === "expansion")) return "continuation_strengthening";
  return "stable";
}

export function deriveMarketPosture(args: {
  locale: UiLocale;
  derived: DerivedCognitionSnapshot;
  latent: LatentDrivers;
  agentLattice: readonly AgentLatticeRow[];
  history: readonly CognitiveSnapshot[];
  surface: ExecutionLayerSurface;
  leadCard: ScenarioEngineCard | null;
  orchestrator: OrchestratorOutput | null;
  aiAgents?: readonly AgentOutput[];
}): MarketPostureSnapshot {
  const { locale, derived, latent, agentLattice, history, surface, leadCard, orchestrator, aiAgents } = args;

  const posture = postureFromPhase(derived.phase, derived, latent);
  const confidence = confidenceFromSignals({ derived, agentLattice, orchestrator });
  const executionBias = executionBiasFromSignals({ derived, latent, surface, orchestrator });
  const riskLevel = riskLevelFromBand(derived.dangerBand);

  const acceptance = pickZone(surface.zones, ["acceptance", "reclaim", "objective"]);
  const riskZone = pickZone(surface.zones, ["breakdown_trigger", "liquidity_lower", "liquidity_upper", "expansion_trigger"]);

  const priorSnap = history.length >= 6 ? history[Math.max(0, history.length - PRIOR_TICK_OFFSET)] ?? null : null;
  const priorPosture = priorSnap ? postureFromSnapshot(priorSnap) : null;
  const change = deriveChange(priorPosture, posture, priorSnap?.dangerBand ?? derived.dangerBand, derived.dangerBand);

  return {
    posture,
    confidence,
    executionBias,
    riskLevel,
    primaryAcceptanceZone: zoneRead(
      locale,
      acceptance,
      "Acceptance band pending tape anchor",
      "Полоса принятия — после привязки к ленте",
    ),
    primaryRiskZone: zoneRead(
      locale,
      riskZone,
      "Invalidation band loads with structural path",
      "Полоса снятия — с базовым структурным путём",
    ),
    why: whyBullets({ locale, latent, derived, agentLattice, leadCard, aiAgents }),
    executionImplication: deriveExecutionImplication({
      locale,
      derived,
      surface,
      leadCard,
      bias: executionBias,
      orchestrator,
    }),
    invalidationRead: surface.invalidation,
    history: { priorPosture, change },
  };
}

export function postureLabel(locale: UiLocale, id: MarketPostureId): string {
  const map: Record<MarketPostureId, { en: string; ru: string }> = {
    defensive: { en: "Defensive", ru: "Защитная" },
    constructive: { en: "Constructive", ru: "Конструктивная" },
    aggressive: { en: "Aggressive", ru: "Агрессивная" },
    reactive: { en: "Reactive", ru: "Реактивная" },
    neutral: { en: "Neutral", ru: "Нейтральная" },
    fragile_continuation: { en: "Fragile Continuation", ru: "Хрупкое продолжение" },
    expansion: { en: "Expansion", ru: "Расширение" },
    compression: { en: "Compression", ru: "Сжатие" },
  };
  return pickLocale(locale, map[id].en, map[id].ru);
}

export function confidenceLabel(locale: UiLocale, id: PostureConfidence): string {
  const map: Record<PostureConfidence, { en: string; ru: string }> = {
    low: { en: "Low", ru: "Низкая" },
    moderate: { en: "Moderate", ru: "Умеренная" },
    high: { en: "High", ru: "Высокая" },
  };
  return pickLocale(locale, map[id].en, map[id].ru);
}

export function executionBiasLabel(locale: UiLocale, id: ExecutionBiasId): string {
  const map: Record<ExecutionBiasId, { en: string; ru: string }> = {
    patience_favored: { en: "Patience Favored", ru: "Терпение предпочтительно" },
    reactive_participation: { en: "Reactive Participation", ru: "Реактивное участие" },
    controlled_aggression: { en: "Controlled Aggression", ru: "Контролируемая агрессия" },
    risk_reduction: { en: "Risk Reduction", ru: "Снижение риска" },
    acceptance_required: { en: "Acceptance Required", ru: "Требуется принятие" },
  };
  return pickLocale(locale, map[id].en, map[id].ru);
}

export function riskLevelLabel(locale: UiLocale, id: PostureRiskLevel): string {
  const map: Record<PostureRiskLevel, { en: string; ru: string }> = {
    low: { en: "Low", ru: "Низкий" },
    medium: { en: "Medium", ru: "Средний" },
    elevated: { en: "Elevated", ru: "Повышенный" },
    high: { en: "High", ru: "Высокий" },
  };
  return pickLocale(locale, map[id].en, map[id].ru);
}

export function postureChangeLabel(locale: UiLocale, id: PostureChangeId): string {
  const map: Record<PostureChangeId, { en: string; ru: string }> = {
    risk_increasing: { en: "Risk Increasing", ru: "Риск растёт" },
    risk_easing: { en: "Risk Easing", ru: "Риск снижается" },
    posture_defensive_shift: { en: "Posture Defensive Shift", ru: "Сдвиг в защитную позу" },
    posture_constructive_shift: { en: "Posture Constructive Shift", ru: "Сдвиг в конструктивную позу" },
    continuation_weakening: { en: "Continuation Weakening", ru: "Продолжение ослабевает" },
    continuation_strengthening: { en: "Continuation Strengthening", ru: "Продолжение усиливается" },
    stable: { en: "Stable", ru: "Стабильно" },
  };
  return pickLocale(locale, map[id].en, map[id].ru);
}
