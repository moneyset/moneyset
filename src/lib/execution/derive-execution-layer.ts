import type { CognitiveSnapshot } from "@/lib/simulation/cognition-types";
import type { LatentDrivers, MarketPhaseId } from "@/lib/simulation/cognition-types";
import type { DerivedCognitionSnapshot } from "@/lib/simulation/engine-evolve";
import { clamp, isLateContinuationRegime } from "@/lib/simulation/engine-evolve";

/** Keep in sync with `COGNITION_SIMULATION_TICK_MS` / `COGNITION_TICK_MS` in temporal-evolution. */
const COGNITION_TICK_MS = 3400;
import type { ScenarioEngineCard, ScenarioId } from "@/lib/simulation/scenario-engine";
import type { NormalizedMarketState } from "@/types/market-state";
import { deriveLiveTemporalSurface } from "@/lib/cognition/temporal-evolution";
import { pickLocale, scenarioEvolutionStateLabel } from "@/lib/i18n/cognition-dict";
import type { UiLocale } from "@/store/ui-prefs-store";

/**
 * Structural zone taxonomy — labels are interpretation, prices are derived only from:
 * mark/last, realized-vol proxy (or latent vol impulse fallback), momentum, phase, lead scenario.
 */
export type ExecutionStructuralZoneKind =
  | "acceptance"
  | "reclaim"
  | "liquidity_lower"
  | "liquidity_upper"
  | "compression"
  | "expansion_trigger"
  | "breakdown_trigger"
  | "objective"
  | "extension";

export type ExecutionStructuralZone = Readonly<{
  kind: ExecutionStructuralZoneKind;
  /** Sorted numeric band — both from same formula, never hand-picked levels. */
  low: number;
  high: number;
  microLine: string;
  /** Institutional ladder title — not a trade signal. */
  ladderTitle: string;
  /** Why this band matters structurally. */
  ladderImportance: string;
  /** Execution framing — posture relative to this shelf. */
  ladderFraming: string;
}>;

export type ExecutionMicroCognition = Readonly<{
  liquidityStress: number;
  participationPressure: number;
  structuralCoherence: number;
  volImpulse: number;
}>;

export type ExecutionBiasVariant =
  | "defensive_posture"
  | "aggression_reduced"
  | "expansion_vulnerable"
  | "reclaim_required"
  | "continuation_strengthening"
  | "favor_responsive_long"
  | "favor_responsive_short"
  | "measured_neutral";

export type ExecutionLayerSurface = Readonly<{
  symbol: string;
  /** Mark preferred, else last — null if tape absent. */
  anchorPrice: number | null;
  hasTape: boolean;
  /** Large operational headline — anchor interpretation (not trade instruction). */
  executionHeadline: string;
  /** Dominant structural path copy (from lead scenario or phase fallback). */
  primaryPath: string;
  executionPosture: string;
  invalidation: string;
  invalidationPressure: readonly string[];
  evolutionHeadline: string;
  evolutionLines: readonly string[];
  sessionLine: string | null;
  /** Subtle continuation / defense read — not trade instructions. */
  continuationRead: string;
  zones: readonly ExecutionStructuralZone[];
  stressSeries: readonly number[];
  liquiditySeries: readonly number[];
  volSeries: readonly number[];
  participationSeries: readonly number[];
  scenarioSeries: readonly number[];
  /** Coherence proxy: higher when divergence lower — same window as temporal surface. */
  stabilitySeries: readonly number[];
  /** Coherence / participation / stress / path blend — cadence signature (same window). */
  cadenceSeries: readonly number[];
  /** Lead path weight slope — for premium pulse hint. */
  scenarioWeightDelta: number;
  volTone: DerivedCognitionSnapshot["volTone"];
  dangerBand: DerivedCognitionSnapshot["dangerBand"];
  /** Footnote for trust — documents inputs to band math. */
  derivationNote: string;
  /** Why bands / emphasis shifted — transparency lines (max 2). */
  structuralRationale: readonly string[];
  /** Live micro-depth signals for environmental rail cognition (0–100 scalars). */
  microCognition: ExecutionMicroCognition;
  /** Compact execution bias — framing, not instructions. */
  executionBiasLabel: string;
  executionBiasVariant: ExecutionBiasVariant;
  /** Second-ranked temporal shift for live transition read (null if none). */
  railTransitionLine: string | null;
  /** Premium-only continuity lines from the logged structural window (empty when history thin). */
  structuralMemoryLines: readonly string[];
  /** Premium-only execution resolution — micro-states, not trade instructions. */
  executionDepthLines: readonly string[];
}>;

export function formatPriceRange(locale: UiLocale, low: number, high: number): string {
  const ref = Math.max(Math.abs(low), Math.abs(high));
  const decimals = ref >= 100_000 ? 0 : ref >= 1_000 ? 1 : 2;
  const a = low.toLocaleString(locale === "ru" ? "ru-RU" : "en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  const b = high.toLocaleString(locale === "ru" ? "ru-RU" : "en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  return `${a} – ${b}`;
}

function phaseDir(phase: MarketPhaseId): -1 | 0 | 1 {
  if (phase === "panic_risk" || phase === "distribution_phase" || phase === "liquidity_compression") return -1;
  if (phase === "controlled_trend" || phase === "stable_expansion" || phase === "fragile_continuation") return 1;
  return 0;
}

function scenarioDir(id: ScenarioId): -1 | 0 | 1 {
  if (
    id === "Structural Breakdown Risk" ||
    id === "Distribution Phase" ||
    id === "Momentum Exhaustion"
  ) {
    return -1;
  }
  if (
    id === "Controlled Bullish Expansion" ||
    id === "Risk Reset Expansion" ||
    id === "Fragile Breakout Structure"
  ) {
    return 1;
  }
  if (id === "Liquidity Sweep Before Continuation" || id === "Volatility Compression") return 0;
  return 0;
}

function momentumDir(m: number | null): -1 | 0 | 1 {
  if (m === null || !Number.isFinite(m)) return 0;
  if (m >= 14) return 1;
  if (m <= -14) return -1;
  return 0;
}

function resolveDir(args: {
  momentum: number | null;
  phase: MarketPhaseId;
  scenarioId: ScenarioId | null;
}): -1 | 0 | 1 {
  const md = momentumDir(args.momentum);
  if (md !== 0) return md;
  const sd = args.scenarioId ? scenarioDir(args.scenarioId) : 0;
  if (sd !== 0) return sd;
  const pd = phaseDir(args.phase);
  if (pd !== 0) return pd;
  return 0;
}

function fallbackPrimaryPath(locale: UiLocale, derived: DerivedCognitionSnapshot, latent: LatentDrivers): string {
  if (derived.volTone === "compressing") {
    return pickLocale(
      locale,
      "Compression before directional acceptance — first clean break leads validity.",
      "Сжатие до направленного принятия — ведёт первый чистый выход.",
    );
  }
  if (derived.volTone === "expanding") {
    return pickLocale(
      locale,
      "Expansion against structure — invalidation bands widen until reclaim stabilizes.",
      "Расширение против структуры — полоса снятия шире, пока откуп не стабилен.",
    );
  }
  if (latent.liquidityStructuralStress >= 62) {
    return pickLocale(
      locale,
      "Liquidity-sweep path competes with continuation — reclaim proof required.",
      "Путь сноса конкурирует с базой — нужен доказанный откуп.",
    );
  }
  return pickLocale(
    locale,
    "Controlled continuation path — conditional on participation and depth.",
    "Контролируемое продолжение — условно от участия и глубины.",
  );
}

function fallbackPosture(locale: UiLocale, derived: DerivedCognitionSnapshot): string {
  if (derived.dangerBand === "critical" || derived.dangerBand === "dangerous") {
    return pickLocale(locale, "Aggression reduced — invalidation-first posture.", "Агрессия ниже — сначала снятие тезиса.");
  }
  if (derived.dangerBand === "elevated") {
    return pickLocale(locale, "Smaller sizing while stress elevated; reactive entries preferred.", "Меньше объём при стрессе; входы реактивнее.");
  }
  if (derived.volTone === "compressing") {
    return pickLocale(locale, "Patience favored — avoid mid-range chase inside the coil.", "Терпение; без погони в середине сжатия.");
  }
  return pickLocale(locale, "Measured continuation bias — honor structure failure lines.", "Сдержанный уклон в базу — держать линии срыва структуры.");
}

function zoneMicro(
  locale: UiLocale,
  kind: ExecutionStructuralZoneKind,
  derived: DerivedCognitionSnapshot,
  latent: LatentDrivers,
): string {
  const hot =
    derived.dangerBand === "elevated" ||
    derived.dangerBand === "dangerous" ||
    derived.dangerBand === "critical";
  const thin = latent.liquidityStructuralStress >= 58 || derived.consensusSpreadPct <= 52;

  switch (kind) {
    case "acceptance":
      if (hot && thin) {
        return pickLocale(
          locale,
          "Buyers losing efficiency near extremes — keep size inside the shell.",
          "Покупатель теряет эффективность у экстремумов — объём внутри оболочки.",
        );
      }
      if (derived.volTone === "compressing") {
        return pickLocale(locale, "Two-sided acceptance — breakout quality still unproven.", "Двустороннее принятие — качество пробоя не доказано.");
      }
      return pickLocale(locale, "Reclaim acceptance read improving only if depth holds.", "Принятие откупа — только если держится глубина.");

    case "reclaim":
      return pickLocale(
        locale,
        "Structural defense band — failed reclaim expands opposite-path validity.",
        "Зона защиты — срыв откупа расширяет противоположный путь.",
      );
    case "liquidity_lower":
    case "liquidity_upper":
      return pickLocale(
        locale,
        "Liquidity pocket — sweep risk concentrates before clean continuation.",
        "Карман ликвидности — риск сноса до чистого продолжения.",
      );
    case "compression":
      return pickLocale(
        locale,
        "Compression boundary — vol expansion against this shell stresses structure.",
        "Граница сжатия — расширение волы против оболочки давит на структуру.",
      );
    case "expansion_trigger":
      return pickLocale(
        locale,
        "Expansion trigger — continuation activates on sustained acceptance beyond here.",
        "Триггер расширения — продолжение при устойчивом принятии выше/ниже.",
      );
    case "breakdown_trigger":
      return pickLocale(
        locale,
        "Breakdown confirmation band — structure failure if acceptance is lost through here.",
        "Подтверждение сноса — срыв структуры при потере принятия через полосу.",
      );
    case "objective":
      return pickLocale(
        locale,
        "Structural extension objective — not a guarantee; validity requires flow.",
        "Структурная цель расширения — не гарантия; нужен поток.",
      );
    case "extension":
      return pickLocale(
        locale,
        "Extension range — low conviction unless participation broadens with price.",
        "Диапазон экстеншена — низкая убеждённость без ширины с ценой.",
      );
  }
}

function executionZoneLadderTitle(locale: UiLocale, kind: ExecutionStructuralZoneKind, dir: -1 | 0 | 1): string {
  switch (kind) {
    case "acceptance":
      if (dir > 0) {
        return pickLocale(locale, "REACTIVE BUY ACCEPTANCE", "РЕАКТИВНОЕ ПРИНЯТИЕ · LONG");
      }
      if (dir < 0) {
        return pickLocale(locale, "REACTIVE SELL ACCEPTANCE", "РЕАКТИВНОЕ ПРИНЯТИЕ · SHORT");
      }
      return pickLocale(locale, "STRUCTURAL SUPPORT SHELF", "СТРУКТУРНАЯ ПОЛКА ОПОРЫ");
    case "reclaim":
      return pickLocale(locale, "RECLAIM ZONE", "ЗОНА ОТКУПА");
    case "liquidity_lower":
      return pickLocale(locale, "LIQUIDITY SWEEP ZONE · LOWER", "ЗОНА СНОСА ЛИКВИДНОСТИ · НИЗ");
    case "liquidity_upper":
      return pickLocale(locale, "LIQUIDITY SWEEP ZONE · UPPER", "ЗОНА СНОСА ЛИКВИДНОСТИ · ВЕРХ");
    case "compression":
      return pickLocale(locale, "STRUCTURAL COMPRESSION COIL", "СТРУКТУРНОЕ СЖАТИЕ");
    case "expansion_trigger":
      return pickLocale(locale, "CONTINUATION TRIGGER", "ТРИГГЕР ПРОДОЛЖЕНИЯ");
    case "breakdown_trigger":
      return pickLocale(locale, "INVALIDATION LEVEL", "УРОВЕНЬ ИНВАЛИДАЦИИ");
    case "objective":
      return pickLocale(locale, "TAKE-PROFIT REGION", "РЕГИОН ФИКСАЦИИ");
    case "extension":
      return pickLocale(locale, "TAKE-PROFIT REGION · EXTENSION", "РЕГИОН ФИКСАЦИИ · ЭКСТЕНШЕН");
  }
}

function executionZoneLadderImportance(
  locale: UiLocale,
  kind: ExecutionStructuralZoneKind,
  derived: DerivedCognitionSnapshot,
  latent: LatentDrivers,
): string {
  const hot =
    derived.dangerBand === "elevated" ||
    derived.dangerBand === "dangerous" ||
    derived.dangerBand === "critical";
  switch (kind) {
    case "acceptance":
      return pickLocale(
        locale,
        "Primary live shell — most responsive business clusters here.",
        "Основная живая оболочка — здесь сходится реактивное исполнение.",
      );
    case "reclaim":
      return pickLocale(
        locale,
        "Structural hinge — continuation quality pivots on reclaim behavior.",
        "Структурный шарнир — качество продолжения зависит от откупа.",
      );
    case "liquidity_lower":
    case "liquidity_upper":
      return pickLocale(
        locale,
        "Liquidity geometry — sweep risk concentrates before clean continuation.",
        "Геометрия ликвидности — риск сноса перед чистым продолжением.",
      );
    case "compression":
      return pickLocale(
        locale,
        "Vol coil boundary — expansion validity is decided against this shell.",
        "Граница сжатия — валидность расширения решается относительно оболочки.",
      );
    case "expansion_trigger":
      return hot
        ? pickLocale(
            locale,
            "High-leverage trigger — participation must broaden to validate.",
            "Триггер высокого рычага — нужна ширина участия для валидации.",
          )
        : pickLocale(
            locale,
            "Continuation trigger — sustained acceptance beyond unlocks path.",
            "Триггер продолжения — устойчивое принятие открывает путь.",
          );
    case "breakdown_trigger":
      return pickLocale(
        locale,
        "Invalidation shelf — structure fails if acceptance is lost through here.",
        "Полка снятия — срыв структуры при потере принятия через полосу.",
      );
    case "objective":
      return pickLocale(
        locale,
        "Extension objective — scenario strength, not a price promise.",
        "Цель расширения — сила сценария, не обещание цены.",
      );
    case "extension":
      return pickLocale(
        locale,
        "Outer participation read — thin unless flow confirms alongside price.",
        "Внешнее чтение участия — тонко, пока поток не подтверждает с ценой.",
      );
  }
}

function executionZoneLadderFraming(
  locale: UiLocale,
  kind: ExecutionStructuralZoneKind,
  derived: DerivedCognitionSnapshot,
  latent: LatentDrivers,
  leadCard: ScenarioEngineCard | null,
): string {
  const exec = leadCard?.executionImplication?.trim();
  if (exec && (kind === "acceptance" || kind === "reclaim" || kind === "objective")) {
    const cap = exec.length > 118 ? `${exec.slice(0, 115)}…` : exec;
    return cap;
  }
  if (derived.volTone === "compressing" && (kind === "compression" || kind === "acceptance")) {
    return pickLocale(
      locale,
      "Compression stabilizing — favor reactive fills; avoid mid-range chase.",
      "Сжатие стабилизируется — реактивные заполнения; без погони в середине.",
    );
  }
  if (latent.liquidityStructuralStress >= 60 && (kind === "liquidity_lower" || kind === "liquidity_upper")) {
    return pickLocale(
      locale,
      "Liquidity thinning near structure — size reacts to pocket depth.",
      "Ликвидность истончается у структуры — объём реагирует на глубину кармана.",
    );
  }
  if (derived.volTone === "expanding" && kind === "expansion_trigger") {
    return pickLocale(
      locale,
      "Expansion stress rising — continuation needs broader participation.",
      "Стресс расширения растёт — продолжению нужна шире участие.",
    );
  }
  return pickLocale(
    locale,
    "Honor invalidation shelves first; extension is conditional on flow quality.",
    "Сначала полки снятия; расширение условно качеством потока.",
  );
}

function deriveExecutionBias(args: {
  locale: UiLocale;
  derived: DerivedCognitionSnapshot;
  latent: LatentDrivers;
  dir: -1 | 0 | 1;
  scenarioWeightDelta: number;
  volTone: DerivedCognitionSnapshot["volTone"];
}): { label: string; variant: ExecutionBiasVariant } {
  const { locale, derived, latent, dir, scenarioWeightDelta, volTone } = args;
  const elevated =
    derived.dangerBand === "elevated" || derived.dangerBand === "dangerous" || derived.dangerBand === "critical";
  const hot = derived.dangerBand === "dangerous" || derived.dangerBand === "critical";

  if (derived.dangerBand === "critical") {
    return {
      variant: "defensive_posture",
      label: pickLocale(locale, "Defensive posture active", "Активна защитная поза"),
    };
  }
  if (derived.dangerBand === "dangerous") {
    return {
      variant: "aggression_reduced",
      label: pickLocale(locale, "Aggression reduced", "Агрессия снижена"),
    };
  }
  if (volTone === "expanding" && elevated) {
    return {
      variant: "expansion_vulnerable",
      label: pickLocale(locale, "Expansion vulnerable", "Расширение уязвимо"),
    };
  }
  if (latent.liquidityStructuralStress >= 62 && volTone === "expanding") {
    return {
      variant: "reclaim_required",
      label: pickLocale(locale, "Reclaim structure required", "Нужен устойчивый откуп"),
    };
  }
  if (scenarioWeightDelta > 1.15 && !hot) {
    return {
      variant: "continuation_strengthening",
      label: pickLocale(locale, "Continuation strengthening", "Продолжение усиливается"),
    };
  }
  if (dir > 0 && !elevated) {
    return {
      variant: "favor_responsive_long",
      label: pickLocale(locale, "Favor responsive longs", "Реактивные long в приоритете"),
    };
  }
  if (dir < 0 && !elevated) {
    return {
      variant: "favor_responsive_short",
      label: pickLocale(locale, "Favor responsive shorts", "Реактивные short в приоритете"),
    };
  }
  return {
    variant: "measured_neutral",
    label: pickLocale(locale, "Measured execution read", "Сдержанное исполнение"),
  };
}

function continuationReadLine(locale: UiLocale, dir: -1 | 0 | 1, hasTape: boolean): string {
  if (!hasTape) {
    return pickLocale(
      locale,
      "Connect live tape to anchor bands — no structural prices until mark/last is present.",
      "Подключите ленту для опорных полос — без метки/последней цены уровни не строятся.",
    );
  }
  if (dir > 0) {
    return pickLocale(
      locale,
      "Continuation read strengthens while acceptance holds above the reclaim shell.",
      "Продолжение держится, пока принятие выше оболочки откупа.",
    );
  }
  if (dir < 0) {
    return pickLocale(
      locale,
      "Defense read: continuation weakens if price loses the inner reclaim band.",
      "Защита: продолжение слабеет при потере внутреннего откупа.",
    );
  }
  return pickLocale(
    locale,
    "Two-way tape: favor reactive fills until a side proves acceptance outside compression.",
    "Двусторонне: реактивные заполнения, пока сторона не докажет принятие за сжатием.",
  );
}

function deriveExecutionHeadline(
  locale: UiLocale,
  args: {
    hasTape: boolean;
    dangerBand: DerivedCognitionSnapshot["dangerBand"];
    volTone: DerivedCognitionSnapshot["volTone"];
    dir: -1 | 0 | 1;
    latent: LatentDrivers;
    phase: MarketPhaseId;
  },
): string {
  if (!args.hasTape) {
    return pickLocale(
      locale,
      "Awaiting live mark — the execution rail anchors when mark/last connects.",
      "Ждём живую метку — рейл привязывается при подключении mark/last.",
    );
  }
  if (isLateContinuationRegime(args.latent)) {
    return pickLocale(
      locale,
      "Late continuation on thin depth — reclaim zone defends, sweep zone below remains live.",
      "Позднее продолжение на тонкой глубине — зона откупа держит, зона сноса ниже активна.",
    );
  }
  const thin = args.latent.liquidityStructuralStress >= 60;
  const hot = args.dangerBand === "dangerous" || args.dangerBand === "critical";
  const elevated =
    args.dangerBand === "elevated" || args.dangerBand === "dangerous" || args.dangerBand === "critical";

  if (hot && args.volTone === "expanding") {
    return pickLocale(
      locale,
      "Expansion degrading structure — reclaim and acceptance under pressure.",
      "Расширение давит на структуру — откуп и принятие под давлением.",
    );
  }
  if (thin && elevated && args.volTone === "expanding") {
    return pickLocale(
      locale,
      "Continuation vulnerable near thin liquidity — reactive fills over chase.",
      "Продолжение уязвимо при тонкой ликвидности — реактивность вместо погони.",
    );
  }
  if (args.volTone === "compressing" && args.dir > 0) {
    return pickLocale(
      locale,
      "Reactive continuation favored inside compression — acceptance still unproven.",
      "Реактивное продолжение в сжатии — принятие ещё не доказано.",
    );
  }
  if (!elevated && args.volTone !== "expanding" && args.dir > 0) {
    return pickLocale(
      locale,
      "Reclaim acceptance improving — extension conditional on participation quality.",
      "Откуп и принятие улучшаются — экстеншен условен качеством участия.",
    );
  }
  if (args.dir < 0 && elevated) {
    return pickLocale(
      locale,
      "Defense dominates — invalidation shelves tighten when acceptance fails.",
      "Доминирует защита — полки снятия сжимаются при провале принятия.",
    );
  }
  if (args.phase === "liquidity_compression" || args.volTone === "compressing") {
    return pickLocale(
      locale,
      "Structural coil — liquidity pockets stack ahead of expansion acceptance.",
      "Структурная катушка — карманы ликвидности перед принятием расширения.",
    );
  }
  return pickLocale(
    locale,
    "Measured execution read — honor reclaim failure and objectives under drift.",
    "Сдержанное прочтение — срыв откупа и цели при дрейфе.",
  );
}

function deriveStructuralRationale(
  locale: UiLocale,
  history: readonly CognitiveSnapshot[],
  latent: LatentDrivers,
): readonly string[] {
  const out: string[] = [];
  const h = new Date().getUTCHours();
  if (h >= 13 && h < 17) {
    out.push(
      pickLocale(
        locale,
        "EU/US overlap: band spacing often reprices faster as depth cross-fades.",
        "Перекрытие EU/US: шаг полос чаще пересчитывается при смене глубины.",
      ),
    );
  } else if (h >= 0 && h < 7) {
    out.push(
      pickLocale(
        locale,
        "Asia thinness: defensive shells stay wider until London participation arrives.",
        "Тонкая Азия: защитные оболочки шире до прихода лондонского участия.",
      ),
    );
  } else if (h >= 16 && h < 22) {
    out.push(
      pickLocale(
        locale,
        "NY volatility transition: expansion triggers breathe with impulse pressure.",
        "NY-переход волы: триггеры расширения дышат вместе с импульсом.",
      ),
    );
  }

  if (history.length >= 4) {
    const last = history[history.length - 1]!;
    const prev = history[history.length - 4]!;
    const d = last.dangerScore - prev.dangerScore;
    if (d >= 6) {
      out.push(
        pickLocale(
          locale,
          "Stress stepped up in the logged window — invalidation shelves widened.",
          "Стресс вырос в окне — полки снятия расширены.",
        ),
      );
    } else if (d <= -6) {
      out.push(
        pickLocale(
          locale,
          "Stress eased vs prior window — triggers and objectives re-tightened to vol proxy.",
          "Стресс снизился — триггеры и цели поджаты к прокси волы.",
        ),
      );
    }
  }

  if (out.length === 0) {
    out.push(
      pickLocale(
        locale,
        "Bands rescale with mark/last, vol proxy, momentum, and lead structural path — not external levels.",
        "Полосы пересчитываются от метки, прокси волы, импульса и базового пути — не внешние уровни.",
      ),
    );
  }

  if (latent.liquidityStructuralStress >= 58 && out.length < 2) {
    out.push(
      pickLocale(
        locale,
        "Liquidity strain elevated — pocket geometry widened to reflect sweep risk.",
        "Стресс ликвидности выше — геометрия карманов шире под риск сноса.",
      ),
    );
  }

  return out.slice(0, 2);
}

function leadPathProb(h: CognitiveSnapshot): number {
  return Number.isFinite(h.leadScenarioProb) ? h.leadScenarioProb : 50 + (h.dangerScore - 50) * 0.15;
}

function approxHistoryWindowMinutes(slice: readonly CognitiveSnapshot[]): number {
  if (slice.length < 2) return 0;
  const oldest = slice[0]!;
  const newest = slice[slice.length - 1]!;
  const dTick = Math.max(0, newest.simTick - oldest.simTick);
  return Math.max(1, Math.round((dTick * COGNITION_TICK_MS) / 60_000));
}

/** Continuity across the logged window — premium-only surface. */
function deriveStructuralMemoryLines(
  locale: UiLocale,
  history: readonly CognitiveSnapshot[],
  derived: DerivedCognitionSnapshot,
): readonly string[] {
  const out: string[] = [];
  if (history.length < 4) return out;

  const slice = history.slice(-18);
  const wm = approxHistoryWindowMinutes(slice);
  const first = slice[0]!;
  const last = slice[slice.length - 1]!;
  const divD = last.divergenceIndex - first.divergenceIndex;
  const partD = last.positioningPressure - first.positioningPressure;
  const volD = last.volatilityImpulse - first.volatilityImpulse;

  if (divD >= 5) {
    out.push(
      pickLocale(
        locale,
        `Structural memory · divergence accumulated ~${wm}m — extension quality degraded.`,
        `Память структуры · дивергенция накоплена ~${wm} мин — качество экстеншена ниже.`,
      ),
    );
  } else if (divD <= -5) {
    out.push(
      pickLocale(
        locale,
        `Structural memory · divergence eased ~${wm}m — coherence reinforcement in-window.`,
        `Память структуры · дивергенция снялась ~${wm} мин — усиление связности в окне.`,
      ),
    );
  }

  if (partD <= -6) {
    out.push(
      pickLocale(
        locale,
        `Participation narrowing held ~${wm}m — sponsorship thinner on continuation.`,
        `Сужение участия ~${wm} мин — спонсорство продолжения тоньше.`,
      ),
    );
  } else if (partD >= 6) {
    out.push(
      pickLocale(
        locale,
        `Participation breadth rebuilt ~${wm}m — responsive liquidity returning.`,
        `Ширина участия восстановлена ~${wm} мин — отзывчивая ликвидность возвращается.`,
      ),
    );
  }

  if (volD <= -7 && derived.volTone === "compressing") {
    out.push(
      pickLocale(
        locale,
        "Volatility compressing into overlap — timing sensitivity rising on release.",
        "Вола сжимается в перекрытии — выше чувствительность тайминга к выходу.",
      ),
    );
  }

  const phaseHeld = slice.every((h) => h.phase === last.phase) && slice.length >= 6;
  if (phaseHeld) {
    out.push(
      pickLocale(
        locale,
        "Phase continuity — structural discipline unchanged across recent captures.",
        "Непрерывность фазы — дисциплина структуры без смены в недавних снимках.",
      ),
    );
  }

  return out.slice(0, 4);
}

/** Finer execution resolution — premium-only; conditional framing, not calls. */
function deriveExecutionDepthLines(
  locale: UiLocale,
  derived: DerivedCognitionSnapshot,
  latent: LatentDrivers,
  biasVariant: ExecutionBiasVariant,
  scenarioWeightDelta: number,
): readonly string[] {
  const out: string[] = [];

  if (biasVariant === "reclaim_required") {
    out.push(
      pickLocale(
        locale,
        "Reclaim quality: required — acceptance fragile until sponsorship stabilizes.",
        "Качество откупа: обязательно — принятие хрупко, пока спонсорство не стабилизируется.",
      ),
    );
  }

  if (latent.positioningPressure >= 62) {
    out.push(
      pickLocale(
        locale,
        "Participation sponsorship: crowded tape — timing deterioration on impulse continuation.",
        "Спонсорство участия: плотная лента — деградация тайминга на импульсном продолжении.",
      ),
    );
  }

  if (derived.divergenceIndex >= 48) {
    out.push(
      pickLocale(
        locale,
        "Structural fragility: elevated divergence — extension shelves less trustworthy.",
        "Хрупкость структуры: высокая дивергенция — полки экстеншена менее надёжны.",
      ),
    );
  }

  if (derived.volTone === "expanding") {
    out.push(
      pickLocale(
        locale,
        "Volatility transition pressure: expansion impulse — invalidation paths breathe wider.",
        "Давление перехода волы: импульс расширения — пути снятия шире.",
      ),
    );
  } else if (derived.volTone === "compressing") {
    out.push(
      pickLocale(
        locale,
        "Volatility transition pressure: compression coil — breakout discipline tightens.",
        "Давление перехода волы: сжатая катушка — дисциплина пробоя жёстче.",
      ),
    );
  }

  if (scenarioWeightDelta <= -4) {
    out.push(
      pickLocale(
        locale,
        "Lead path sponsorship: deteriorating — scenario weight rolling against the base case.",
        "Спонсорство базового пути: ослабление — вес сценария уходит от базы.",
      ),
    );
  } else if (scenarioWeightDelta >= 4) {
    out.push(
      pickLocale(
        locale,
        "Lead path sponsorship: strengthening — base case absorbing tape confirmation.",
        "Спонсорство базового пути: усиление — база впитывает подтверждение ленты.",
      ),
    );
  }

  if (latent.liquidityStructuralStress >= 58) {
    out.push(
      pickLocale(
        locale,
        "Liquidity pocket intelligence: strain elevated — sweep geometry widened defensively.",
        "Интеллект карманов: стресс выше — геометрия сноса расширена в защиту.",
      ),
    );
  }

  return out.slice(0, 5);
}

function buildZones(args: {
  locale: UiLocale;
  ref: number;
  u: number;
  dir: -1 | 0 | 1;
  derived: DerivedCognitionSnapshot;
  latent: LatentDrivers;
  leadCard: ScenarioEngineCard | null;
}): ExecutionStructuralZone[] {
  const { locale, ref, u, dir, derived, latent, leadCard } = args;
  const zones: ExecutionStructuralZone[] = [];

  const push = (kind: ExecutionStructuralZoneKind, lo: number, hi: number) => {
    const low = Math.min(lo, hi);
    const high = Math.max(lo, hi);
    zones.push({
      kind,
      low,
      high,
      microLine: zoneMicro(locale, kind, derived, latent),
      ladderTitle: executionZoneLadderTitle(locale, kind, dir),
      ladderImportance: executionZoneLadderImportance(locale, kind, derived, latent),
      ladderFraming: executionZoneLadderFraming(locale, kind, derived, latent, leadCard),
    });
  };

  push("acceptance", ref - 0.22 * u, ref + 0.22 * u);
  push("compression", ref - u, ref + u);

  if (dir > 0) {
    push("reclaim", ref - 0.92 * u, ref - 0.22 * u);
    push("liquidity_lower", ref - 1.85 * u, ref - 0.92 * u);
    push("expansion_trigger", ref + 1.05 * u, ref + 1.22 * u);
    push("breakdown_trigger", ref - 1.22 * u, ref - 1.05 * u);
    push("objective", ref + 1.45 * u, ref + 2.05 * u);
    push("extension", ref + 2.15 * u, ref + 2.95 * u);
  } else if (dir < 0) {
    push("reclaim", ref + 0.22 * u, ref + 0.92 * u);
    push("liquidity_upper", ref + 0.92 * u, ref + 1.85 * u);
    push("expansion_trigger", ref - 1.22 * u, ref - 1.05 * u);
    push("breakdown_trigger", ref + 1.05 * u, ref + 1.22 * u);
    push("objective", ref - 2.05 * u, ref - 1.45 * u);
    push("extension", ref - 2.95 * u, ref - 2.15 * u);
  } else {
    push("reclaim", ref - 0.62 * u, ref + 0.62 * u);
    push("liquidity_lower", ref - 1.55 * u, ref - 0.62 * u);
    push("liquidity_upper", ref + 0.62 * u, ref + 1.55 * u);
    push("expansion_trigger", ref + 1.02 * u, ref + 1.2 * u);
    push("breakdown_trigger", ref - 1.2 * u, ref - 1.02 * u);
    push("objective", ref + 1.42 * u, ref + 1.95 * u);
    push("extension", ref - 1.95 * u, ref - 1.42 * u);
  }

  return zones;
}

/** Vol basis: prefer market realized-vol proxy; fall back to latent impulse (same tape, no orphan numbers). */
function volBasis(realizedVol: number | null, latent: LatentDrivers): number {
  if (typeof realizedVol === "number" && Number.isFinite(realizedVol)) {
    return clamp(realizedVol, 10, 96);
  }
  return clamp(latent.volatilityImpulse, 10, 96);
}

/** Structural cadence — single scalar path for rail signature line (not price). */
function buildCadenceSeries(args: {
  stress: readonly number[];
  participation: readonly number[];
  stability: readonly number[];
  scenario: readonly number[];
}): readonly number[] {
  const { stress, participation, stability, scenario } = args;
  const n = stress.length;
  const out: number[] = [];
  for (let i = 0; i < n; i++) {
    const s = stress[i] ?? 50;
    const p = participation[i] ?? 50;
    const st = stability[i] ?? 50;
    const sc = scenario[i] ?? 50;
    out.push(clamp(0.26 * s + 0.24 * p + 0.32 * st + 0.18 * sc, 6, 97));
  }
  return out;
}

export function deriveExecutionLayerSurface(args: {
  locale: UiLocale;
  market: Pick<NormalizedMarketState, "symbol" | "price" | "markPrice" | "realizedVol" | "momentum">;
  derived: DerivedCognitionSnapshot;
  latent: LatentDrivers;
  history: readonly CognitiveSnapshot[];
  leadCard: ScenarioEngineCard | null;
}): ExecutionLayerSurface {
  const { locale, market, derived, latent, history, leadCard } = args;
  const refRaw = market.markPrice ?? market.price;
  const hasTape = typeof refRaw === "number" && Number.isFinite(refRaw) && refRaw > 0;
  const ref = hasTape ? refRaw : null;

  const temporal = deriveLiveTemporalSurface(locale, history);
  const coh = clamp(100 - derived.divergenceIndex, 6, 98);
  const stabilitySeries =
    history.length < 2
      ? [coh, coh]
      : history.slice(-18).map((h) => clamp(100 - h.divergenceIndex, 6, 98));
  const scenarioWeightDelta =
    temporal.scenarioSeries.length >= 2
      ? temporal.scenarioSeries[temporal.scenarioSeries.length - 1]! - temporal.scenarioSeries[0]!
      : 0;
  const scenarioId = leadCard?.id ?? null;
  const dir = resolveDir({ momentum: market.momentum, phase: derived.phase, scenarioId });

  const vb = volBasis(market.realizedVol, latent);
  const bps = 15 + vb * 0.58;
  const u = hasTape && ref ? ref * (bps / 10_000) : 0;

  const zones = hasTape && ref && u > 0 ? buildZones({ locale, ref, u, dir, derived, latent, leadCard }) : [];

  const primaryPath = leadCard?.structuralPath ?? fallbackPrimaryPath(locale, derived, latent);
  const executionPosture = leadCard?.executionImplication ?? fallbackPosture(locale, derived);
  const invalidation = leadCard?.invalidation ?? pickLocale(locale, "Invalidation loads with lead structural path.", "Снятие тезиса подгружается с базовым путём.");
  const invalidationPressure = leadCard?.invalidationPressure ?? [];

  const evoStateLine = leadCard
    ? scenarioEvolutionStateLabel(locale, leadCard.evolutionState)
    : pickLocale(locale, "Evolution: path stabilizing.", "Эволюция: путь стабилизируется.");

  const evolutionLines = [evoStateLine, ...(temporal.lines[0] ? [temporal.lines[0]!] : [])].slice(0, 2);

  const derivationNote = pickLocale(
    locale,
    "Bands scale from mark/last, vol proxy, momentum, phase, and lead scenario — not external levels.",
    "Полосы от метки/последней, прокси волы, импульса, фазы и базового сценария — не внешние уровни.",
  );

  const executionHeadline = deriveExecutionHeadline(locale, {
    hasTape,
    dangerBand: derived.dangerBand,
    volTone: derived.volTone,
    dir,
    latent,
    phase: derived.phase,
  });
  const structuralRationale = deriveStructuralRationale(locale, history, latent);

  const cadenceSeries = buildCadenceSeries({
    stress: temporal.stressSeries,
    participation: temporal.participationSeries,
    stability: stabilitySeries,
    scenario: temporal.scenarioSeries,
  });

  const microCognition: ExecutionMicroCognition = {
    liquidityStress: clamp(latent.liquidityStructuralStress, 0, 100),
    participationPressure: clamp(latent.positioningPressure, 0, 100),
    structuralCoherence: clamp(100 - derived.divergenceIndex, 0, 100),
    volImpulse: clamp(latent.volatilityImpulse, 0, 100),
  };

  const executionBias = deriveExecutionBias({
    locale,
    derived,
    latent,
    dir,
    scenarioWeightDelta,
    volTone: derived.volTone,
  });
  const railTransitionLine = temporal.lines[1] ?? null;

  const structuralMemoryLines = deriveStructuralMemoryLines(locale, history, derived);
  const executionDepthLines = deriveExecutionDepthLines(
    locale,
    derived,
    latent,
    executionBias.variant,
    scenarioWeightDelta,
  );

  return {
    symbol: market.symbol,
    anchorPrice: ref,
    hasTape,
    executionHeadline,
    primaryPath,
    executionPosture,
    invalidation,
    invalidationPressure,
    evolutionHeadline: temporal.windowLabel,
    evolutionLines,
    sessionLine: temporal.sessionLine,
    continuationRead: continuationReadLine(locale, dir, hasTape),
    zones,
    stressSeries: temporal.stressSeries,
    liquiditySeries: temporal.liquiditySeries,
    volSeries: temporal.volSeries,
    participationSeries: temporal.participationSeries,
    scenarioSeries: temporal.scenarioSeries,
    stabilitySeries,
    cadenceSeries,
    scenarioWeightDelta,
    volTone: derived.volTone,
    dangerBand: derived.dangerBand,
    derivationNote,
    structuralRationale,
    microCognition,
    executionBiasLabel: executionBias.label,
    executionBiasVariant: executionBias.variant,
    railTransitionLine,
    structuralMemoryLines,
    executionDepthLines,
  };
}

/** Tightest band containing the live anchor (inner shell preferred). */
export function zoneContainingPrice(
  zones: readonly ExecutionStructuralZone[],
  price: number,
): ExecutionStructuralZone | null {
  const hits = zones.filter((z) => price >= z.low && price <= z.high);
  if (hits.length === 0) return null;
  return [...hits].sort((a, b) => a.high - a.low - (b.high - b.low))[0] ?? null;
}

export function executionZoneKindLabel(locale: UiLocale, kind: ExecutionStructuralZoneKind): string {
  const m: Record<ExecutionStructuralZoneKind, { en: string; ru: string }> = {
    acceptance: { en: "Acceptance zone", ru: "Зона принятия" },
    reclaim: { en: "Reclaim zone", ru: "Зона откупа" },
    liquidity_lower: { en: "Liquidity zone · lower", ru: "Ликвидность · ниже" },
    liquidity_upper: { en: "Liquidity zone · upper", ru: "Ликвидность · выше" },
    compression: { en: "Compression boundary", ru: "Граница сжатия" },
    expansion_trigger: { en: "Expansion trigger", ru: "Триггер расширения" },
    breakdown_trigger: { en: "Breakdown confirmation", ru: "Подтверждение сноса" },
    objective: { en: "Structural objective", ru: "Структурная цель" },
    extension: { en: "Extension range", ru: "Диапазон экстеншена" },
  };
  return pickLocale(locale, m[kind].en, m[kind].ru);
}

export type ExecutionSparkSeriesKey =
  | "stress"
  | "liquidity"
  | "vol"
  | "participation"
  | "scenario"
  | "stability";

export function sparkProfileForExecutionZone(kind: ExecutionStructuralZoneKind): {
  key: ExecutionSparkSeriesKey;
  tone: "danger" | "warning" | "flow" | "consensus" | "muted";
} {
  switch (kind) {
    case "breakdown_trigger":
      return { key: "stress", tone: "danger" };
    case "liquidity_lower":
    case "liquidity_upper":
      return { key: "liquidity", tone: "warning" };
    case "compression":
      return { key: "vol", tone: "muted" };
    case "expansion_trigger":
      return { key: "vol", tone: "warning" };
    case "reclaim":
      return { key: "stability", tone: "flow" };
    case "acceptance":
      return { key: "participation", tone: "consensus" };
    case "objective":
      return { key: "scenario", tone: "consensus" };
    case "extension":
      return { key: "scenario", tone: "muted" };
  }
}

export function pickSparkSeries(
  surface: Pick<
    ExecutionLayerSurface,
    "stressSeries" | "liquiditySeries" | "volSeries" | "participationSeries" | "scenarioSeries" | "stabilitySeries"
  >,
  key: ExecutionSparkSeriesKey,
): readonly number[] {
  switch (key) {
    case "stress":
      return surface.stressSeries;
    case "liquidity":
      return surface.liquiditySeries;
    case "vol":
      return surface.volSeries;
    case "participation":
      return surface.participationSeries;
    case "scenario":
      return surface.scenarioSeries;
    case "stability":
      return surface.stabilitySeries;
  }
}
