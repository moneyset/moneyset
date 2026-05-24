import { deriveAgentCognitionBundle } from "@/lib/agents/agent-cognition-engine";
import {
  deriveCrossAssetIntelligenceBundle,
  type CrossAssetIntelligenceBundle,
} from "@/lib/intelligence/cross-asset-intelligence-view";
import {
  deriveRiskRadarBundle,
  type RiskRadarBundle,
} from "@/lib/intelligence/risk-radar-view";
import type { DerivedCognitionSnapshot } from "@/lib/simulation/engine-evolve";
import { isLateContinuationRegime } from "@/lib/simulation/engine-evolve";
import type {
  AgentHistoryPoint,
  AgentLatticeRow,
  CognitiveSnapshot,
  LatentDrivers,
} from "@/lib/simulation/cognition-types";
import type { ScenarioEngineCard } from "@/lib/simulation/scenario-engine";
import { pickLocale } from "@/lib/i18n/cognition-dict";
import { layoutSpatialItems } from "@/lib/layout/spatial-collision-layout";
import type { UiLocale } from "@/store/ui-prefs-store";

export type SystemicRiskStateId =
  | "stable_participation"
  | "fragile_continuation"
  | "leverage_saturation"
  | "cross_market_divergence"
  | "volatility_compression_risk"
  | "macro_contagion"
  | "sponsorship_failure"
  | "instability_cascade";

export type TopologyCellKind =
  | "contagion_path"
  | "instability_field"
  | "sponsorship_decay"
  | "vol_stress"
  | "liquidity_fracture"
  | "fragility_pulse"
  | "transmission_hub"
  | "leverage_cluster";

export type TopologyCell = Readonly<{
  id: string;
  kind: TopologyCellKind;
  label: string;
  read: string;
  x: number;
  y: number;
  w: number;
  h: number;
  emphasis: number;
  tone: "neutral" | "stress" | "support";
  pulsing: boolean;
}>;

export type ContagionArc = Readonly<{
  id: string;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  label: string;
  intensity: number;
}>;

export type HiddenRiskSignal = Readonly<{
  id: string;
  line: string;
  severity: "neutral" | "elevated" | "critical";
}>;

export type FragilityEvolutionFrame = Readonly<{
  tick: number;
  headline: string;
  note: string;
  phase: "stable" | "buildup" | "cascade" | "ease";
}>;

export type AgentFragilityReaction = Readonly<{
  id: string;
  agentId: string;
  line: string;
  escalation: "calm" | "elevated" | "critical";
}>;

export type TransmissionRelation = Readonly<{
  id: string;
  label: string;
  read: string;
  tensionPct: number;
}>;

export type SystemicFragilityLens = "risk" | "transmission" | "unified";

export type SystemicFragilityBundle = Readonly<{
  lens: SystemicFragilityLens;
  riskState: Readonly<{ id: SystemicRiskStateId; headline: string; detail: string }>;
  primaryState: string;
  primarySubline: string;
  tension: "calm" | "elevated" | "critical";
  cells: readonly TopologyCell[];
  contagionArcs: readonly ContagionArc[];
  hiddenSignals: readonly HiddenRiskSignal[];
  evolution: readonly FragilityEvolutionFrame[];
  agentReactions: readonly AgentFragilityReaction[];
  transmissions: readonly TransmissionRelation[];
  crossLinks: readonly string[];
  instabilityPulse: number;
  contagionSpread: number;
  sponsorshipFade: number;
  breathPhase: number;
  simTick: number;
  risk: RiskRadarBundle;
  crossAsset: CrossAssetIntelligenceBundle;
}>;

function clamp(n: number, lo = 0, hi = 100): number {
  return Math.min(hi, Math.max(lo, Math.round(n)));
}

function slope(values: readonly number[]): number {
  if (values.length < 2) return 0;
  const a = values[0]!;
  const b = values[values.length - 1]!;
  return (b - a) / Math.max(1, values.length - 1);
}

export function systemicRiskStateClass(id: SystemicRiskStateId): string {
  return `ms-systemic-topology--state-${id.replace(/_/g, "-")}`;
}

function resolveRiskState(
  locale: UiLocale,
  latent: LatentDrivers,
  derived: DerivedCognitionSnapshot,
  risk: RiskRadarBundle,
): SystemicFragilityBundle["riskState"] {
  const pp = latent.positioningPressure;
  const liq = latent.liquidityStructuralStress;
  const div = derived.divergenceIndex;
  const m = latent.macroLiquidityBackdrop;

  let id: SystemicRiskStateId = "stable_participation";

  if (derived.dangerBand === "critical" || derived.dangerBand === "dangerous") {
    id = "instability_cascade";
  } else if (liq >= 66 && div >= 50) {
    id = "sponsorship_failure";
  } else if (m >= 62 && derived.consensus === "macro_dominance_rising") {
    id = "macro_contagion";
  } else if (derived.volTone === "compressing" && m >= 54) {
    id = "volatility_compression_risk";
  } else if (latent.sentimentThermal >= 58 && div >= 46) {
    id = "cross_market_divergence";
  } else if (pp >= 72) {
    id = "leverage_saturation";
  } else if (derived.dangerBand === "elevated" || risk.conditions.some((c) => c.id === "continuation_fragile")) {
    id = "fragile_continuation";
  }

  const headlines: Record<SystemicRiskStateId, [string, string]> = {
    stable_participation: ["Stable participation field", "Поле стабильного участия"],
    fragile_continuation: ["Fragile continuation environment", "Среда хрупкого продолжения"],
    leverage_saturation: ["Leverage saturation", "Насыщение плеча"],
    cross_market_divergence: ["Cross-market divergence", "Кросс-рыночный разнос"],
    volatility_compression_risk: ["Volatility compression risk", "Риск сжатия волатильности"],
    macro_contagion: ["Macro contagion channel", "Канал макро-заразы"],
    sponsorship_failure: ["Sponsorship failure topology", "Топология провала спонсорства"],
    instability_cascade: ["Instability cascade", "Каскад нестабильности"],
  };

  const topRead = risk.conditions[0]?.structuralRead ?? "";
  return {
    id,
    headline: pickLocale(locale, headlines[id][0], headlines[id][1]),
    detail: topRead,
  };
}

function buildHiddenSignals(
  locale: UiLocale,
  latent: LatentDrivers,
  derived: DerivedCognitionSnapshot,
  risk: RiskRadarBundle,
  cross: CrossAssetIntelligenceBundle,
): HiddenRiskSignal[] {
  const out: HiddenRiskSignal[] = [];
  const push = (id: string, en: string, ru: string, severity: HiddenRiskSignal["severity"]) =>
    out.push({ id, line: pickLocale(locale, en, ru), severity });

  push(
    "narrow-part",
    isLateContinuationRegime(latent)
      ? "Late continuation: headline strength with participation breadth narrowing beneath."
      : "Continuation supported by narrowing participation.",
    isLateContinuationRegime(latent)
      ? "Позднее продолжение: сила заголовков при сужении ширины участия внизу."
      : "Продолжение держится на сужающемся участии.",
    "elevated",
  );
  if (derived.divergenceIndex >= 44) {
    push(
      "cross-div",
      "Cross-market divergence increasing instability probability.",
      "Кросс-разнос повышает вероятность нестабильности.",
      "elevated",
    );
  }
  if (derived.volTone === "compressing" && latent.macroLiquidityBackdrop >= 55) {
    push(
      "vol-compress",
      "Volatility compression vulnerable to macro shock.",
      "Сжатие волатильности уязвимо к макро-шоку.",
      "elevated",
    );
  }
  if (latent.positioningPressure >= 68) {
    push(
      "leverage-conc",
      "Leverage concentration amplifying fragility.",
      "Концентрация плеча усиливает хрупкость.",
      "critical",
    );
  }
  for (const c of risk.conditions.slice(0, 2)) {
    if (out.length >= 6) break;
    if (!out.some((s) => s.line.includes(c.headline.slice(0, 12)))) {
      push(`risk-${c.id}`, c.headline, c.headline, c.tensionPct >= 75 ? "critical" : "elevated");
    }
  }
  if (cross.riskTransition.tensionPct >= 60) {
    push("risk-off", cross.riskTransition.structuralRead, cross.riskTransition.structuralRead, "elevated");
  }
  return out.slice(0, 6);
}

function buildTopologyCells(
  locale: UiLocale,
  latent: LatentDrivers,
  derived: DerivedCognitionSnapshot,
  risk: RiskRadarBundle,
  cross: CrossAssetIntelligenceBundle,
): TopologyCell[] {
  const push = (
    id: string,
    kind: TopologyCellKind,
    enL: string,
    ruL: string,
    enR: string,
    ruR: string,
    x: number,
    y: number,
    w: number,
    h: number,
    emphasis: number,
    tone: TopologyCell["tone"],
    pulsing: boolean,
  ): TopologyCell => ({
    id,
    kind,
    label: pickLocale(locale, enL, ruL),
    read: pickLocale(locale, enR, ruR),
    x,
    y,
    w,
    h,
    emphasis: clamp(emphasis),
    tone,
    pulsing,
  });

  const topRisk = risk.conditions[0];
  return [
    push(
      "instab-field",
      "instability_field",
      "Instability field",
      "Поле нестабильности",
      topRisk?.structuralRead ?? risk.fieldNote,
      topRisk?.structuralRead ?? risk.fieldNote,
      8,
      14,
      38,
      28,
      derived.dangerScore,
      derived.dangerBand !== "calm" ? "stress" : "neutral",
      derived.dangerBand !== "calm",
    ),
    push(
      "sponsor-decay",
      "sponsorship_decay",
      "Sponsorship decay map",
      "Карта распада спонсорства",
      "Breadth thinning beneath visible continuation.",
      "Ширина истончается под видимым продолжением.",
      52,
      20,
      36,
      24,
      clamp(100 - derived.consensusSpreadPct + latent.liquidityStructuralStress * 0.2),
      latent.liquidityStructuralStress >= 58 ? "stress" : "neutral",
      latent.liquidityStructuralStress >= 55,
    ),
    push(
      "vol-stress",
      "vol_stress",
      "Volatility stress field",
      "Поле стресса волатильности",
      cross.volPressureField,
      cross.volPressureField,
      44,
      52,
      32,
      26,
      clamp(latent.volatilityImpulse * 0.75),
      derived.volTone === "expanding" ? "stress" : "neutral",
      derived.volTone !== "neutral",
    ),
    push(
      "liq-fracture",
      "liquidity_fracture",
      "Liquidity fracture",
      "Разлом ликвидности",
      cross.liquidityMigration.lines[0] ?? "Migration quiet.",
      cross.liquidityMigration.lines[0] ?? "Миграция спокойна.",
      18,
      58,
      28,
      22,
      clamp(latent.liquidityStructuralStress * 0.8),
      latent.liquidityStructuralStress >= 60 ? "stress" : "neutral",
      latent.liquidityStructuralStress >= 58,
    ),
    push(
      "leverage-cluster",
      "leverage_cluster",
      "Leverage concentration",
      "Концентрация плеча",
      latent.positioningPressure >= 68
        ? "Positioning stress loading unwind paths."
        : "Leverage field contained in window.",
      latent.positioningPressure >= 68
        ? "Поле позиции нагружает пути разжима."
        : "Поле плеча сдержано в окне.",
      68,
      54,
      26,
      24,
      clamp(latent.positioningPressure * 0.65),
      latent.positioningPressure >= 65 ? "stress" : "neutral",
      latent.positioningPressure >= 62,
    ),
    push(
      "frag-pulse",
      "fragility_pulse",
      "Systemic fragility pulse",
      "Импульс системной хрупкости",
      risk.deskFootnote,
      risk.deskFootnote,
      38,
      36,
      24,
      20,
      clamp(derived.dangerScore + derived.divergenceIndex * 0.25),
      "stress",
      true,
    ),
    push(
      "trans-hub",
      "transmission_hub",
      "Transmission hub",
      "Узел передачи",
      cross.riskTransition.structuralRead,
      cross.riskTransition.structuralRead,
      48,
      38,
      20,
      18,
      cross.riskTransition.tensionPct,
      cross.riskTransition.tensionPct >= 58 ? "stress" : "neutral",
      cross.riskTransition.tensionPct >= 55,
    ),
    push(
      "macro-sens",
      "contagion_path",
      "Macro-sensitive fragility",
      "Макро-чувствительная хрупкость",
      latent.macroLiquidityBackdrop >= 58
        ? "Policy path dominates microstructure transmission."
        : "Macro channel contained.",
      latent.macroLiquidityBackdrop >= 58
        ? "Путь политики доминирует передачу микроструктуры."
        : "Макро-канал сдержан.",
      72,
      28,
      22,
      30,
      clamp(latent.macroLiquidityBackdrop * 0.55),
      latent.macroLiquidityBackdrop >= 60 ? "stress" : "neutral",
      latent.macroLiquidityBackdrop >= 58,
    ),
  ];
}

function buildContagionArcs(
  locale: UiLocale,
  cross: CrossAssetIntelligenceBundle,
): ContagionArc[] {
  const hubs: { x: number; y: number; label: string }[] = [
    { x: 14, y: 22, label: "DXY" },
    { x: 32, y: 38, label: pickLocale(locale, "Yields", "Ставки") },
    { x: 50, y: 24, label: pickLocale(locale, "Equities", "Акции") },
    { x: 68, y: 42, label: "BTC" },
    { x: 82, y: 28, label: pickLocale(locale, "Oil", "Нефть") },
    { x: 88, y: 58, label: pickLocale(locale, "Vol", "Вол") },
    { x: 24, y: 62, label: pickLocale(locale, "Bonds", "Облигации") },
  ];

  return cross.relations.slice(0, 5).map((rel, i) => {
    const from = hubs[i % hubs.length]!;
    const to = hubs[(i + 2) % hubs.length]!;
    return {
      id: rel.id,
      fromX: from.x,
      fromY: from.y,
      toX: to.x,
      toY: to.y,
      label: rel.label,
      intensity: rel.tensionPct,
    };
  });
}

function buildEvolution(
  locale: UiLocale,
  history: readonly CognitiveSnapshot[],
): FragilityEvolutionFrame[] {
  if (history.length < 3) {
    return [
      {
        tick: 0,
        headline: pickLocale(locale, "Fragility baseline", "Базовая хрупкость"),
        note: pickLocale(locale, "Awaiting history depth for temporal risk.", "Ждём глубину истории для временного риска."),
        phase: "stable",
      },
    ];
  }
  const step = Math.max(1, Math.floor(history.length / 8));
  const frames: FragilityEvolutionFrame[] = [];
  for (let i = 0; i < history.length; i += step) {
    const snap = history[i]!;
    const next = history[Math.min(history.length - 1, i + step)];
    let phase: FragilityEvolutionFrame["phase"] = "stable";
    let note = pickLocale(locale, "Fragility field stable.", "Поле хрупкости стабильно.");
    if (next && next.dangerBand !== snap.dangerBand && (next.dangerBand === "dangerous" || next.dangerBand === "critical")) {
      phase = "cascade";
      note = pickLocale(locale, "Instability escalation — contagion spreading.", "Эскалация нестабильности — распространение заразы.");
    } else if (next && next.liquidityStructuralStress > snap.liquidityStructuralStress + 5) {
      phase = "buildup";
      note = pickLocale(locale, "Sponsorship collapse — leverage buildup in window.", "Схлопывание спонсорства — набор плеча в окне.");
    } else if (next && next.positioningPressure > snap.positioningPressure + 5) {
      phase = "buildup";
      note = pickLocale(locale, "Leverage buildup — participation stress rising.", "Набор плеча — растёт стресс участия.");
    } else if (next && next.dangerScore < snap.dangerScore - 4) {
      phase = "ease";
      note = pickLocale(locale, "Stress field easing — tail validity contracting.", "Поле стресса слабеет — хвосты сужаются.");
    }
    frames.push({
      tick: snap.simTick,
      headline: pickLocale(locale, `Risk T${snap.simTick}`, `Риск T${snap.simTick}`),
      note,
      phase,
    });
  }
  return frames.slice(-8);
}

function buildAgentReactions(
  locale: UiLocale,
  latent: LatentDrivers,
  derived: DerivedCognitionSnapshot,
  agentLattice: readonly AgentLatticeRow[],
  agentHistory: readonly AgentHistoryPoint[],
  history: readonly CognitiveSnapshot[],
  scenarioCards: readonly ScenarioEngineCard[],
  simTick: number,
): AgentFragilityReaction[] {
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

  const out: AgentFragilityReaction[] = [];
  const riskAgent = agents.personas.find((p) => p.id === "risk");
  const macroAgent = agents.personas.find((p) => p.id === "macro");
  const structAgent = agents.personas.find((p) => p.id === "structure");

  if (riskAgent) {
    out.push({
      id: "agent-risk",
      agentId: riskAgent.id,
      line: pickLocale(
        locale,
        derived.dangerBand !== "calm"
          ? "Risk agent escalates instability — structural invalidation sensitivity rising."
          : "Risk agent calm — fragility contained in lattice window.",
        derived.dangerBand !== "calm"
          ? "Агент риска эскалирует нестабильность — растёт чувствительность к инвалидации."
          : "Агент риска спокоен — хрупкость сдержана в окне решётки.",
      ),
      escalation:
        riskAgent.escalation === "critical" ? "critical" : riskAgent.escalation === "elevated" ? "elevated" : "calm",
    });
  }
  if (macroAgent && latent.macroLiquidityBackdrop >= 58) {
    out.push({
      id: "agent-macro",
      agentId: macroAgent.id,
      line: pickLocale(
        locale,
        "Macro agent increases contagion probability — policy path dominates.",
        "Агент макро повышает вероятность заразы — доминирует путь политики.",
      ),
      escalation: macroAgent.escalation === "critical" ? "critical" : "elevated",
    });
  }
  if (structAgent && derived.divergenceIndex >= 48) {
    out.push({
      id: "agent-struct",
      agentId: structAgent.id,
      line: pickLocale(
        locale,
        "Structure agent losing continuation confidence — sponsorship coherence fracturing.",
        "Агент структуры теряет уверенность в продолжении — связность спонсорства ломается.",
      ),
      escalation: structAgent.stress >= 65 ? "elevated" : "calm",
    });
  }
  return out.slice(0, 4);
}

export function deriveSystemicFragilityBundle(args: {
  locale: UiLocale;
  latent: LatentDrivers;
  derived: DerivedCognitionSnapshot;
  history: readonly CognitiveSnapshot[];
  agentLattice: readonly AgentLatticeRow[];
  agentHistory: readonly AgentHistoryPoint[];
  scenarioCards: readonly ScenarioEngineCard[];
  simTick: number;
  lens?: SystemicFragilityLens;
}): SystemicFragilityBundle {
  const { locale, latent, derived, history, agentLattice, agentHistory, scenarioCards, simTick, lens = "unified" } =
    args;

  const risk = deriveRiskRadarBundle(locale, latent, derived, history);
  const crossAsset = deriveCrossAssetIntelligenceBundle(locale, latent, derived, history);

  const riskState = resolveRiskState(locale, latent, derived, risk);
  const cells = layoutSpatialItems(
    buildTopologyCells(locale, latent, derived, risk, crossAsset).map((c) => ({
      ...c,
      priority: c.emphasis,
    })),
    { gap: 3 },
  );
  const contagionArcs = buildContagionArcs(locale, crossAsset);
  const hiddenSignals = buildHiddenSignals(locale, latent, derived, risk, crossAsset);
  const evolution = buildEvolution(locale, history);
  const agentReactions = buildAgentReactions(
    locale,
    latent,
    derived,
    agentLattice,
    agentHistory,
    history,
    scenarioCards,
    simTick,
  );

  const transmissions: TransmissionRelation[] = crossAsset.relations.map((r) => ({
    id: r.id,
    label: r.label,
    read: r.structuralRead,
    tensionPct: r.tensionPct,
  }));

  const maxTension = Math.max(
    ...risk.conditions.map((c) => c.tensionPct),
    ...crossAsset.relations.map((r) => r.tensionPct),
    crossAsset.riskTransition.tensionPct,
  );

  const tension: SystemicFragilityBundle["tension"] =
    maxTension >= 82 || derived.dangerBand === "critical"
      ? "critical"
      : maxTension >= 58 || derived.dangerBand === "elevated"
        ? "elevated"
        : "calm";

  const primaryState =
    lens === "transmission"
      ? pickLocale(locale, "Market transmission observatory", "Обсерватория передачи рынка")
      : lens === "risk"
        ? riskState.headline
        : pickLocale(locale, `${riskState.headline} · ${crossAsset.riskTransition.label}`, `${riskState.headline} · ${crossAsset.riskTransition.label}`);

  const primarySubline =
    lens === "transmission"
      ? crossAsset.deskFootnote
      : lens === "risk"
        ? riskState.detail
        : pickLocale(
            locale,
            "Systemic fragility observatory — hidden instability before visible fracture.",
            "Обсерватория системной хрупкости — скрытая нестабильность до видимого разлома.",
          );

  const histSl = history.length >= 8 ? history.slice(-8) : history;
  const contagionSpread = clamp(slope(histSl.map((h) => h.divergenceIndex)) * 40 + derived.divergenceIndex * 0.35);
  const sponsorshipFade = clamp(latent.liquidityStructuralStress * 0.7 + (100 - derived.consensusSpreadPct) * 0.2);
  const instabilityPulse = clamp(derived.dangerScore * 0.6 + latent.volatilityImpulse * 0.3);

  const crossLinks = [
    pickLocale(locale, "Execution: tactical zones react to fragility pulses.", "Исполнение: тактические зоны реагируют на импульсы хрупкости."),
    pickLocale(locale, "Macro/Sentiment: global pressure feeds contagion arcs.", "Макро/настроения: глобальное давление питает дуги заразы."),
    pickLocale(locale, "Agents: war room synchronizes with systemic state.", "Агенты: зал синхронизирован с системным состоянием."),
  ];

  return {
    lens,
    riskState,
    primaryState,
    primarySubline,
    tension,
    cells,
    contagionArcs,
    hiddenSignals,
    evolution,
    agentReactions,
    transmissions,
    crossLinks,
    instabilityPulse,
    contagionSpread,
    sponsorshipFade,
    breathPhase: (simTick % 40) / 40,
    simTick,
    risk,
    crossAsset,
  };
}
