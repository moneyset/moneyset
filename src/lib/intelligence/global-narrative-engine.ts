import { deriveCrossAssetIntelligenceBundle } from "@/lib/intelligence/cross-asset-intelligence-view";
import {
  deriveMacroIntelligenceBundle,
  type MacroIntelligenceBundle,
} from "@/lib/intelligence/macro-intelligence-view";
import {
  deriveSentimentIntelligenceBundle,
  type SentimentIntelligenceBundle,
} from "@/lib/intelligence/sentiment-intelligence-view";
import type { DerivedCognitionSnapshot } from "@/lib/simulation/engine-evolve";
import { isLateContinuationRegime } from "@/lib/simulation/engine-evolve";
import type { CognitiveSnapshot, LatentDrivers } from "@/lib/simulation/cognition-types";
import { pickLocale } from "@/lib/i18n/cognition-dict";
import { layoutSpatialItems, resolveSpatialLayout } from "@/lib/layout/spatial-collision-layout";
import type { UiLocale } from "@/store/ui-prefs-store";

export type GlobalMacroRegimeId =
  | "liquidity_supportive"
  | "policy_tightening"
  | "vol_sensitive"
  | "compression_envelope"
  | "expansion_risk"
  | "fragile_participation"
  | "risk_off_migration"
  | "planetary_transition";

export type NarrativeRegimeId =
  | "controlled_narrative"
  | "crowd_instability"
  | "euphoria_exhaustion"
  | "fear_acceleration"
  | "geopolitical_stress"
  | "reflexive_crowding"
  | "narrative_compression"
  | "sentiment_fracture";

export type PressureFieldKind =
  | "macro_pressure"
  | "narrative_tension"
  | "geo_instability"
  | "liquidity_climate"
  | "vol_topology"
  | "policy_gravity"
  | "crowd_band"
  | "transmission_arc";

export type PressureFieldCell = Readonly<{
  id: string;
  kind: PressureFieldKind;
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

export type EventGravityField = Readonly<{
  id: "cpi" | "fomc" | "nfp";
  label: string;
  distortion: number;
  read: string;
  deformation: string;
  x: number;
  y: number;
  w: number;
  h: number;
}>;

export type SentimentDivergence = Readonly<{
  id: string;
  line: string;
  severity: "neutral" | "elevated" | "critical";
  x: number;
  y: number;
  w: number;
  h: number;
}>;

export type CrossAssetTransmission = Readonly<{
  id: string;
  asset: string;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  read: string;
  intensity: number;
}>;

export type MarketStoryBeat = Readonly<{
  id: string;
  line: string;
  emphasis: number;
}>;

export type NarrativeReplayFrame = Readonly<{
  tick: number;
  macroRegime: GlobalMacroRegimeId;
  narrativeRegime: NarrativeRegimeId;
  storyLine: string;
}>;

export type GlobalNarrativeLens = "macro" | "sentiment" | "unified";

export type GlobalNarrativeBundle = Readonly<{
  lens: GlobalNarrativeLens;
  macroRegime: Readonly<{ id: GlobalMacroRegimeId; headline: string; detail: string }>;
  narrativeRegime: Readonly<{ id: NarrativeRegimeId; headline: string; detail: string }>;
  primaryState: string;
  primarySubline: string;
  tension: "calm" | "elevated" | "critical";
  pressureFields: readonly PressureFieldCell[];
  eventGravity: readonly EventGravityField[];
  divergences: readonly SentimentDivergence[];
  transmissions: readonly CrossAssetTransmission[];
  storyBeats: readonly MarketStoryBeat[];
  replay: readonly NarrativeReplayFrame[];
  crossLinks: readonly string[];
  breathPhase: number;
  narrativeAcceleration: number;
  macroInstability: number;
  geoStress: number;
  simTick: number;
  macro: MacroIntelligenceBundle;
  sentiment: SentimentIntelligenceBundle;
}>;

function clamp(n: number, lo = 0, hi = 100): number {
  return Math.min(hi, Math.max(lo, Math.round(n)));
}

export function globalMacroRegimeClass(id: GlobalMacroRegimeId): string {
  return `ms-global-matrix--macro-${id.replace(/_/g, "-")}`;
}

export function narrativeRegimeClass(id: NarrativeRegimeId): string {
  return `ms-global-matrix--narr-${id.replace(/_/g, "-")}`;
}

function resolveMacroRegime(
  locale: UiLocale,
  latent: LatentDrivers,
  derived: DerivedCognitionSnapshot,
  macro: MacroIntelligenceBundle,
): GlobalNarrativeBundle["macroRegime"] {
  const m = latent.macroLiquidityBackdrop;
  const vi = latent.volatilityImpulse;
  let id: GlobalMacroRegimeId = "planetary_transition";

  if (isLateContinuationRegime(latent)) {
    id = derived.volTone === "compressing" ? "compression_envelope" : "policy_tightening";
  } else if (derived.consensus === "macro_dominance_rising" && m >= 65) id = "liquidity_supportive";
  else if (m >= 62 && latent.liquidityStructuralStress >= 58) id = "policy_tightening";
  else if (vi >= 62 && derived.volTone === "expanding") id = "vol_sensitive";
  else if (derived.volTone === "compressing") id = "compression_envelope";
  else if (derived.volTone === "expanding" && m >= 55) id = "expansion_risk";
  else if (derived.divergenceIndex >= 52 && latent.liquidityStructuralStress >= 55) id = "fragile_participation";
  else if (derived.dangerBand === "dangerous" || derived.dangerBand === "critical") id = "risk_off_migration";

  const headlines: Record<GlobalMacroRegimeId, [string, string]> = {
    liquidity_supportive: ["Liquidity climate supportive — planetary bid intact", "Климат ликвидности поддерживает — планетарный спрос держится"],
    policy_tightening: ["Policy pressure tightening — rate path dominates", "Давление политики ужесточается — путь ставок доминирует"],
    vol_sensitive: ["Volatility environment sensitive — tails expanding", "Среда волатильности чувствительна — хвосты расширяются"],
    compression_envelope: [
      "Yield pressure into compressed BTC vol — macro sensitivity elevated",
      "Давление доходности на сжатую волу BTC — макро-чувствительность выше",
    ],
    expansion_risk: ["Expansion state — participation must confirm macro", "Состояние расширения — участие должно подтвердить макро"],
    fragile_participation: ["Fragile global participation tone", "Хрупкий глобальный тон участия"],
    risk_off_migration: ["Risk appetite migration defensive", "Миграция аппетита к риску в защиту"],
    planetary_transition: ["Planetary regime transition — coherence low", "Планетарный переход режима — связность низкая"],
  };

  return {
    id,
    headline: pickLocale(locale, headlines[id][0], headlines[id][1]),
    detail: macro.regime.detail,
  };
}

function resolveNarrativeRegime(
  locale: UiLocale,
  latent: LatentDrivers,
  derived: DerivedCognitionSnapshot,
  sentiment: SentimentIntelligenceBundle,
): GlobalNarrativeBundle["narrativeRegime"] {
  const st = latent.sentimentThermal;
  const pp = latent.positioningPressure;
  const div = derived.divergenceIndex;
  let id: NarrativeRegimeId = "controlled_narrative";

  if (st >= 72 && pp >= 64) id = "euphoria_exhaustion";
  else if (st >= 68 && div >= 48) id = "reflexive_crowding";
  else if (st <= 42 && derived.dangerBand !== "calm") id = "fear_acceleration";
  else if (latent.volatilityImpulse >= 62 && latent.macroLiquidityBackdrop >= 58) id = "geopolitical_stress";
  else if (div >= 52) id = "sentiment_fracture";
  else if (derived.volTone === "compressing" && st >= 55) id = "narrative_compression";
  else if (pp >= 66 && latent.liquidityStructuralStress >= 60) id = "crowd_instability";

  const headlines: Record<NarrativeRegimeId, [string, string]> = {
    controlled_narrative: ["Narrative controlled — fractures contained", "Нарратив под контролем — разломы сдержаны"],
    crowd_instability: ["Crowd instability — positioning reactive", "Нестабильность толпы — позиционирование реактивно"],
    euphoria_exhaustion: ["Optimism exhaustion beneath surface heat", "Истощение оптимизма под поверхностным жаром"],
    fear_acceleration: ["Fear acceleration — defensive narrative leads", "Ускорение страха — защитный нарратив ведёт"],
    geopolitical_stress: ["Geopolitical stress waves active", "Волны геополитического стресса активны"],
    reflexive_crowding: ["Reflexive crowding — narrative feeds positioning", "Рефлексивное скопление — нарратив питает позиции"],
    narrative_compression: ["Narrative compression — emotional range narrowing", "Сжатие нарратива — эмоциональный диапазон сужается"],
    sentiment_fracture: ["Sentiment fracture — consensus splitting", "Разлом настроений — консенсус расходится"],
  };

  return {
    id,
    headline: pickLocale(locale, headlines[id][0], headlines[id][1]),
    detail: sentiment.narrativeTension.detail,
  };
}

function buildPressureFields(
  locale: UiLocale,
  latent: LatentDrivers,
  derived: DerivedCognitionSnapshot,
  macro: MacroIntelligenceBundle,
  sentiment: SentimentIntelligenceBundle,
): PressureFieldCell[] {
  const push = (
    id: string,
    kind: PressureFieldKind,
    enL: string,
    ruL: string,
    enR: string,
    ruR: string,
    x: number,
    y: number,
    w: number,
    h: number,
    emphasis: number,
    tone: PressureFieldCell["tone"],
    pulsing: boolean,
  ): PressureFieldCell => ({
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

  return [
    push(
      "macro-core",
      "macro_pressure",
      "Macro pressure field",
      "Поле макро-давления",
      macro.regime.headline,
      macro.regime.headline,
      6,
      12,
      42,
      28,
      macro.regime.pressurePct,
      macro.regime.pressurePct >= 65 ? "stress" : "neutral",
      derived.consensus === "macro_dominance_rising",
    ),
    push(
      "narr-band",
      "narrative_tension",
      "Narrative tension band",
      "Полоса нарративного напряжения",
      sentiment.narrativeTension.headline,
      sentiment.narrativeTension.headline,
      52,
      18,
      40,
      22,
      sentiment.narrativeTension.tensionPct,
      sentiment.narrativeTension.tensionPct >= 65 ? "stress" : "neutral",
      sentiment.narrativeTension.tensionPct >= 58,
    ),
    push(
      "geo-zone",
      "geo_instability",
      "Geopolitical instability",
      "Геополитическая нестабильность",
      sentiment.geopolitical[0] ?? "Geo layer quiet.",
      sentiment.geopolitical[0] ?? "Геослой спокоен.",
      68,
      52,
      26,
      24,
      clamp(latent.volatilityImpulse * 0.55 + latent.macroLiquidityBackdrop * 0.2),
      latent.volatilityImpulse >= 60 ? "stress" : "neutral",
      latent.volatilityImpulse >= 58,
    ),
    push(
      "liq-climate",
      "liquidity_climate",
      "Liquidity climate",
      "Климат ликвидности",
      macro.ratesLiquidity,
      macro.ratesLiquidity,
      8,
      48,
      36,
      20,
      clamp(100 - latent.liquidityStructuralStress),
      latent.liquidityStructuralStress >= 62 ? "stress" : "support",
      latent.liquidityStructuralStress >= 58,
    ),
    push(
      "vol-topo",
      "vol_topology",
      "Volatility expectation topology",
      "Топология ожиданий волатильности",
      macro.yieldBehavior,
      macro.yieldBehavior,
      44,
      44,
      30,
      26,
      clamp(latent.volatilityImpulse * 0.75),
      derived.volTone === "expanding" ? "stress" : "neutral",
      derived.volTone !== "neutral",
    ),
    push(
      "policy-grav",
      "policy_gravity",
      "Policy gravity",
      "Гравитация политики",
      macro.centralBankPosture,
      macro.centralBankPosture,
      22,
      68,
      48,
      14,
      clamp(latent.macroLiquidityBackdrop * 0.7),
      latent.macroLiquidityBackdrop >= 62 ? "stress" : "neutral",
      true,
    ),
    push(
      "crowd-band",
      "crowd_band",
      "Crowd emotional band",
      "Эмоциональная полоса толпы",
      sentiment.crowdPositioning,
      sentiment.crowdPositioning,
      58,
      72,
      34,
      18,
      clamp(latent.sentimentThermal * 0.65 + latent.positioningPressure * 0.25),
      latent.sentimentThermal >= 68 ? "stress" : "neutral",
      latent.sentimentThermal >= 62,
    ),
    push(
      "trans-arc",
      "transmission_arc",
      "Cross-market transmission",
      "Кросс-рыночная передача",
      sentiment.crossMarket[0] ?? "Transmission monitored.",
      sentiment.crossMarket[0] ?? "Передача под наблюдением.",
      74,
      8,
      20,
      38,
      clamp(derived.divergenceIndex * 0.55),
      "neutral",
      derived.divergenceIndex >= 48,
    ),
  ];
}

function buildEventGravity(locale: UiLocale, macro: MacroIntelligenceBundle): EventGravityField[] {
  return macro.catalysts.map((c, i) => {
    const deformation =
      c.id === "cpi"
        ? pickLocale(locale, "CPI gravity expansion — breakeven skew distorts field.", "Расширение гравитации CPI — перекос брейкивенов искажает поле.")
        : c.id === "fomc"
          ? pickLocale(locale, "FOMC instability field — policy path repricing.", "Поле нестабильности FOMC — переоценка пути политики.")
          : pickLocale(locale, "NFP volatility acceleration — labor pulse deforms participation.", "Ускорение волатильности NFP — трудовой импульс деформирует участие.");
    return {
      id: c.id,
      label: c.label,
      distortion: c.tensionPct,
      read: c.instabilityNote,
      deformation,
      x: 70,
      y: 6 + i * 13,
      w: 26,
      h: 11,
    };
  });
}

function layoutGlobalNarrativeCanvas(
  fields: readonly PressureFieldCell[],
  events: readonly EventGravityField[],
  divergences: readonly SentimentDivergence[],
): {
  pressureFields: PressureFieldCell[];
  eventGravity: EventGravityField[];
  divergences: SentimentDivergence[];
} {
  const laidFields = layoutSpatialItems(
    fields.map((f) => ({ ...f, priority: f.emphasis })),
    { gap: 3 },
  );

  const overlayRects = [
    ...events.map((e) => ({
      id: `ev-${e.id}`,
      x: e.x,
      y: e.y,
      w: e.w,
      h: e.h,
      priority: 88,
    })),
    ...divergences.map((d) => ({
      id: `div-${d.id}`,
      x: d.x,
      y: d.y,
      w: d.w,
      h: d.h,
      priority: 72,
    })),
    ...laidFields.map((f) => ({
      id: `field-${f.id}`,
      x: f.x,
      y: f.y,
      w: f.w,
      h: f.h,
      priority: f.emphasis,
    })),
  ];

  const resolved = resolveSpatialLayout(overlayRects, { gap: 2.5 });
  const byId = new Map(resolved.map((r) => [r.id, r] as const));

  return {
    pressureFields: laidFields.map((f) => {
      const r = byId.get(`field-${f.id}`);
      return r ? { ...f, x: r.x, y: r.y, w: r.w, h: r.h } : f;
    }),
    eventGravity: events.map((e) => {
      const r = byId.get(`ev-${e.id}`);
      return r ? { ...e, x: r.x, y: r.y, w: r.w, h: r.h } : e;
    }),
    divergences: divergences.map((d) => {
      const r = byId.get(`div-${d.id}`);
      return r
        ? { ...d, x: r.x, y: r.y, w: r.w, h: r.h }
        : { ...d, x: 4, y: 78, w: 52, h: 9 };
    }),
  };
}

function buildDivergences(
  locale: UiLocale,
  latent: LatentDrivers,
  derived: DerivedCognitionSnapshot,
  sentiment: SentimentIntelligenceBundle,
): Omit<SentimentDivergence, "x" | "y" | "w" | "h">[] {
  const out: Omit<SentimentDivergence, "x" | "y" | "w" | "h">[] = [];
  const push = (id: string, en: string, ru: string, severity: SentimentDivergence["severity"]) =>
    out.push({ id, line: pickLocale(locale, en, ru), severity });

  if (latent.sentimentThermal >= 65 && derived.divergenceIndex >= 48) {
    push(
      "opt-part",
      "Narrative optimism diverging from participation quality.",
      "Оптимизм нарратива расходится с качеством участия.",
      "elevated",
    );
  }
  if (latent.positioningPressure >= 68 && latent.macroLiquidityBackdrop >= 58 && latent.liquidityStructuralStress >= 55) {
    push(
      "pos-macro",
      "Aggressive positioning beneath macro fragility.",
      "Агрессивное позиционирование под макро-хрупкостью.",
      "critical",
    );
  }
  if (latent.sentimentThermal >= 60 && latent.liquidityStructuralStress >= 62) {
    push(
      "bull-sponsor",
      "Bullish narrative despite sponsorship decay.",
      "Бычий нарратив при распаде спонсорства.",
      "elevated",
    );
  }
  if (derived.divergenceIndex >= 52) {
    push("div-expand", sentiment.sentimentDivergence, sentiment.sentimentDivergence, "elevated");
  }
  return out.slice(0, 6);
}

function buildTransmissions(
  locale: UiLocale,
  latent: LatentDrivers,
  derived: DerivedCognitionSnapshot,
  history: readonly CognitiveSnapshot[],
): CrossAssetTransmission[] {
  const cross = deriveCrossAssetIntelligenceBundle(locale, latent, derived, history);
  const nodes: { id: string; asset: string; x: number; y: number }[] = [
    { id: "dxy", asset: "DXY", x: 12, y: 22 },
    { id: "yields", asset: pickLocale(locale, "Yields", "Доходности"), x: 28, y: 38 },
    { id: "eq", asset: pickLocale(locale, "Equities", "Акции"), x: 48, y: 28 },
    { id: "btc", asset: "BTC", x: 62, y: 48 },
    { id: "oil", asset: pickLocale(locale, "Oil", "Нефть"), x: 78, y: 32 },
    { id: "vix", asset: pickLocale(locale, "Vol index", "Индекс волы"), x: 86, y: 58 },
    { id: "bonds", asset: pickLocale(locale, "Bonds", "Облигации"), x: 22, y: 62 },
  ];

  const rel = cross.relations.slice(0, 4);
  return rel.map((r, i) => {
    const from = nodes[i % nodes.length]!;
    const to = nodes[(i + 2) % nodes.length]!;
    return {
      id: r.id,
      asset: `${from.asset} → ${to.asset}`,
      fromX: from.x,
      fromY: from.y,
      toX: to.x,
      toY: to.y,
      read: r.structuralRead,
      intensity: r.tensionPct,
    };
  });
}

function buildStoryBeats(
  locale: UiLocale,
  latent: LatentDrivers,
  derived: DerivedCognitionSnapshot,
  macro: MacroIntelligenceBundle,
  sentiment: SentimentIntelligenceBundle,
): MarketStoryBeat[] {
  const beats: MarketStoryBeat[] = [];
  const push = (id: string, en: string, ru: string, emphasis: number) =>
    beats.push({ id, line: pickLocale(locale, en, ru), emphasis: clamp(emphasis) });

  if (latent.macroLiquidityBackdrop >= 62 && latent.positioningPressure < 55) {
    push(
      "dxy-spec",
      "Dollar strength suppressing speculative aggression.",
      "Сила доллара подавляет спекулятивную агрессию.",
      72,
    );
  }
  if (latent.sentimentThermal >= 62 && derived.divergenceIndex >= 45) {
    push(
      "opt-div",
      "Narrative optimism diverging from participation quality.",
      "Оптимизм нарратива расходится с качеством участия.",
      68,
    );
  }
  if (latent.macroLiquidityBackdrop >= 58 && derived.divergenceIndex >= 46) {
    push(
      "macro-instab",
      "Macro-sensitive instability increasing beneath continuation.",
      "Макро-чувствительная нестабильность растёт под продолжением.",
      70,
    );
  }
  if (derived.volTone === "expanding") {
    push(
      "vol-cpi",
      "Volatility expectations expanding into catalyst window.",
      "Ожидания волатильности расширяются в окно катализатора.",
      65,
    );
  }
  push("regime", macro.regime.headline, macro.regime.headline, macro.regime.pressurePct);
  push("narr", sentiment.narrativeTension.headline, sentiment.narrativeTension.headline, sentiment.narrativeTension.tensionPct);

  return beats.slice(0, 6);
}

function buildReplay(
  locale: UiLocale,
  history: readonly CognitiveSnapshot[],
  macroRegime: GlobalMacroRegimeId,
  narrativeRegime: NarrativeRegimeId,
): NarrativeReplayFrame[] {
  if (history.length < 3) {
    return [
      {
        tick: 0,
        macroRegime,
        narrativeRegime,
        storyLine: pickLocale(locale, "Narrative baseline — awaiting history depth.", "Базовый нарратив — ждём глубину истории."),
      },
    ];
  }
  const step = Math.max(1, Math.floor(history.length / 8));
  const frames: NarrativeReplayFrame[] = [];
  for (let i = 0; i < history.length; i += step) {
    const snap = history[i]!;
    const next = history[Math.min(history.length - 1, i + step)];
    let storyLine = pickLocale(locale, "Global pressure stable", "Глобальное давление стабильно");
    if (next && next.positioningPressure > snap.positioningPressure + 6) {
      storyLine = pickLocale(locale, "Crowd psychology heating — emotional contagion rising.", "Психология толпы нагревается — растёт эмоциональная зараза.");
    } else if (next && next.liquidityStructuralStress > snap.liquidityStructuralStress + 5) {
      storyLine = pickLocale(locale, "Policy reaction — liquidity stress propagating.", "Реакция на политику — распространяется стресс ликвидности.");
    } else if (next && next.divergenceIndex > snap.divergenceIndex + 5) {
      storyLine = pickLocale(locale, "Narrative shift — consensus fracture widening.", "Сдвиг нарратива — расширяется разлом консенсуса.");
    } else if (next && next.dangerBand !== snap.dangerBand) {
      storyLine = pickLocale(locale, "Volatility escalation — risk appetite migrating.", "Эскалация волатильности — миграция аппетита к риску.");
    }
    frames.push({ tick: snap.simTick, macroRegime, narrativeRegime, storyLine });
  }
  return frames.slice(-8);
}

function buildCrossLinks(locale: UiLocale): string[] {
  return [
    pickLocale(locale, "Execution surface reacts to macro/sentiment convergence.", "Поверхность исполнения реагирует на сходимость макро/настроений."),
    pickLocale(locale, "Agents interpret narrative fractures in war room.", "Агенты прочитывают разломы нарратива в зале."),
    pickLocale(locale, "Cross-asset desk tracks transmission arcs.", "Кросс-активный стол следит за дугами передачи."),
  ];
}

export function deriveGlobalNarrativeBundle(args: {
  locale: UiLocale;
  latent: LatentDrivers;
  derived: DerivedCognitionSnapshot;
  history: readonly CognitiveSnapshot[];
  simTick: number;
  lens?: GlobalNarrativeLens;
}): GlobalNarrativeBundle {
  const { locale, latent, derived, history, simTick, lens = "unified" } = args;

  const macro = deriveMacroIntelligenceBundle(locale, latent, derived, simTick);
  const sentiment = deriveSentimentIntelligenceBundle(locale, latent, derived);

  const macroRegime = resolveMacroRegime(locale, latent, derived, macro);
  const narrativeRegime = resolveNarrativeRegime(locale, latent, derived, sentiment);

  const pressurePct = Math.max(macro.regime.pressurePct, sentiment.narrativeTension.tensionPct);
  const tension: GlobalNarrativeBundle["tension"] =
    pressurePct >= 78 || derived.dangerBand === "critical"
      ? "critical"
      : pressurePct >= 58 || derived.dangerBand === "elevated"
        ? "elevated"
        : "calm";

  const primaryState =
    lens === "sentiment"
      ? narrativeRegime.headline
      : lens === "macro"
        ? macroRegime.headline
        : pickLocale(locale, `${macroRegime.headline} · ${narrativeRegime.headline}`, `${macroRegime.headline} · ${narrativeRegime.headline}`);

  const primarySubline =
    lens === "sentiment"
      ? narrativeRegime.detail
      : lens === "macro"
        ? macroRegime.detail
        : pickLocale(
            locale,
            latent.positioningPressure >= 62 && latent.macroLiquidityBackdrop <= 52
              ? "Late BTC continuation — macro pressure and thinning depth share one regime."
              : "Global narrative pressure engine — regime evolution in real time.",
            latent.positioningPressure >= 62 && latent.macroLiquidityBackdrop <= 52
              ? "Позднее продление BTC — макро-давление и истончение глубины в одном режиме."
              : "Глобальный движок нарративного давления — эволюция режима в реальном времени.",
          );

  const divergencesSeed = buildDivergences(locale, latent, derived, sentiment).map((d, i) => ({
    ...d,
    x: 4,
    y: clamp(78 - i * 11, 6, 88),
    w: 52,
    h: 9,
  }));
  const { pressureFields, eventGravity, divergences } = layoutGlobalNarrativeCanvas(
    buildPressureFields(locale, latent, derived, macro, sentiment),
    buildEventGravity(locale, macro),
    divergencesSeed,
  );
  const transmissions = buildTransmissions(locale, latent, derived, history);
  const storyBeats = buildStoryBeats(locale, latent, derived, macro, sentiment);
  const replay = buildReplay(locale, history, macroRegime.id, narrativeRegime.id);

  const narrativeAcceleration = clamp(
    latent.sentimentThermal * 0.35 + derived.divergenceIndex * 0.4 + (derived.volTone === "expanding" ? 12 : 0),
  );
  const macroInstability = clamp(macro.regime.pressurePct * 0.6 + latent.volatilityImpulse * 0.35);
  const geoStress = clamp(latent.volatilityImpulse * 0.5 + latent.macroLiquidityBackdrop * 0.25);

  return {
    lens,
    macroRegime,
    narrativeRegime,
    primaryState,
    primarySubline,
    tension,
    pressureFields,
    eventGravity,
    divergences,
    transmissions,
    storyBeats,
    replay,
    crossLinks: buildCrossLinks(locale),
    breathPhase: (simTick % 44) / 44,
    narrativeAcceleration,
    macroInstability,
    geoStress,
    simTick,
    macro,
    sentiment,
  };
}
