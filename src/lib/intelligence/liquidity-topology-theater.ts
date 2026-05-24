import type { AgentCognitionBundle } from "@/lib/agents/agent-cognition-engine";
import { deriveAgentCognitionBundle } from "@/lib/agents/agent-cognition-engine";
import type { DerivedCognitionSnapshot } from "@/lib/simulation/engine-evolve";
import type {
  AgentHistoryPoint,
  AgentLatticeRow,
  CognitiveSnapshot,
  LatentDrivers,
} from "@/lib/simulation/cognition-types";
import { deriveMapsTopologyBundle } from "@/lib/intelligence/maps-topology-view";
import type { MapsTopologyCell } from "@/lib/intelligence/maps-topology-view";
import { deriveRiskRadarBundle } from "@/lib/intelligence/risk-radar-view";
import type { ScenarioEngineCard } from "@/lib/simulation/scenario-engine";
import { deriveLiquidityPhysicsPhenomena, type LiquidityPhenomenon } from "@/lib/intelligence/liquidity-physics-phenomena";
import { pickLocale } from "@/lib/i18n/cognition-dict";
import { layoutSpatialItems } from "@/lib/layout/spatial-collision-layout";
import type { UiLocale } from "@/store/ui-prefs-store";

export type LiquidityRegimeId =
  | "balanced"
  | "thin_continuation"
  | "compression"
  | "cascade_vulnerable"
  | "sponsorship_decay"
  | "fragility_expansion"
  | "aggressive_absorption"
  | "forced_rotation";

export type TerrainFeatureKind = "ridge" | "valley" | "pocket" | "fracture" | "flow" | "cluster";

export type TerrainFeature = Readonly<{
  id: string;
  kind: TerrainFeatureKind;
  label: string;
  read: string;
  x: number;
  y: number;
  w: number;
  h: number;
  emphasis: number;
  tone: "neutral" | "stress" | "support";
}>;

export type MigrationPath = Readonly<{
  id: string;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  label: string;
}>;

export type LiquidityReplayFrame = Readonly<{
  tick: number;
  regime: LiquidityRegimeId;
  gravity: number;
  note: string;
}>;

export type LiquidityTheaterBundle = Readonly<{
  regime: Readonly<{
    id: LiquidityRegimeId;
    headline: string;
    detail: string;
  }>;
  primaryState: string;
  primarySubline: string;
  tension: "calm" | "elevated" | "critical";
  gravity: number;
  gravityRead: string;
  cascadeRead: string;
  clusterRead: string;
  features: readonly TerrainFeature[];
  migrations: readonly MigrationPath[];
  executionImplications: readonly string[];
  crossLinks: readonly string[];
  replay: readonly LiquidityReplayFrame[];
  breathPhase: number;
  distortion: number;
  participationFragility: number;
  sponsorshipStrength: number;
  simTick: number;
  phenomena: readonly LiquidityPhenomenon[];
}>;

function clamp(n: number, lo = 0, hi = 100): number {
  return Math.min(hi, Math.max(lo, Math.round(n)));
}

function cellToFeature(c: MapsTopologyCell, kind: TerrainFeatureKind): TerrainFeature {
  return {
    id: c.id,
    kind,
    label: c.label,
    read: c.readLine,
    x: c.x,
    y: c.y,
    w: c.w,
    h: c.h,
    emphasis: c.emphasis,
    tone: c.tone,
  };
}

function resolveRegime(
  locale: UiLocale,
  latent: LatentDrivers,
  derived: DerivedCognitionSnapshot,
  gravity: number,
): LiquidityTheaterBundle["regime"] {
  const liq = latent.liquidityStructuralStress;
  const pp = latent.positioningPressure;
  const vi = latent.volatilityImpulse;

  if (derived.phase === "panic_risk" || (gravity >= 78 && derived.dangerBand !== "calm")) {
    return {
      id: "cascade_vulnerable",
      headline: pickLocale(locale, "Cascade vulnerability", "Уязвимость каскада"),
      detail: pickLocale(
        locale,
        "Forced participation geometry — liquidation gravity bending the terrain.",
        "Геометрия вынужденного участия — гравитация ликвидаций искривляет рельеф.",
      ),
    };
  }
  if (derived.phase === "liquidity_compression" || (vi >= 62 && liq >= 58)) {
    return {
      id: "compression",
      headline: pickLocale(locale, "Compression instability", "Нестабильность сжатия"),
      detail: pickLocale(
        locale,
        "Volatility compressing inside thinning depth — fracture risk on expansion.",
        "Волатильность сжимается в истончающейся глубине — риск разлома при расширении.",
      ),
    };
  }
  if (liq >= 68 && pp >= 64) {
    return {
      id: "fragility_expansion",
      headline: pickLocale(locale, "Thin depth continuation", "Продолжение на тонкой глубине"),
      detail: pickLocale(
        locale,
        "Passive depth thinning beneath extension — sweep vulnerability concentrated below reclaim.",
        "Пассивная глубина истончается под продлением — риск сноса сосредоточен ниже откупа.",
      ),
    };
  }
  if (liq >= 60 && pp >= 62 && vi <= 48) {
    return {
      id: "thin_continuation",
      headline: pickLocale(locale, "Compressed vol continuation", "Продолжение при сжатой воле"),
      detail: pickLocale(
        locale,
        "Volatility compressed while participation narrows — continuation survives only on reclaim quality.",
        "Волатильность сжата при сужении участия — продолжение держится только на качестве откупа.",
      ),
    };
  }
  if (liq >= 62 && pp <= 48) {
    return {
      id: "sponsorship_decay",
      headline: pickLocale(locale, "Sponsorship decay", "Распад спонсорства"),
      detail: pickLocale(
        locale,
        "Passive depth failing to absorb — continuation survival thinning.",
        "Пассивная глубина не поглощает — выживание продолжения истончается.",
      ),
    };
  }
  if (pp >= 72 && liq < 58) {
    return {
      id: "aggressive_absorption",
      headline: pickLocale(locale, "Aggressive absorption", "Агрессивное поглощение"),
      detail: pickLocale(
        locale,
        "Participation leaning hard — leverage band dominating topology.",
        "Участие сильно наклонено — плечевая полоса доминирует в топологии.",
      ),
    };
  }
  if (derived.divergenceIndex >= 52 && latent.macroLiquidityBackdrop >= 60) {
    return {
      id: "forced_rotation",
      headline: pickLocale(locale, "Forced rotation", "Вынужденная ротация"),
      detail: pickLocale(
        locale,
        "Liquidity migrating across regime hinge — macro vs micro fracture.",
        "Ликвидность мигрирует через шарнир режима — разлом макро и микро.",
      ),
    };
  }
  if (liq >= 55 && derived.volTone === "expanding") {
    return {
      id: "thin_continuation",
      headline: pickLocale(locale, "Thin continuation", "Тонкое продолжение"),
      detail: pickLocale(
        locale,
        "Expansion against thinning sponsorship — reactive flow only until depth repairs.",
        "Расширение на истончающемся спонсорстве — реактивный поток, пока глубина не восстановится.",
      ),
    };
  }
  return {
    id: "balanced",
    headline: pickLocale(locale, "Balanced participation", "Сбалансированное участие"),
    detail: pickLocale(
      locale,
      "Pressure distributed — no dominant cascade geometry in capture window.",
      "Давление распределено — доминирующей геометрии каскада в окне нет.",
    ),
  };
}

function computeGravity(latent: LatentDrivers, derived: DerivedCognitionSnapshot, agentStress: number): number {
  return clamp(
    latent.liquidityStructuralStress * 0.38 +
      latent.positioningPressure * 0.28 +
      latent.volatilityImpulse * 0.14 +
      derived.dangerScore * 0.22 +
      agentStress * 0.12,
  );
}

function buildMigrations(
  locale: UiLocale,
  latent: LatentDrivers,
  derived: DerivedCognitionSnapshot,
  simTick: number,
): MigrationPath[] {
  const m = latent.macroLiquidityBackdrop;
  const liq = latent.liquidityStructuralStress;
  const paths: MigrationPath[] = [];

  if (m >= 58 && derived.divergenceIndex >= 44) {
    paths.push({
      id: "macro-micro",
      fromX: 18,
      fromY: 22,
      toX: 72,
      toY: 58,
      label: pickLocale(locale, "Macro → micro stress migration", "Миграция макро → микро-стресс"),
    });
  }
  if (liq >= 60) {
    paths.push({
      id: "depth-evap",
      fromX: 42,
      fromY: 38,
      toX: 55,
      toY: 78,
      label: pickLocale(locale, "Depth evaporation drift", "Дрейф испарения глубины"),
    });
  }
  if (latent.positioningPressure >= 66) {
    paths.push({
      id: "leverage-pull",
      fromX: 28,
      fromY: 68,
      toX: 68,
      toY: 42,
      label: pickLocale(locale, "Leverage compression pull", "Притяжение плечевого сжатия"),
    });
  }

  const phase = (simTick % 24) / 24;
  return paths.map((p, i) => ({
    ...p,
    fromX: p.fromX + Math.sin(phase * Math.PI * 2 + i) * 1.2,
    toY: p.toY + Math.cos(phase * Math.PI * 2 + i * 0.7) * 0.8,
  }));
}

function buildReplay(
  locale: UiLocale,
  history: readonly CognitiveSnapshot[],
  agentHistory: readonly AgentHistoryPoint[],
): LiquidityReplayFrame[] {
  const source = history.length >= 3 ? history : [];
  if (source.length === 0 && agentHistory.length >= 2) {
    return agentHistory
      .filter((_, i) => i % Math.max(1, Math.floor(agentHistory.length / 6)) === 0)
      .slice(-6)
      .map((pt) => ({
        tick: pt.simTick,
        regime: pt.liquidity >= 65 ? ("fragility_expansion" as const) : ("balanced" as const),
        gravity: clamp(pt.liquidity * 0.7 + pt.risk * 0.2),
        note: pickLocale(locale, "Liquidity lattice capture", "Захват решётки ликвидности"),
      }));
  }

  const step = Math.max(1, Math.floor(source.length / 7));
  const frames: LiquidityReplayFrame[] = [];

  for (let i = 0; i < source.length; i += step) {
    const snap = source[i]!;
    const next = source[Math.min(source.length - 1, i + step)];
    const gravity = clamp(snap.liquidityStructuralStress * 0.75 + snap.dangerScore * 0.25);
    let regime: LiquidityRegimeId = "balanced";
    if (snap.liquidityStructuralStress >= 68) regime = "fragility_expansion";
    else if (snap.liquidityStructuralStress >= 58 && snap.volatilityImpulse >= 58) regime = "compression";
    else if (snap.positioningPressure >= 70) regime = "aggressive_absorption";
    else if (snap.dangerBand === "dangerous" || snap.dangerBand === "critical") regime = "cascade_vulnerable";

    let note = pickLocale(locale, "Pressure stable", "Давление стабильно");
    if (next && next.liquidityStructuralStress > snap.liquidityStructuralStress + 6) {
      note = pickLocale(locale, "Instability expanding", "Нестабильность расширяется");
    } else if (next && next.liquidityStructuralStress + 6 < snap.liquidityStructuralStress) {
      note = pickLocale(locale, "Sponsorship returning", "Спонсорство возвращается");
    } else if (next && next.dangerBand !== snap.dangerBand) {
      note = pickLocale(locale, "Stress band migration", "Миграция полосы стресса");
    }

    frames.push({ tick: snap.simTick, regime, gravity, note });
  }
  return frames.slice(-7);
}

function buildCrossLinks(
  locale: UiLocale,
  derived: DerivedCognitionSnapshot,
  latent: LatentDrivers,
  agents: AgentCognitionBundle | null,
  riskHeadline: string | null,
): string[] {
  const out: string[] = [];
  if (agents) {
    const liqAgent = agents.personas.find((p) => p.id === "liquidity");
    const structAgent = agents.personas.find((p) => p.id === "structure");
    if (liqAgent && structAgent && Math.abs(liqAgent.conviction - structAgent.conviction) >= 18) {
      out.push(
        pickLocale(
          locale,
          "Agents: liquidity–structure fracture distorting participation geometry.",
          "Агенты: разлом ликвидность–структура искажает геометрию участия.",
        ),
      );
    }
    if (agents.conflicts.some((c) => c.agents.includes("liquidity"))) {
      out.push(
        pickLocale(locale, "Agent war room: elevated liquidity disagreement.", "Зал агентов: повышенное расхождение по ликвидности."),
      );
    }
  }
  if (latent.macroLiquidityBackdrop >= 68 && derived.divergenceIndex >= 48) {
    out.push(
      pickLocale(locale, "Macro lab: backdrop strong — micro depth breathing faster.", "Макро: сильный фон — микро-глубина «дышит» быстрее."),
    );
  }
  if (riskHeadline) {
    out.push(pickLocale(locale, `Risk radar: ${riskHeadline}`, `Радар риска: ${riskHeadline}`));
  }
  return out.slice(0, 4);
}

function buildExecutionImplications(
  locale: UiLocale,
  regime: LiquidityRegimeId,
  latent: LatentDrivers,
  derived: DerivedCognitionSnapshot,
  mapsImplication: string,
): string[] {
  const out: string[] = [mapsImplication];
  const push = (en: string, ru: string) => out.push(pickLocale(locale, en, ru));

  switch (regime) {
    case "thin_continuation":
      push("Continuation vulnerable to thin participation.", "Продолжение уязвимо к тонкому участию.");
      break;
    case "compression":
      push("Pressure concentrated at range hinge — expansion breaks need proof.", "Давление у конца диапазона — пробои расширения требуют доказательства.");
      break;
    case "cascade_vulnerable":
      push("Leverage imbalance increasing fragility — size discipline first.", "Дисбаланс плеча наращивает хрупкость — сначала дисциплина размера.");
      break;
    case "sponsorship_decay":
      push("Sponsorship decay — reactive fills only at proven shelves.", "Распад спонсорства — реактивные заполнения только у доказанных полок.");
      break;
    case "aggressive_absorption":
      push("Absorption improving continuation survival if depth holds.", "Поглощение улучшает выживание продолжения, если глубина держится.");
      break;
    case "fragility_expansion":
      push("Pressure concentrated below reclaim shelf — invalidation sensitivity elevated.", "Давление ниже полки откупа — чувствительность к инвалидации выше.");
      break;
    default:
      push("Base sponsorship intact — monitor migration drift.", "Базовое спонсорство держится — следить за дрейфом миграции.");
  }

  if (latent.liquidityStructuralStress >= 66) {
    push("Sweep vulnerability elevated — avoid resting size into thin belts.", "Уязвимость к сносу выше — не держать размер в тонких поясах.");
  }
  return out.slice(0, 5);
}

export function deriveLiquidityTheaterBundle(args: {
  locale: UiLocale;
  latent: LatentDrivers;
  derived: DerivedCognitionSnapshot;
  history: readonly CognitiveSnapshot[];
  agentHistory: readonly AgentHistoryPoint[];
  agentLattice: readonly AgentLatticeRow[];
  scenarioCards: readonly ScenarioEngineCard[];
  simTick: number;
}): LiquidityTheaterBundle {
  const { locale, latent, derived, history, agentHistory, agentLattice, scenarioCards, simTick } = args;

  const maps = deriveMapsTopologyBundle(locale, latent, derived, history, simTick);
  const layer = maps.liquidity;

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
  const liqAgent = agents.personas.find((p) => p.id === "liquidity");
  const agentStress = liqAgent?.stress ?? 40;

  const gravity = computeGravity(latent, derived, agentStress);
  const regime = resolveRegime(locale, latent, derived, gravity);

  const risk = deriveRiskRadarBundle(locale, latent, derived, history);
  const riskHeadline = risk.conditions[0]?.headline ?? null;

  const features: TerrainFeature[] = [
    ...layer.cells.map((c, i) => cellToFeature(c, i === 0 ? "pocket" : i === 1 ? "ridge" : i === 2 ? "cluster" : "fracture")),
    ...maps.imbalance.cells.slice(0, 2).map((c) => cellToFeature(c, "valley")),
    ...maps.participation.cells.slice(0, 1).map((c) => cellToFeature(c, "flow")),
  ];

  const sponsorshipStrength = clamp(100 - latent.liquidityStructuralStress * 0.65 + latent.positioningPressure * 0.15);
  const participationFragility = clamp(latent.liquidityStructuralStress * 0.55 + derived.divergenceIndex * 0.35);

  const tension: LiquidityTheaterBundle["tension"] =
    gravity >= 76 || regime.id === "cascade_vulnerable"
      ? "critical"
      : gravity >= 54 || regime.id === "fragility_expansion" || regime.id === "compression"
        ? "elevated"
        : "calm";

  const gravityRead =
    gravity >= 72
      ? pickLocale(locale, "Liquidation gravity strong — terrain bending toward forced zones.", "Гравитация ликвидаций сильна — рельеф прогибается к зонам вынужденного потока.")
      : gravity >= 52
        ? pickLocale(locale, "Moderate gravity — pressure ridges forming.", "Умеренная гравитация — формируются гребни давления.")
        : pickLocale(locale, "Gravity contained — balanced deformation.", "Гравитация сдержана — деформация сбалансирована.");

  const cascadeRead =
    regime.id === "cascade_vulnerable" || latent.positioningPressure >= 70
      ? pickLocale(
          locale,
          "Chain-reaction geometry active — cluster proximity elevates tail coupling.",
          "Геометрия цепной реакции активна — близость кластеров усиливает связку хвостов.",
        )
      : pickLocale(locale, "Cascade probability subdued in current band.", "Вероятность каскада сдержана в текущей полосе.");

  const clusterRead = pickLocale(
    locale,
    "Forced participation zones align with leverage compression bands — not price targets.",
    "Зоны вынужденного участия совпадают с полосами плечевого сжатия — не с ценовыми целями.",
  );

  const distortion = clamp(gravity * 0.35 + derived.divergenceIndex * 0.25 + agents.networkStress * 0.15);
  const breathPhase = (simTick % 48) / 48;

  const laidFeatures = layoutSpatialItems(
    features.map((f) => ({ ...f, priority: f.emphasis })),
    { gap: 3.2, bounds: { minX: 2, minY: 4, maxX: 96, maxY: 92 } },
  );

  return {
    regime,
    primaryState: regime.headline,
    primarySubline: regime.detail,
    tension,
    gravity,
    gravityRead,
    cascadeRead,
    clusterRead,
    features: laidFeatures,
    migrations: buildMigrations(locale, latent, derived, simTick),
    executionImplications: buildExecutionImplications(locale, regime.id, latent, derived, layer.executionImplication),
    crossLinks: buildCrossLinks(locale, derived, latent, agents, riskHeadline),
    replay: buildReplay(locale, history, agentHistory),
    breathPhase,
    distortion,
    participationFragility,
    sponsorshipStrength,
    simTick,
    phenomena: deriveLiquidityPhysicsPhenomena(locale, latent, derived, gravity, simTick),
  };
}
