import { deriveAgentCognitionBundle } from "@/lib/agents/agent-cognition-engine";
import type { ExecutionLayerSurface } from "@/lib/execution/derive-execution-layer";
import {
  deriveExecutionTerrainBundle,
  type ExecutionTerrainBundle,
} from "@/lib/execution/execution-terrain-engine";
import { deriveMacroIntelligenceBundle } from "@/lib/intelligence/macro-intelligence-view";
import { deriveRiskRadarBundle } from "@/lib/intelligence/risk-radar-view";
import { deriveSentimentIntelligenceBundle } from "@/lib/intelligence/sentiment-intelligence-view";
import type { DerivedCognitionSnapshot } from "@/lib/simulation/engine-evolve";
import { isLateContinuationRegime } from "@/lib/simulation/engine-evolve";
import type {
  AgentHistoryPoint,
  AgentLatticeRow,
  CognitiveSnapshot,
  LatentDrivers,
} from "@/lib/simulation/cognition-types";
import type { ScenarioEngineBook, ScenarioId } from "@/lib/simulation/scenario-engine";
import { pickLocale } from "@/lib/i18n/cognition-dict";
import {
  layoutAnnotationSlots,
  layoutVerticalStack,
  resolveSpatialLayout,
} from "@/lib/layout/spatial-collision-layout";
import type { UiLocale } from "@/store/ui-prefs-store";

export type ExecutionRegimeId =
  | "stable_continuation"
  | "fragile_continuation"
  | "compression"
  | "expansion"
  | "instability"
  | "liquidity_trap_risk"
  | "sponsorship_breakdown"
  | "volatility_escalation";

export type TacticalGeometryKind =
  | "continuation_lane"
  | "pressure_corridor"
  | "invalidation_wall"
  | "fragility_pocket"
  | "sponsorship_rail"
  | "rejection_zone"
  | "sweep_pathway"
  | "absorption_region";

export type TacticalGeometry = Readonly<{
  id: string;
  kind: TacticalGeometryKind;
  label: string;
  read: string;
  x: number;
  y: number;
  w: number;
  h: number;
  emphasis: number;
  tone: "neutral" | "stress" | "support";
  migrating: boolean;
}>;

export type LiveExecutionCondition = Readonly<{
  id: string;
  label: string;
  value: number;
  trend: "rising" | "falling" | "stable";
  read: string;
}>;

export type TacticalWarning = Readonly<{
  id: string;
  line: string;
  severity: "neutral" | "elevated" | "critical";
  canvasY: number;
}>;

export type CrossSystemLink = Readonly<{
  id: string;
  system: "agents" | "liquidity" | "macro" | "risk" | "sentiment" | "cross-asset";
  line: string;
  href: string;
}>;

export type PressurePulse = Readonly<{
  id: string;
  kind: "instability" | "sponsorship" | "volatility" | "liquidity" | "continuation" | "migration";
  label: string;
  intensity: number;
}>;

export type DecisionGravity = Readonly<{
  danger: number;
  fragility: number;
  opportunity: number;
  instability: number;
  compression: number;
  expansion: number;
  dominant: "danger" | "fragility" | "opportunity" | "instability" | "compression" | "expansion";
}>;

export type ExecutionTacticalBundle = Readonly<{
  regime: Readonly<{
    id: ExecutionRegimeId;
    headline: string;
    detail: string;
  }>;
  terrain: ExecutionTerrainBundle;
  geometry: readonly TacticalGeometry[];
  liveConditions: readonly LiveExecutionCondition[];
  warnings: readonly TacticalWarning[];
  crossLinks: readonly CrossSystemLink[];
  decisionGravity: DecisionGravity;
  pressurePulses: readonly PressurePulse[];
  focusHints: readonly string[];
  posture: string;
  headline: string;
  subline: string;
  tension: ExecutionTerrainBundle["tension"];
  continuationQuality: number;
  sponsorshipIntegrity: number;
  scenarioDivergence: number;
  breathPhase: number;
  pathMigration: number;
  simTick: number;
  symbol: string;
  hasTape: boolean;
}>;

function clamp(n: number, lo = 0, hi = 100): number {
  return Math.min(hi, Math.max(lo, Math.round(n)));
}

const REGIME_CLASS: Record<ExecutionRegimeId, string> = {
  stable_continuation: "ms-exec-tactical--regime-stable",
  fragile_continuation: "ms-exec-tactical--regime-fragile",
  compression: "ms-exec-tactical--regime-compression",
  expansion: "ms-exec-tactical--regime-expansion",
  instability: "ms-exec-tactical--regime-instability",
  liquidity_trap_risk: "ms-exec-tactical--regime-trap",
  sponsorship_breakdown: "ms-exec-tactical--regime-sponsorship",
  volatility_escalation: "ms-exec-tactical--regime-vol",
};

export function executionRegimeClass(id: ExecutionRegimeId): string {
  return REGIME_CLASS[id];
}

function resolveRegime(
  locale: UiLocale,
  derived: DerivedCognitionSnapshot,
  latent: LatentDrivers,
  surface: ExecutionLayerSurface,
  terrain: ExecutionTerrainBundle,
): ExecutionTacticalBundle["regime"] {
  const liq = latent.liquidityStructuralStress;
  const vol = latent.volatilityImpulse;
  const phase = derived.phase;

  let id: ExecutionRegimeId = "stable_continuation";

  const lateContinuation = isLateContinuationRegime(latent);

  if (derived.volTone === "expanding" && vol >= 62) {
    id = "volatility_escalation";
  } else if (liq >= 68 && latent.positioningPressure >= 64 && derived.divergenceIndex >= 50 && !lateContinuation) {
    id = "liquidity_trap_risk";
  } else if (derived.dangerBand === "dangerous" || derived.dangerBand === "critical" || phase === "panic_risk") {
    id = "instability";
  } else if (lateContinuation || phase === "fragile_continuation" || phase === "overheated_momentum") {
    id = "fragile_continuation";
  } else if (terrain.sponsorshipIntegrity <= 42 || liq >= 66) {
    id = "sponsorship_breakdown";
  } else if (derived.volTone === "compressing" || phase === "liquidity_compression") {
    id = "compression";
  } else if (derived.volTone === "expanding" || phase === "volatility_expansion" || phase === "controlled_trend") {
    id = "expansion";
  } else if (terrain.continuationQuality >= 58 && derived.dangerBand === "calm") {
    id = "stable_continuation";
  } else if (terrain.continuationQuality < 48) {
    id = "fragile_continuation";
  }

  const headlines: Record<ExecutionRegimeId, [string, string]> = {
    stable_continuation: [
      "Stable continuation — sponsorship intact",
      "Стабильное продолжение — спонсорство держится",
    ],
    fragile_continuation: [
      "Late continuation — momentum overheated, breadth narrowing",
      "Позднее продолжение — импульс перегрет, ширина сужается",
    ],
    compression: [
      "Vol compressed — continuation conditional on reclaim quality",
      "Вол сжата — продолжение условно от качества откупа",
    ],
    expansion: [
      "Expansion — acceptance lanes widening",
      "Расширение — полосы принятия расширяются",
    ],
    instability: [
      "Instability — invalidation sensitivity elevated",
      "Нестабильность — чувствительность к инвалидации выше",
    ],
    liquidity_trap_risk: [
      "Liquidity trap risk — thin belts dominate",
      "Риск ловушки ликвидности — доминируют тонкие пояса",
    ],
    sponsorship_breakdown: [
      "Sponsorship breakdown — breadth decaying",
      "Распад спонсорства — ширина участия слабеет",
    ],
    volatility_escalation: [
      "Volatility escalation — structural proofs widen",
      "Эскалация волатильности — структурные доказательства расширяются",
    ],
  };

  const details: Record<ExecutionRegimeId, [string, string]> = {
    stable_continuation: [
      surface.continuationRead,
      surface.continuationRead,
    ],
    fragile_continuation: [
      "Fragility increasing beneath continuation — reactive size only.",
      "Хрупкость растёт под продолжением — только реактивный размер.",
    ],
    compression: [
      surface.primaryPath,
      surface.primaryPath,
    ],
    expansion: [
      "Expansion quality monitored — sponsorship must confirm.",
      "Качество расширения под наблюдением — спонсорство должно подтвердить.",
    ],
    instability: [
      surface.invalidationPressure[0] ?? "Structural weakening in capture band.",
      surface.invalidationPressure[0] ?? "Ослабление структуры в полосе захвата.",
    ],
    liquidity_trap_risk: [
      "Participation narrowing — avoid resting size into thin corridors.",
      "Участие сужается — не держать размер в тонких коридорах.",
    ],
    sponsorship_breakdown: [
      "Sponsorship weakening — reclaim acceptance unproven.",
      "Спонсорство слабеет — принятие откупа не доказано.",
    ],
    volatility_escalation: [
      "Vol pulses distort tactical zones — path discipline first.",
      "Импульсы волы искажают тактические зоны — сначала дисциплина пути.",
    ],
  };

  const [enH, ruH] = headlines[id];
  const [enD, ruD] = details[id];
  return {
    id,
    headline: pickLocale(locale, enH, ruH),
    detail: pickLocale(locale, enD, ruD),
  };
}

function buildGeometry(
  locale: UiLocale,
  surface: ExecutionLayerSurface,
  derived: DerivedCognitionSnapshot,
  latent: LatentDrivers,
  terrain: ExecutionTerrainBundle,
): TacticalGeometry[] {
  const migrating = derived.divergenceIndex >= 48 || Math.abs(surface.scenarioWeightDelta) >= 6;
  const lateContinuation = isLateContinuationRegime(latent);
  const push = (
    id: string,
    kind: TacticalGeometryKind,
    enLabel: string,
    ruLabel: string,
    enRead: string,
    ruRead: string,
    x: number,
    y: number,
    w: number,
    h: number,
    emphasis: number,
    tone: TacticalGeometry["tone"],
  ) => ({
    id,
    kind,
    label: pickLocale(locale, enLabel, ruLabel),
    read: pickLocale(locale, enRead, ruRead),
    x,
    y,
    w,
    h,
    emphasis: clamp(emphasis),
    tone,
    migrating,
  });

  const out: TacticalGeometry[] = [
    push(
      "cont-lane",
      "continuation_lane",
      "Continuation lane",
      "Полоса продолжения",
      lateContinuation
        ? "Continuation holds above reclaim — participation breadth no longer confirms."
        : surface.continuationRead,
      lateContinuation
        ? "Продолжение держится над откупом — ширина участия больше не подтверждает."
        : surface.continuationRead,
      64,
      20,
      32,
      14,
      terrain.continuationQuality,
      terrain.continuationQuality >= 55 ? "support" : "neutral",
    ),
    push(
      "pressure-corridor",
      "pressure_corridor",
      "Pressure corridor",
      "Коридор давления",
      derived.volTone === "expanding"
        ? "Expansion pressure migrating through capture."
        : "Pressure band active — migration watch.",
      derived.volTone === "expanding"
        ? "Давление расширения мигрирует через захват."
        : "Полоса давления активна — следить за миграцией.",
      62,
      48,
      28,
      32,
      clamp(latent.positioningPressure * 0.7),
      latent.positioningPressure >= 65 ? "stress" : "neutral",
    ),
    push(
      "inv-wall",
      "invalidation_wall",
      "Invalidation wall",
      "Стена инвалидации",
      surface.invalidationPressure[0] ?? "Shelf defense line — break voids continuation.",
      surface.invalidationPressure[0] ?? "Линия защиты полки — пробой аннулирует продолжение.",
      6,
      86,
      56,
      8,
      clamp(derived.dangerScore + 20),
      derived.dangerBand !== "calm" ? "stress" : "neutral",
    ),
    push(
      "frag-pocket",
      "fragility_pocket",
      "Fragility pocket",
      "Карман хрупкости",
      lateContinuation
        ? "Structural fragility beneath headline extension — invalidation tightens on failed reclaim."
        : "Hidden fracture beneath visible continuation.",
      lateContinuation
        ? "Структурная хрупкость под видимым продлением — инвалидация сжимается при срыве откупа."
        : "Скрытый разлом под видимым продолжением.",
      64,
      48,
      30,
      12,
      clamp(100 - terrain.continuationQuality),
      "stress",
    ),
    push(
      "sponsor-rail",
      "sponsorship_rail",
      "Sponsorship rail",
      "Рельс спонсорства",
      terrain.sponsorshipIntegrity >= 55
        ? "Participation sponsorship stable in band."
        : "Sponsorship fading — reactive proof required.",
      terrain.sponsorshipIntegrity >= 55
        ? "Спонсорство участия стабильно в полосе."
        : "Спонсорство слабеет — нужны реактивные доказательства.",
      64,
      34,
      32,
      6,
      terrain.sponsorshipIntegrity,
      terrain.sponsorshipIntegrity >= 50 ? "support" : "stress",
    ),
    push(
      "reject-zone",
      "rejection_zone",
      "Rejection zone",
      "Зона отторжения",
      "Upper shelf rejection — acceptance unproven.",
      "Отторжение верхней полки — принятие не доказано.",
      64,
      8,
      30,
      10,
      clamp(latent.sentimentThermal * 0.5 + derived.divergenceIndex * 0.3),
      "stress",
    ),
    push(
      "sweep-path",
      "sweep_pathway",
      "Sweep pathway",
      "Путь сноса",
      lateContinuation || latent.liquidityStructuralStress >= 60
        ? "Liquidity sweep zone active — passive depth thin below reclaim shelf."
        : "Sweep path dormant — depth holding.",
      lateContinuation || latent.liquidityStructuralStress >= 60
        ? "Зона сноса активна — пассив тонок ниже полки откупа."
        : "Путь сноса спит — глубина держится.",
      8,
      74,
      54,
      12,
      clamp(latent.liquidityStructuralStress * 0.85),
      latent.liquidityStructuralStress >= 58 ? "stress" : "neutral",
    ),
    push(
      "absorb-region",
      "absorption_region",
      "Absorption region",
      "Зона поглощения",
      surface.microCognition.liquidityStress < 55
        ? "Passive absorption improving continuation survival."
        : "Absorption stressed — participation reactive only.",
      surface.microCognition.liquidityStress < 55
        ? "Пассивное поглощение улучшает выживание продолжения."
        : "Поглощение под стрессом — участие только реактивное.",
      64,
      58,
      30,
      14,
      clamp(100 - surface.microCognition.liquidityStress),
      surface.microCognition.liquidityStress < 55 ? "support" : "neutral",
    ),
  ];

  return out;
}

function trendFromDelta(delta: number): LiveExecutionCondition["trend"] {
  if (delta >= 3) return "rising";
  if (delta <= -3) return "falling";
  return "stable";
}

function buildLiveConditions(
  locale: UiLocale,
  terrain: ExecutionTerrainBundle,
  derived: DerivedCognitionSnapshot,
  latent: LatentDrivers,
  history: readonly CognitiveSnapshot[],
): LiveExecutionCondition[] {
  const prev = history.length >= 2 ? history[history.length - 2]! : null;
  const latest = history.length >= 1 ? history[history.length - 1]! : null;
  const divDelta = prev && latest ? latest.divergenceIndex - prev.divergenceIndex : 0;
  const liqDelta = prev && latest ? latest.liquidityStructuralStress - prev.liquidityStructuralStress : 0;
  const probDelta = prev && latest ? latest.leadScenarioProb - prev.leadScenarioProb : 0;

  const push = (
    id: string,
    enLabel: string,
    ruLabel: string,
    value: number,
    trend: LiveExecutionCondition["trend"],
    enRead: string,
    ruRead: string,
  ): LiveExecutionCondition => ({
    id,
    label: pickLocale(locale, enLabel, ruLabel),
    value: clamp(value),
    trend,
    read: pickLocale(locale, enRead, ruRead),
  });

  return [
    push(
      "continuation",
      "Continuation strength",
      "Сила продолжения",
      terrain.continuationQuality,
      trendFromDelta(probDelta * 2),
      terrain.continuationQuality >= 55 ? "Capture band holding sponsorship." : "Continuation quality deteriorating.",
      terrain.continuationQuality >= 55 ? "Полоса захвата держит спонсорство." : "Качество продолжения ухудшается.",
    ),
    push(
      "participation",
      "Participation quality",
      "Качество участия",
      clamp(100 - derived.divergenceIndex * 0.5),
      trendFromDelta(-divDelta),
      divDelta >= 5 ? "Participation narrowing." : "Breadth stable in recent window.",
      divDelta >= 5 ? "Участие сужается." : "Ширина стабильна в недавнем окне.",
    ),
    push(
      "sponsorship",
      "Sponsorship integrity",
      "Целостность спонсорства",
      terrain.sponsorshipIntegrity,
      trendFromDelta(-liqDelta),
      liqDelta >= 4 ? "Sponsorship deteriorating." : "Sponsorship stable — monitor migration.",
      liqDelta >= 4 ? "Спонсорство ухудшается." : "Спонсорство стабильно — следить за миграцией.",
    ),
    push(
      "pressure-mig",
      "Pressure migration",
      "Миграция давления",
      terrain.pathMigration,
      trendFromDelta(probDelta),
      derived.volTone === "expanding" ? "Pressure migrating through expansion lane." : "Pressure band neutral.",
      derived.volTone === "expanding" ? "Давление мигрирует через полосу расширения." : "Полоса давления нейтральна.",
    ),
    push(
      "vol-instab",
      "Volatility instability",
      "Нестабильность волатильности",
      clamp(latent.volatilityImpulse * 0.75),
      derived.volTone === "expanding" ? "rising" : derived.volTone === "compressing" ? "falling" : "stable",
      derived.volTone === "expanding" ? "Vol pulses active — proofs widen." : "Vol band contained.",
      derived.volTone === "expanding" ? "Импульсы волы активны — доказательства шире." : "Вол удержана.",
    ),
    push(
      "struct-weak",
      "Structural weakening",
      "Структурное ослабление",
      clamp(derived.dangerScore),
      derived.dangerBand !== "calm" ? "rising" : "stable",
      derived.dangerBand !== "calm" ? "Invalidation sensitivity elevated." : "Structure stable in capture.",
      derived.dangerBand !== "calm" ? "Чувствительность к инвалидации выше." : "Структура стабильна в захвате.",
    ),
    push(
      "reclaim",
      "Reclaim acceptance",
      "Принятие откупа",
      clamp(100 - latent.positioningPressure * 0.4 - latent.liquidityStructuralStress * 0.2),
      trendFromDelta(liqDelta),
      latent.positioningPressure >= 66 ? "Reclaim unproven — reactive only." : "Reclaim acceptance holding.",
      latent.positioningPressure >= 66 ? "Откуп не доказан — только реактивно." : "Принятие откупа держится.",
    ),
  ];
}

function buildInstitutionalWarnings(
  locale: UiLocale,
  terrain: ExecutionTerrainBundle,
  derived: DerivedCognitionSnapshot,
  latent: LatentDrivers,
  surface: ExecutionLayerSurface,
): Omit<TacticalWarning, "canvasY">[] {
  const out: Omit<TacticalWarning, "canvasY">[] = [];
  const push = (id: string, en: string, ru: string, severity: TacticalWarning["severity"]) =>
    out.push({ id, line: pickLocale(locale, en, ru), severity });

  if (derived.divergenceIndex >= 50) {
    push("part-narrow", "Participation narrowing.", "Участие сужается.", "elevated");
  }
  if (latent.liquidityStructuralStress >= 62 && terrain.continuationQuality >= 50) {
    push(
      "frag-beneath",
      "Fragility increasing beneath continuation.",
      "Хрупкость растёт под продолжением.",
      "elevated",
    );
  }
  if (latent.macroLiquidityBackdrop >= 65 && derived.divergenceIndex >= 48) {
    push(
      "macro-instab",
      "Macro-sensitive instability emerging.",
      "Проявляется макро-чувствительная нестабильность.",
      "elevated",
    );
  }
  if (terrain.sponsorshipIntegrity <= 48) {
    push("sponsor-weak", "Sponsorship weakening.", "Спонсорство слабеет.", "elevated");
  }
  if (derived.volTone === "expanding" && terrain.continuationQuality < 52) {
    push(
      "exp-quality",
      "Expansion quality deteriorating.",
      "Качество расширения ухудшается.",
      "neutral",
    );
  }

  for (const a of terrain.annotations) {
    if (out.length >= 8) break;
    if (!out.some((w) => w.line === a.line)) {
      out.push({ id: `terrain-${a.id}`, line: a.line, severity: a.severity });
    }
  }

  for (const line of surface.structuralRationale.slice(0, 1)) {
    if (out.length >= 8) break;
    push(`rat-${out.length}`, line, line, "neutral");
  }

  return out.slice(0, 8);
}

function buildCrossLinks(
  locale: UiLocale,
  derived: DerivedCognitionSnapshot,
  latent: LatentDrivers,
  agentLattice: readonly AgentLatticeRow[],
  agentHistory: readonly AgentHistoryPoint[],
  history: readonly CognitiveSnapshot[],
  scenarioCards: ScenarioEngineBook["cards"],
  simTick: number,
): CrossSystemLink[] {
  const out: CrossSystemLink[] = [];
  const push = (id: string, system: CrossSystemLink["system"], en: string, ru: string, href: string) =>
    out.push({
      id,
      system,
      line: pickLocale(locale, en, ru),
      href,
    });

  const agents = deriveAgentCognitionBundle({
    locale,
    latent,
    derived,
    agentLattice,
    agentHistory,
    history,
    scenarioCards,
    simTick,
  });

  if (agents.conflicts.length > 0) {
    push(
      "agent-frag",
      "agents",
      "Agent disagreement increases execution fragility.",
      "Расхождение агентов повышает хрупкость исполнения.",
      "/agents",
    );
  }
  const structAgent = agents.personas.find((p) => p.id === "structure");
  const riskAgent = agents.personas.find((p) => p.id === "risk");
  if (structAgent && riskAgent && Math.abs(structAgent.conviction - riskAgent.conviction) >= 20) {
    push(
      "agent-struct-risk",
      "agents",
      "Structure–risk fracture in war room distorts tactical zones.",
      "Разлом структура–риск в зале агентов искажает тактические зоны.",
      "/agents",
    );
  }

  if (latent.liquidityStructuralStress >= 58) {
    push(
      "liq-stress",
      "liquidity",
      "Liquidity lab: stress distorts participation geometry.",
      "Лаб. ликвидности: стресс искажает геометрию участия.",
      "/labs/liquidity",
    );
  }

  const macro = deriveMacroIntelligenceBundle(locale, latent, derived, simTick);
  if (latent.macroLiquidityBackdrop >= 62) {
    push(
      "macro-esc",
      "macro",
      `Macro escalation weakens continuation confidence — ${macro.regime.headline}.`,
      `Макро-эскалация ослабляет уверенность в продолжении — ${macro.regime.headline}.`,
      "/macro",
    );
  }

  const risk = deriveRiskRadarBundle(locale, latent, derived, history);
  const riskHead = risk.conditions[0]?.headline;
  if (riskHead) {
    push("risk-radar", "risk", `Risk radar: ${riskHead}`, `Радар риска: ${riskHead}`, "/risk-radar");
  }

  const sentiment = deriveSentimentIntelligenceBundle(locale, latent, derived);
  if (sentiment.narrativeTension.tensionPct >= 58) {
    push(
      "sentiment",
      "sentiment",
      `Sentiment: ${sentiment.narrativeTension.headline}`,
      `Сентимент: ${sentiment.narrativeTension.headline}`,
      "/sentiment",
    );
  }

  push(
    "cross-asset",
    "cross-asset",
    "Cross-asset coherence feeds execution asymmetry.",
    "Связность кросс-активов питает асимметрию исполнения.",
    "/cross-asset",
  );

  return out.slice(0, 6);
}

function buildDecisionGravity(
  derived: DerivedCognitionSnapshot,
  latent: LatentDrivers,
  terrain: ExecutionTerrainBundle,
  surface: ExecutionLayerSurface,
): DecisionGravity {
  const danger = clamp(derived.dangerScore + (derived.dangerBand === "critical" ? 18 : 0));
  const fragility = clamp(100 - terrain.continuationQuality + latent.liquidityStructuralStress * 0.2);
  const opportunity = clamp(
    terrain.continuationQuality * 0.5 + terrain.sponsorshipIntegrity * 0.35 - derived.divergenceIndex * 0.2,
  );
  const instability = clamp(derived.divergenceIndex * 0.6 + latent.volatilityImpulse * 0.35);
  const compression = derived.volTone === "compressing" ? clamp(55 + latent.positioningPressure * 0.3) : clamp(25);
  const expansion = derived.volTone === "expanding" ? clamp(50 + latent.volatilityImpulse * 0.4) : clamp(20);

  const pairs: [DecisionGravity["dominant"], number][] = [
    ["danger", danger],
    ["fragility", fragility],
    ["opportunity", opportunity],
    ["instability", instability],
    ["compression", compression],
    ["expansion", expansion],
  ];
  pairs.sort((a, b) => b[1] - a[1]);
  const dominant = pairs[0]![0];

  if (surface.invalidationPressure.length > 0 && danger < fragility) {
    return {
      danger: clamp(danger + 4),
      fragility,
      opportunity,
      instability,
      compression,
      expansion,
      dominant,
    };
  }
  return { danger, fragility, opportunity, instability, compression, expansion, dominant };
}

function buildPressurePulses(
  locale: UiLocale,
  derived: DerivedCognitionSnapshot,
  latent: LatentDrivers,
  terrain: ExecutionTerrainBundle,
): PressurePulse[] {
  const push = (
    id: string,
    kind: PressurePulse["kind"],
    en: string,
    ru: string,
    intensity: number,
  ): PressurePulse => ({
    id,
    kind,
    label: pickLocale(locale, en, ru),
    intensity: clamp(intensity),
  });

  return [
    push("instab-breath", "instability", "Instability breathing", "Дыхание нестабильности", derived.divergenceIndex),
    push(
      "sponsor-fade",
      "sponsorship",
      "Sponsorship fading",
      "Угасание спонсорства",
      100 - terrain.sponsorshipIntegrity,
    ),
    push("vol-pulse", "volatility", "Volatility pulse", "Импульс волатильности", latent.volatilityImpulse),
    push(
      "liq-distort",
      "liquidity",
      "Liquidity distortion",
      "Искажение ликвидности",
      latent.liquidityStructuralStress,
    ),
    push(
      "cont-accel",
      "continuation",
      "Continuation acceleration",
      "Ускорение продолжения",
      terrain.continuationQuality,
    ),
    push("press-mig", "migration", "Pressure migration", "Миграция давления", terrain.pathMigration),
  ];
}

const EXEC_BAND_COLUMN_X = 8;
const EXEC_BAND_COLUMN_W = 58;

function layoutExecutionTacticalCanvas(
  terrain: ExecutionTerrainBundle,
  geometry: readonly TacticalGeometry[],
): { terrain: ExecutionTerrainBundle; geometry: TacticalGeometry[] } {
  const bands = layoutVerticalStack(terrain.bands, { gap: 2, minH: 9, startY: 3, maxBottom: 84 });
  const rects = [
    ...bands.map((b) => ({
      id: `band-${b.id}`,
      x: EXEC_BAND_COLUMN_X,
      y: b.y,
      w: EXEC_BAND_COLUMN_W,
      h: b.h,
      priority: 26,
    })),
    ...geometry.map((g) => ({
      id: g.id,
      x: g.x,
      y: g.y,
      w: g.w,
      h: g.h,
      priority: 12,
    })),
  ];
  const resolved = resolveSpatialLayout(rects, { gap: 2.5 });
  const byId = new Map(resolved.map((r) => [r.id, r] as const));

  return {
    terrain: {
      ...terrain,
      bands: bands.map((b) => {
        const r = byId.get(`band-${b.id}`);
        return r ? { ...b, y: r.y, h: r.h } : b;
      }),
    },
    geometry: geometry.map((g) => {
      const r = byId.get(g.id);
      return r ? { ...g, x: r.x, y: r.y, w: r.w, h: r.h } : g;
    }),
  };
}

export function deriveExecutionTacticalBundle(args: {
  locale: UiLocale;
  surface: ExecutionLayerSurface;
  derived: DerivedCognitionSnapshot;
  latent: LatentDrivers;
  history: readonly CognitiveSnapshot[];
  scenarioBook: ScenarioEngineBook;
  leadScenarioId: ScenarioId | null;
  simTick: number;
  agentLattice: readonly AgentLatticeRow[];
  agentHistory: readonly AgentHistoryPoint[];
}): ExecutionTacticalBundle {
  const {
    locale,
    surface,
    derived,
    latent,
    history,
    scenarioBook,
    leadScenarioId,
    simTick,
    agentLattice,
    agentHistory,
  } = args;

  const terrain = deriveExecutionTerrainBundle({
    locale,
    surface,
    derived,
    latent,
    history,
    scenarioBook,
    leadScenarioId,
    simTick,
  });

  const regime = resolveRegime(locale, derived, latent, surface, terrain);
  const { terrain: laidTerrain, geometry } = layoutExecutionTacticalCanvas(
    terrain,
    buildGeometry(locale, surface, derived, latent, terrain),
  );
  const liveConditions = buildLiveConditions(locale, laidTerrain, derived, latent, history);
  const rawWarnings = buildInstitutionalWarnings(locale, laidTerrain, derived, latent, surface);
  const warningTops = layoutAnnotationSlots(rawWarnings.length, { startY: 6, slotH: 10, gap: 1.6, maxY: 90 });
  const warnings = rawWarnings.map((w, i) => ({ ...w, canvasY: warningTops[i] ?? 6 }));
  const crossLinks = buildCrossLinks(
    locale,
    derived,
    latent,
    agentLattice,
    agentHistory,
    history,
    scenarioBook.cards,
    simTick,
  );
  const decisionGravity = buildDecisionGravity(derived, latent, terrain, surface);
  const pressurePulses = buildPressurePulses(locale, derived, latent, terrain);

  const focusHints = [
    pickLocale(locale, "Critical structure only — noise suppressed.", "Только критическая структура — шум подавлен."),
    surface.primaryPath,
    regime.detail,
  ].filter(Boolean);

  return {
    regime,
    terrain: laidTerrain,
    geometry,
    liveConditions,
    warnings,
    crossLinks,
    decisionGravity,
    pressurePulses,
    focusHints,
    posture: terrain.posture,
    headline: terrain.headline,
    subline: terrain.subline,
    tension: terrain.tension,
    continuationQuality: terrain.continuationQuality,
    sponsorshipIntegrity: terrain.sponsorshipIntegrity,
    scenarioDivergence: terrain.scenarioDivergence,
    breathPhase: terrain.breathPhase,
    pathMigration: terrain.pathMigration,
    simTick,
    symbol: terrain.symbol,
    hasTape: terrain.hasTape,
  };
}
