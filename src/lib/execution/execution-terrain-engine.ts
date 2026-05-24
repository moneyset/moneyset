import type { ExecutionLayerSurface, ExecutionStructuralZone } from "@/lib/execution/derive-execution-layer";
import { formatPriceRange } from "@/lib/execution/derive-execution-layer";
import type { DerivedCognitionSnapshot } from "@/lib/simulation/engine-evolve";
import { isLateContinuationRegime } from "@/lib/simulation/engine-evolve";
import type { CognitiveSnapshot, LatentDrivers } from "@/lib/simulation/cognition-types";
import type { ScenarioEngineBook, ScenarioEngineCard, ScenarioId } from "@/lib/simulation/scenario-engine";
import { pickLocale, scenarioTitle } from "@/lib/i18n/cognition-dict";
import { layoutAnnotationSlots, layoutVerticalStack } from "@/lib/layout/spatial-collision-layout";
import type { UiLocale } from "@/store/ui-prefs-store";

export type TerrainLayerKind =
  | "shelf"
  | "invalidation"
  | "pressure"
  | "participation"
  | "sponsorship"
  | "corridor"
  | "fragility"
  | "acceptance";

export type TerrainBand = Readonly<{
  id: string;
  kind: TerrainLayerKind;
  label: string;
  read: string;
  framing: string;
  /** 0–100 vertical position (top) */
  y: number;
  /** 0–100 height */
  h: number;
  emphasis: number;
  tone: "neutral" | "stress" | "support";
  priceBand: string | null;
}>;

export type StructuralOverlay = Readonly<{
  id: string;
  label: string;
  read: string;
  opacity: number;
  migrating: boolean;
}>;

export type ExecutionAnnotation = Readonly<{
  id: string;
  line: string;
  severity: "neutral" | "elevated" | "critical";
  /** Canvas top offset (0–100) — resolved to avoid band/geometry overlap. */
  canvasY: number;
}>;

export type ScenarioPathLane = Readonly<{
  id: string;
  rank: "dominant" | "secondary" | "failure" | "volatility" | "instability";
  title: string;
  conviction: string;
  pathLine: string;
  /** SVG path offset 0–100 */
  yAnchor: number;
  emphasis: number;
  evolving: boolean;
}>;

export type TerrainReplayFrame = Readonly<{
  tick: number;
  headline: string;
  note: string;
}>;

export type ExecutionTerrainBundle = Readonly<{
  posture: string;
  headline: string;
  subline: string;
  tension: "calm" | "elevated" | "critical";
  bands: readonly TerrainBand[];
  overlays: readonly StructuralOverlay[];
  annotations: readonly ExecutionAnnotation[];
  paths: readonly ScenarioPathLane[];
  replay: readonly TerrainReplayFrame[];
  executionImplications: readonly string[];
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

function zoneKindToLayer(kind: ExecutionStructuralZone["kind"]): TerrainLayerKind {
  switch (kind) {
    case "reclaim":
      return "shelf";
    case "acceptance":
      return "acceptance";
    case "liquidity_lower":
    case "liquidity_upper":
      return "pressure";
    case "compression":
      return "corridor";
    case "expansion_trigger":
      return "sponsorship";
    case "breakdown_trigger":
      return "invalidation";
    case "objective":
      return "corridor";
    case "extension":
      return "fragility";
    default:
      return "pressure";
  }
}

function zoneTone(z: ExecutionStructuralZone, derived: DerivedCognitionSnapshot): TerrainBand["tone"] {
  if (z.kind === "breakdown_trigger" || derived.dangerBand === "dangerous" || derived.dangerBand === "critical") {
    return "stress";
  }
  if (z.kind === "reclaim" || z.kind === "acceptance") return "support";
  if (z.kind === "compression" && derived.volTone === "compressing") return "neutral";
  return "neutral";
}

function bandsFromZones(
  locale: UiLocale,
  zones: readonly ExecutionStructuralZone[],
  derived: DerivedCognitionSnapshot,
  anchorPrice: number | null,
): TerrainBand[] {
  if (zones.length === 0) return [];
  const sorted = [...zones].sort((a, b) => (a.low + a.high) / 2 - (b.low + b.high) / 2);
  const min = sorted[0]!.low;
  const max = sorted[sorted.length - 1]!.high;
  const span = Math.max(max - min, 1);

  return layoutTerrainBands(
    sorted.map((z, i) => {
    const mid = (z.low + z.high) / 2;
    const y = clamp(100 - ((mid - min) / span) * 88 - 6, 4, 92);
    const h = clamp(((z.high - z.low) / span) * 42 + 8, 10, 32);
    return {
      id: `${z.kind}-${i}`,
      kind: zoneKindToLayer(z.kind),
      label: z.ladderTitle,
      read: z.ladderImportance,
      framing: z.ladderFraming,
      y,
      h,
      emphasis: clamp(40 + (z.kind === "reclaim" ? 18 : 0) + (derived.dangerBand !== "calm" ? 8 : 0)),
      tone: zoneTone(z, derived),
      priceBand: anchorPrice !== null ? formatPriceRange(locale, z.low, z.high) : null,
    };
    }),
  );
}

/** Prevent price-proximate bands from stacking on top of each other in the canvas. */
function layoutTerrainBands(bands: TerrainBand[]): TerrainBand[] {
  return layoutVerticalStack(bands, { gap: 2, minH: 9, startY: 3, maxBottom: 88 });
}

function buildOverlays(
  locale: UiLocale,
  surface: ExecutionLayerSurface,
  derived: DerivedCognitionSnapshot,
  latent: LatentDrivers,
): StructuralOverlay[] {
  const migrating = derived.divergenceIndex >= 48 || Math.abs(surface.scenarioWeightDelta) >= 6;
  return [
    {
      id: "structure-path",
      label: pickLocale(locale, "Structure path", "Путь структуры"),
      read: surface.primaryPath,
      opacity: clamp(72 - derived.divergenceIndex * 0.25),
      migrating,
    },
    {
      id: "continuation",
      label: pickLocale(locale, "Continuation strength", "Сила продолжения"),
      read: surface.continuationRead,
      opacity: clamp(65 + surface.scenarioWeightDelta * 0.4),
      migrating: surface.scenarioWeightDelta !== 0,
    },
    {
      id: "sponsorship",
      label: pickLocale(locale, "Sponsorship integrity", "Целостность спонсорства"),
      read: pickLocale(
        locale,
        latent.liquidityStructuralStress >= 62
          ? "Breadth thinning — reactive proof required at shelves."
          : "Participation sponsorship stable in capture band.",
        latent.liquidityStructuralStress >= 62
          ? "Ширина истончается — нужны реактивные доказательства у полок."
          : "Спонсорство участия стабильно в полосе захвата.",
      ),
      opacity: clamp(100 - latent.liquidityStructuralStress * 0.55),
      migrating: latent.liquidityStructuralStress >= 58,
    },
    {
      id: "vol-pressure",
      label: pickLocale(locale, "Volatility pressure", "Давление волатильности"),
      read: pickLocale(
        locale,
        derived.volTone === "expanding"
          ? "Expansion lane active — acceptance proofs widen."
          : derived.volTone === "compressing"
            ? "Compression lane — fracture risk on release."
            : "Vol band neutral — structure leads.",
        derived.volTone === "expanding"
          ? "Полоса расширения — шире доказательства принятия."
          : derived.volTone === "compressing"
            ? "Полоса сжатия — риск разлома при выходе."
            : "Вол нейтральна — ведёт структура.",
      ),
      opacity: clamp(latent.volatilityImpulse * 0.65),
      migrating: derived.volTone !== "neutral",
    },
    {
      id: "liquidity-interaction",
      label: pickLocale(locale, "Liquidity interaction", "Взаимодействие ликвидности"),
      read: surface.executionDepthLines[0] ?? surface.derivationNote,
      opacity: clamp(surface.microCognition.liquidityStress * 0.7),
      migrating: surface.microCognition.liquidityStress >= 60,
    },
  ];
}

function buildAnnotations(
  locale: UiLocale,
  surface: ExecutionLayerSurface,
  derived: DerivedCognitionSnapshot,
  latent: LatentDrivers,
): Omit<ExecutionAnnotation, "canvasY">[] {
  const out: Omit<ExecutionAnnotation, "canvasY">[] = [];
  const push = (id: string, en: string, ru: string, severity: ExecutionAnnotation["severity"]) =>
    out.push({ id, line: pickLocale(locale, en, ru), severity });

  if (isLateContinuationRegime(latent)) {
    push(
      "late-continuation",
      "Late continuation: headline strength with narrowing participation beneath.",
      "Позднее продолжение: сила заголовков при сужении участия внизу.",
      "elevated",
    );
    push(
      "sweep-risk",
      "Passive depth thinning — sweep into lower liquidity zone remains the primary hazard.",
      "Пассив истончается — снос в нижнюю зону ликвидности остаётся главным риском.",
      "critical",
    );
  }
  if (latent.liquidityStructuralStress >= 64) {
    push("reclaim-quality", "Reclaim quality deteriorating.", "Качество откупа ухудшается.", "elevated");
  }
  if (derived.divergenceIndex >= 52) {
    push("breadth", "Participation breadth weakening.", "Ширина участия слабеет.", "elevated");
  }
  if (derived.dangerBand === "elevated" || derived.dangerBand === "dangerous") {
    push("continuation", "Continuation vulnerable above shelf.", "Продолжение уязвимо над полкой.", "critical");
  }
  if (latent.positioningPressure >= 68 && latent.liquidityStructuralStress >= 58) {
    push("acceptance", "Acceptance lacks sponsorship.", "Принятию не хватает спонсорства.", "elevated");
  }
  if (derived.volTone === "expanding" && latent.macroLiquidityBackdrop < latent.positioningPressure) {
    push("pressure-lower", "Pressure migrating lower.", "Давление мигрирует ниже.", "neutral");
  }
  if (derived.phase === "fragile_continuation" || derived.phase === "overheated_momentum") {
    push("fragility", "Fragility hidden beneath expansion.", "Хрупкость скрыта под расширением.", "elevated");
  }
  for (const line of surface.structuralRationale.slice(0, 2)) {
    if (out.length >= 6) break;
    push(`rationale-${out.length}`, line, line, "neutral");
  }
  return out.slice(0, 6);
}

function pathRank(
  card: ScenarioEngineCard,
  index: number,
  leadId: ScenarioId | null,
): ScenarioPathLane["rank"] {
  if (index === 0 || card.id === leadId) return "dominant";
  const id = card.id;
  if (
    id === "Structural Breakdown Risk" ||
    id === "Distribution Phase" ||
    id === "Momentum Exhaustion"
  ) {
    return "failure";
  }
  if (id === "Volatility Compression" || card.riskLevel === "elevated") return "volatility";
  if (card.riskLevel === "high" || id === "Fragile Breakout Structure") return "instability";
  return "secondary";
}

function buildScenarioPaths(
  locale: UiLocale,
  book: ScenarioEngineBook,
  leadId: ScenarioId | null,
): ScenarioPathLane[] {
  const cards = book.cards.slice(0, 5);
  return cards.map((card, i) => {
    const rank = pathRank(card, i, leadId);
    const yAnchor = 18 + i * 14 + (rank === "dominant" ? 0 : 4);
    return {
      id: card.id,
      rank,
      title: scenarioTitle(locale, card.id),
      conviction: card.pathConvictionLine,
      pathLine: card.structuralPath,
      yAnchor: clamp(yAnchor),
      emphasis: clamp(card.probabilityPct * 0.85),
      evolving: card.evolutionState === "strengthening" || card.evolutionState === "weakening",
    };
  });
}

function buildReplay(
  locale: UiLocale,
  history: readonly CognitiveSnapshot[],
  surface: ExecutionLayerSurface,
): TerrainReplayFrame[] {
  if (history.length < 2) {
    return surface.evolutionLines.map((line, i) => ({
      tick: i,
      headline: surface.evolutionHeadline,
      note: line,
    }));
  }
  const step = Math.max(1, Math.floor(history.length / 7));
  const frames: TerrainReplayFrame[] = [];
  for (let i = 0; i < history.length; i += step) {
    const snap = history[i]!;
    const next = history[Math.min(history.length - 1, i + step)];
    let note = pickLocale(locale, "Structure stable", "Структура стабильна");
    if (next && next.dangerBand !== snap.dangerBand) {
      note = pickLocale(locale, "Invalidation pressure evolved", "Эволюция давления инвалидации");
    } else if (next && next.liquidityStructuralStress > snap.liquidityStructuralStress + 5) {
      note = pickLocale(locale, "Sponsorship deteriorating", "Спонсорство ухудшается");
    } else if (next && next.divergenceIndex > snap.divergenceIndex + 5) {
      note = pickLocale(locale, "Scenario divergence widening", "Расхождение сценариев расширяется");
    } else if (next && next.leadScenarioProb !== snap.leadScenarioProb) {
      note = pickLocale(locale, "Path weight migration", "Миграция веса пути");
    }
    frames.push({
      tick: snap.simTick,
      headline: pickLocale(locale, `Capture T${snap.simTick}`, `Захват T${snap.simTick}`),
      note,
    });
  }
  return frames.slice(-7);
}

export function deriveExecutionTerrainBundle(args: {
  locale: UiLocale;
  surface: ExecutionLayerSurface;
  derived: DerivedCognitionSnapshot;
  latent: LatentDrivers;
  history: readonly CognitiveSnapshot[];
  scenarioBook: ScenarioEngineBook;
  leadScenarioId: ScenarioId | null;
  simTick: number;
}): ExecutionTerrainBundle {
  const { locale, surface, derived, latent, history, scenarioBook, leadScenarioId, simTick } = args;

  const tension: ExecutionTerrainBundle["tension"] =
    derived.dangerBand === "critical" || derived.dangerBand === "dangerous"
      ? "critical"
      : derived.dangerBand === "elevated" || derived.divergenceIndex >= 54
        ? "elevated"
        : "calm";

  const continuationQuality = clamp(
    100 - derived.divergenceIndex * 0.4 - latent.liquidityStructuralStress * 0.25 + surface.scenarioWeightDelta * 0.15,
  );
  const sponsorshipIntegrity = clamp(100 - latent.liquidityStructuralStress * 0.6 - derived.dangerScore * 0.15);
  const scenarioDivergence = clamp(derived.divergenceIndex + derived.consensusSpreadPct * 0.15);

  const implications: string[] = [
    surface.executionPosture,
    surface.continuationRead,
    ...surface.invalidationPressure.slice(0, 2),
    surface.executionBiasLabel,
  ].filter(Boolean);

  return {
    posture: surface.executionPosture,
    headline: surface.executionHeadline,
    subline: surface.primaryPath,
    tension,
    bands: bandsFromZones(locale, surface.zones, derived, surface.anchorPrice),
    overlays: buildOverlays(locale, surface, derived, latent),
    annotations: (() => {
      const raw = buildAnnotations(locale, surface, derived, latent);
      const tops = layoutAnnotationSlots(raw.length, { startY: 8, slotH: 10, gap: 1.6, maxY: 90 });
      return raw.map((a, i) => ({ ...a, canvasY: tops[i] ?? 8 }));
    })(),
    paths: buildScenarioPaths(locale, scenarioBook, leadScenarioId),
    replay: buildReplay(locale, history, surface),
    executionImplications: implications.slice(0, 5),
    continuationQuality,
    sponsorshipIntegrity,
    scenarioDivergence,
    breathPhase: (simTick % 40) / 40,
    pathMigration: clamp(50 + surface.scenarioWeightDelta * 2),
    simTick,
    symbol: surface.symbol,
    hasTape: surface.hasTape,
  };
}
