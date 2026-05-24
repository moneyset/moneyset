import type { DerivedCognitionSnapshot } from "@/lib/simulation/engine-evolve";
import type { CognitiveSnapshot, LatentDrivers } from "@/lib/simulation/cognition-types";
import { pickLocale } from "@/lib/i18n/cognition-dict";
import { layoutSpatialItems } from "@/lib/layout/spatial-collision-layout";
import type { UiLocale } from "@/store/ui-prefs-store";

export type MapsFieldTone = "neutral" | "stress" | "support";

/** Normalized spatial cell for abstract topology — not price levels. */
export type MapsTopologyCell = Readonly<{
  id: string;
  label: string;
  /** Structural read — not a headline. */
  readLine: string;
  /** 0–100 emphasis (density / tension). */
  emphasis: number;
  /** 0–100 left offset of cell origin. */
  x: number;
  /** 0–100 top offset. */
  y: number;
  /** 0–100 width. */
  w: number;
  /** 0–100 height. */
  h: number;
  tone: MapsFieldTone;
  executionNote: string;
}>;

export type MapsTopologyLayer = Readonly<{
  title: string;
  synopsis: string;
  executionImplication: string;
  cells: readonly MapsTopologyCell[];
}>;

export type MapsTopologyBundle = Readonly<{
  structural: MapsTopologyLayer;
  liquidity: MapsTopologyLayer;
  participation: MapsTopologyLayer;
  imbalance: MapsTopologyLayer;
  volatility: MapsTopologyLayer;
  evolution: MapsTopologyLayer;
}>;

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n));
}

function emphasisFrom(...parts: number[]): number {
  const v = parts.reduce((a, b) => a + b, 0) / parts.length;
  return Math.round(clamp(v, 12, 96));
}

/** Deterministic micro-shift so fields evolve with sim without RNG. */
function drift(simTick: number, seed: number): number {
  return Math.sin((simTick + seed * 11) / 9.5) * 4;
}

function toneFor(stress: number, support: number): MapsFieldTone {
  if (stress >= 68) return "stress";
  if (support >= 62) return "support";
  return "neutral";
}

function layoutMapsCells(cells: readonly MapsTopologyCell[]): MapsTopologyCell[] {
  return layoutSpatialItems(
    cells.map((c) => ({
      ...c,
      priority: c.emphasis,
    })),
    { gap: 3.5 },
  );
}

export function deriveMapsTopologyBundle(
  locale: UiLocale,
  latent: LatentDrivers,
  derived: DerivedCognitionSnapshot,
  history: readonly CognitiveSnapshot[],
  simTick: number,
): MapsTopologyBundle {
  const liq = latent.liquidityStructuralStress;
  const pp = latent.positioningPressure;
  const vi = latent.volatilityImpulse;
  const st = latent.sentimentThermal;
  const mb = latent.macroLiquidityBackdrop;
  const div = derived.divergenceIndex;
  const hot =
    derived.dangerBand === "elevated" || derived.dangerBand === "dangerous" || derived.dangerBand === "critical";

  const structural: MapsTopologyLayer = {
    title: pickLocale(locale, "Structural topology", "Структурная топология"),
    synopsis: pickLocale(
      locale,
      "Abstract geometry of reclaim, compression, expansion, and invalidation — execution-relevant only.",
      "Абстрактная геометрия откупа, сжатия, расширения и снятия — только для исполнения.",
    ),
    executionImplication: pickLocale(
      locale,
      "Execution quality tracks how price interacts with these structural bands, not band labels alone.",
      "Качество исполнения — как цена взаимодействует с полосами, а не сами подписи.",
    ),
    cells: [
      {
        id: "reclaim",
        label: pickLocale(locale, "Reclaim shelf", "Полка откупа"),
        readLine: pickLocale(
          locale,
          "Sponsored acceptance band — responsive flow preferred over impulse chase.",
          "Полоса спонсируемого принятия — реактивный поток вместо погони за импульсом.",
        ),
        emphasis: emphasisFrom(100 - liq * 0.35, pp * 0.45),
        x: clamp(8 + drift(simTick, 1), 4, 18),
        y: clamp(52 + drift(simTick, 2), 38, 62),
        w: clamp(38 + mb * 0.08, 28, 48),
        h: clamp(22 - vi * 0.06, 14, 28),
        tone: toneFor(liq, mb),
        executionNote: pickLocale(
          locale,
          "Favor proofs of reclaim before sizing continuation.",
          "Перед размером продолжения — доказательства откупа.",
        ),
      },
      {
        id: "compression",
        label: pickLocale(locale, "Compression region", "Зона сжатия"),
        readLine: pickLocale(
          locale,
          "Volatility envelope narrowing — breakout aggression deferred until acceptance.",
          "Конверт волатильности сужается — агрессия пробоя отложена до принятия.",
        ),
        emphasis: emphasisFrom(derived.volTone === "compressing" ? 78 : 42, vi * 0.4),
        x: clamp(28 + drift(simTick, 3), 22, 36),
        y: clamp(18 + drift(simTick, 4), 10, 32),
        w: clamp(44 + div * 0.15, 32, 52),
        h: clamp(28 + liq * 0.05, 20, 40),
        tone: derived.volTone === "compressing" ? "support" : "neutral",
        executionNote: pickLocale(
          locale,
          "Execution: reduce extension risk inside the belt.",
          "Исполнение: снизить риск продления внутри пояса.",
        ),
      },
      {
        id: "expansion",
        label: pickLocale(locale, "Expansion path", "Путь расширения"),
        readLine: pickLocale(
          locale,
          "Sponsored expansion corridor — unstable if breadth does not migrate with price.",
          "Коридор спонсируемого расширения — нестабилен, если ширина не мигрирует с ценой.",
        ),
        emphasis: emphasisFrom(vi * 0.55, (hot ? 22 : 0) + pp * 0.25),
        x: clamp(58 + drift(simTick, 5), 48, 68),
        y: clamp(44 + drift(simTick, 6), 32, 58),
        w: clamp(32 + vi * 0.12, 22, 42),
        h: clamp(26 + pp * 0.06, 16, 36),
        tone: toneFor(vi + (hot ? 18 : 0), 0),
        executionNote: pickLocale(
          locale,
          "Treat expansions as conditional until participation confirms.",
          "Расширения условны, пока участие не подтвердит.",
        ),
      },
      {
        id: "pivot",
        label: pickLocale(locale, "Structural pivot", "Структурный пивот"),
        readLine: pickLocale(
          locale,
          "Regime hinge — liquidity and flow leadership can rotate through this locus.",
          "Шарнир режима — ведение ликвидности и потока может вращаться через узел.",
        ),
        emphasis: emphasisFrom(div * 0.65, liq * 0.35),
        x: clamp(50 + drift(simTick, 7), 44, 58),
        y: clamp(66 + drift(simTick, 8), 56, 78),
        w: 16,
        h: 14,
        tone: div >= 48 ? "stress" : "neutral",
        executionNote: pickLocale(
          locale,
          "Invalidation awareness widens when pivot stress rises.",
          "При стрессе пивота шире контроль инвалидации.",
        ),
      },
      {
        id: "continuation",
        label: pickLocale(locale, "Continuation corridor", "Коридор продолжения"),
        readLine: pickLocale(
          locale,
          "Depth-supported drift lane — fragile if passive liquidity thins asymmetrically.",
          "Полоса дрейфа с глубиной — хрупка при асимметричном истонении пассива.",
        ),
        emphasis: emphasisFrom(pp * 0.5, (100 - liq) * 0.35),
        x: 12,
        y: 72,
        w: 76,
        h: 14,
        tone: toneFor(liq, pp),
        executionNote: pickLocale(
          locale,
          "Participation quality matters more than directional bias.",
          "Важнее качество участия, чем направленный уклон.",
        ),
      },
      {
        id: "invalidation",
        label: pickLocale(locale, "Invalidation region", "Зона снятия"),
        readLine: pickLocale(
          locale,
          "Structural thesis removal shell — risk expands non-linearly through boundary.",
          "Оболочка снятия тезиса — риск нелинейно растёт у границы.",
        ),
        emphasis: emphasisFrom(derived.dangerScore * 0.85, hot ? 24 : 0),
        x: 72,
        y: 10,
        w: 22,
        h: 34,
        tone: hot ? "stress" : "neutral",
        executionNote: pickLocale(
          locale,
          "Execution: tighten size and widen invalidation buffers.",
          "Исполнение: ужать размер и расширить буферы снятия.",
        ),
      },
      {
        id: "objective",
        label: pickLocale(locale, "Objective field", "Поле цели"),
        readLine: pickLocale(
          locale,
          "Statistical extension target — low sponsorship turns objective into liquidity vacuum risk.",
          "Статистическое целевое поле — при низком спонсорстве риск вакуума ликвидности.",
        ),
        emphasis: emphasisFrom(pp * 0.4, st * 0.35),
        x: 6,
        y: 8,
        w: 30,
        h: 24,
        tone: st >= 70 ? "stress" : "neutral",
        executionNote: pickLocale(
          locale,
          "Avoid one-sided leverage into thin depth beyond objective band.",
          "Избегать одностороннего плеча в тонкой глубине за полосой цели.",
        ),
      },
    ],
  };

  const liquidity: MapsTopologyLayer = {
    title: pickLocale(locale, "Liquidity pressure", "Давление ликвидности"),
    synopsis: pickLocale(
      locale,
      "Passive depth thinning beneath extension — sweep vulnerability concentrated below reclaim shelves.",
      "Пассивная глубина истончается под продлением — риск сноса сосредоточен ниже полок откупа.",
    ),
    executionImplication: pickLocale(
      locale,
      "Sweep vulnerability and pocket quality directly affect fill quality and slippage geometry.",
      "Уязвимость к сною и качество карманов напрямую влияют на исполнение и проскальзывание.",
    ),
    cells: [
      {
        id: "pocket",
        label: pickLocale(locale, "Liquidity pocket", "Карман ликвидности"),
        readLine: pickLocale(
          locale,
          "Passive depth concentration — absorbs until flow leadership rotates.",
          "Концентрация пассивной глубины — поглощает, пока не сменится ведение потоком.",
        ),
        emphasis: emphasisFrom(liq * 0.45, 100 - pp * 0.2),
        x: 14,
        y: 28,
        w: 36,
        h: 40,
        tone: liq >= 62 ? "stress" : "support",
        executionNote: pickLocale(
          locale,
          "Resting liquidity can vanish ahead of catalysts — plan for air pockets.",
          "Заявленная ликвидность может исчезнуть перед катализаторами — закладывать пустоты.",
        ),
      },
      {
        id: "thin",
        label: pickLocale(locale, "Thin liquidity belt", "Пояс тонкой ликвидности"),
        readLine: pickLocale(
          locale,
          "Low-density traverse — participation stress elevates tail risk on sweeps.",
          "Низкая плотность при проходе — стресс участия поднимает хвост при сносе.",
        ),
        emphasis: emphasisFrom(liq * 0.7, vi * 0.25),
        x: 48,
        y: 20,
        w: 44,
        h: 22,
        tone: "stress",
        executionNote: pickLocale(
          locale,
          "Reduce aggression; prefer reactive acceptance over anticipatory lean.",
          "Меньше агрессии; реактивное принятие вместо опережающего наклона.",
        ),
      },
      {
        id: "leverage",
        label: pickLocale(locale, "Leverage pressure band", "Полоса плечевого давления"),
        readLine: pickLocale(
          locale,
          "Forced-flow geometry sensitive — extension feeds back into liquidity asymmetry.",
          "Геометрия вынужденного потока чувствительна — продление усиливает асимметрию ликвидности.",
        ),
        emphasis: emphasisFrom(pp * 0.65, vi * 0.35),
        x: 22,
        y: 62,
        w: 58,
        h: 20,
        tone: pp >= 72 ? "stress" : "neutral",
        executionNote: pickLocale(
          locale,
          "Liquidation cascades are second-order — first-order is depth evaporation rate.",
          "Каскады ликвидаций вторичны — первична скорость испарения глубины.",
        ),
      },
      {
        id: "sweep",
        label: pickLocale(locale, "Sweep vulnerability", "Уязвимость к сносу"),
        readLine: pickLocale(
          locale,
          "Asymmetric stop / passive imbalance — short-lived dislocations possible.",
          "Асимметрия стопов / пассива — возможны краткие дислокации.",
        ),
        emphasis: emphasisFrom(liq * 0.5, hot ? 35 : 8, div * 0.3),
        x: 62,
        y: 48,
        w: 30,
        h: 36,
        tone: hot ? "stress" : "neutral",
        executionNote: pickLocale(
          locale,
          "Execution: assume false breaks until depth reforms on the other side.",
          "Исполнение: ложные пробои, пока глубина не восстановится с другой стороны.",
        ),
      },
    ],
  };

  const participation: MapsTopologyLayer = {
    title: pickLocale(locale, "Participation density", "Плотность участия"),
    synopsis: pickLocale(
      locale,
      "Breadth and sponsorship migration — quality of participation, not volume hype.",
      "Ширина и миграция спонсорства — качество участия, не хайп объёма.",
    ),
    executionImplication: pickLocale(
      locale,
      "Trend execution quality degrades when density narrows while price extends.",
      "Качество трендового исполнения падает, когда плотность сужается, а цена растягивается.",
    ),
    cells: [
      {
        id: "broaden",
        label: pickLocale(locale, "Broadening participation", "Расширение участия"),
        readLine: pickLocale(
          locale,
          "Multi-pocket sponsorship rising — continuation structurally better supported.",
          "Растёт мультикарманное спонсорство — продолжение структурно лучше поддержано.",
        ),
        emphasis: emphasisFrom(pp * 0.4, (100 - div) * 0.45),
        x: 10,
        y: 22,
        w: 42,
        h: 32,
        tone: pp >= 56 && pp < 72 ? "support" : "neutral",
        executionNote: pickLocale(
          locale,
          "Favor trend acceptance when broadening aligns with reclaim geometry.",
          "Трендовое принятие, когда расширение согласуется с геометрией откупа.",
        ),
      },
      {
        id: "narrow",
        label: pickLocale(locale, "Narrowing activity", "Сужение активности"),
        readLine: pickLocale(
          locale,
          "Participation thins into fewer pockets — fragility rises without immediate reversal.",
          "Участие сжимается в меньше карманов — хрупкость растёт без немедленного разворота.",
        ),
        emphasis: emphasisFrom((100 - pp) * 0.35, liq * 0.45),
        x: 52,
        y: 18,
        w: 40,
        h: 36,
        tone: "stress",
        executionNote: pickLocale(
          locale,
          "Reduce continuation size until sponsorship broadens again.",
          "Снизить размер продолжения, пока спонсорство снова не расширится.",
        ),
      },
      {
        id: "sponsor",
        label: pickLocale(locale, "Sponsorship quality", "Качество спонсорства"),
        readLine: pickLocale(
          locale,
          "Active vs passive balance — passive-heavy tape rejects shallow breakouts.",
          "Баланс актив/пассив — пассивная лента отвергает мелкие пробои.",
        ),
        emphasis: emphasisFrom(mb * 0.35, pp * 0.45, (100 - liq) * 0.25),
        x: 18,
        y: 54,
        w: 50,
        h: 28,
        tone: toneFor(liq, mb),
        executionNote: pickLocale(
          locale,
          "Execution: require flow confirmation on expansion triggers.",
          "Исполнение: нужно подтверждение потока на триггерах расширения.",
        ),
      },
      {
        id: "breadth",
        label: pickLocale(locale, "Breadth stress", "Стресс ширины"),
        readLine: pickLocale(
          locale,
          "Internal participation diverges from surface price — continuation vulnerable.",
          "Внутреннее участие расходится с ценой — продолжение уязвимо.",
        ),
        emphasis: emphasisFrom(div * 0.7, st * 0.3),
        x: 66,
        y: 56,
        w: 28,
        h: 30,
        tone: div >= 44 ? "stress" : "neutral",
        executionNote: pickLocale(
          locale,
          "Watch for sentiment–structure divergence shocks.",
          "Следить за шоками расхождения настроение–структура.",
        ),
      },
    ],
  };

  const imbalance: MapsTopologyLayer = {
    title: pickLocale(locale, "Imbalance geometry", "Геометрия дисбаланса"),
    synopsis: pickLocale(
      locale,
      "Asymmetry corridors and fragile extension — structural instability, not directional arrows.",
      "Коридоры асимметрии и хрупкое продление — структурная нестабильность, не стрелки.",
    ),
    executionImplication: pickLocale(
      locale,
      "Imbalance resolves through liquidity events — size and invalidation must anticipate that path.",
      "Дисбаланс снимается через ликвидностные события — размер и снятие должны это предвосхищать.",
    ),
    cells: [
      {
        id: "corridor",
        label: pickLocale(locale, "Imbalance corridor", "Коридор дисбаланса"),
        readLine: pickLocale(
          locale,
          "One-sided flow dominance — mean reversion risk rises only after sponsorship breaks.",
          "Доминирование одностороннего потока — риск возврата после лома спонсорства.",
        ),
        emphasis: emphasisFrom(Math.abs(pp - st), div * 0.5),
        x: 24,
        y: 30,
        w: 52,
        h: 24,
        tone: Math.abs(pp - st) >= 22 ? "stress" : "neutral",
        executionNote: pickLocale(
          locale,
          "Avoid leaning into corridor extremes without acceptance ladder.",
          "Не наклоняться в экстремумы коридора без лестницы принятия.",
        ),
      },
      {
        id: "asym",
        label: pickLocale(locale, "Structural asymmetry", "Структурная асимметрия"),
        readLine: pickLocale(
          locale,
          "Liquidity offers skewed across axis — sweep path favors the shallow side.",
          "Заявки ликвидности перекошены по оси — снос ближе к стороне тоньше.",
        ),
        emphasis: emphasisFrom(liq * 0.55, div * 0.45),
        x: 8,
        y: 58,
        w: 36,
        h: 28,
        tone: "stress",
        executionNote: pickLocale(
          locale,
          "Execution quality asymmetric — favor the side with reforming depth.",
          "Качество исполнения асимметрично — сторона с восстанавливающейся глубиной.",
        ),
      },
      {
        id: "fragile",
        label: pickLocale(locale, "Fragile extension", "Хрупкое продление"),
        readLine: pickLocale(
          locale,
          "Price outruns participation envelope — negative catalyst sensitivity rises.",
          "Цена опережает конверт участия — растёт чувствительность к негативу.",
        ),
        emphasis: emphasisFrom(pp * 0.55, st * 0.45, vi * 0.2),
        x: 58,
        y: 12,
        w: 34,
        h: 38,
        tone: pp >= 68 && st >= 64 ? "stress" : "neutral",
        executionNote: pickLocale(
          locale,
          "Continuation orders need tighter invalidation and staged size.",
          "Продолжение — жёстче инвалидация и поэтапный размер.",
        ),
      },
      {
        id: "pressureDiv",
        label: pickLocale(locale, "Pressure divergence", "Дивергенция давления"),
        readLine: pickLocale(
          locale,
          "Macro–micro participation disagree — volatility can expand without directional clarity.",
          "Макро и микро участия расходятся — вола может расшириться без ясного направления.",
        ),
        emphasis: emphasisFrom(div * 0.75, vi * 0.25),
        x: 44,
        y: 66,
        w: 46,
        h: 22,
        tone: div >= 50 ? "stress" : "neutral",
        executionNote: pickLocale(
          locale,
          "Prefer conditional structures over conviction bets in divergence bands.",
          "В полосах расхождения — условные конструкции вместо ставок на убеждённость.",
        ),
      },
    ],
  };

  const volatility: MapsTopologyLayer = {
    title: pickLocale(locale, "Volatility evolution", "Эволюция волатильности"),
    synopsis: pickLocale(
      locale,
      "Compression vs expansion envelopes — session-aware structural tension, not VIX cosplay.",
      "Конверты сжатия и расширения — структурное напряжение с учётом сессии, не косплей VIX.",
    ),
    executionImplication: pickLocale(
      locale,
      "Volatility transitions change optimal order style and resting liquidity behavior.",
      "Переходы волатильности меняют стиль ордеров и поведение заявленной ликвидности.",
    ),
    cells: [
      {
        id: "vcomp",
        label: pickLocale(locale, "Compression band", "Полоса сжатия"),
        readLine: pickLocale(
          locale,
          "Energy accumulation — breakout quality matters more than breakout direction.",
          "Накопление энергии — важнее качество пробоя, чем направление.",
        ),
        emphasis: emphasisFrom(derived.volTone === "compressing" ? 80 : 35, (100 - vi) * 0.25),
        x: 16,
        y: 20,
        w: 48,
        h: 34,
        tone: derived.volTone === "compressing" ? "support" : "neutral",
        executionNote: pickLocale(
          locale,
          "Execution: favor mean-revert probes only with clear reclaim; else stand aside into release.",
          "Исполнение: возврат к среднему только с явным откупом; иначе в сторону до релиза.",
        ),
      },
      {
        id: "vexp",
        label: pickLocale(locale, "Expansion acceleration", "Ускорение расширения"),
        readLine: pickLocale(
          locale,
          "Volatility impulse rising — tails fatten faster than consensus reprices.",
          "Импульс волатильности растёт — хвосты толстеют быстрее переоценки консенсуса.",
        ),
        emphasis: emphasisFrom(vi * 0.75, hot ? 20 : 0),
        x: 54,
        y: 44,
        w: 38,
        h: 40,
        tone: derived.volTone === "expanding" ? "stress" : "neutral",
        executionNote: pickLocale(
          locale,
          "Widen bands; prioritize fill quality over perfect entry.",
          "Шире полосы; приоритет исполнения, не идеальный вход.",
        ),
      },
      {
        id: "vpocket",
        label: pickLocale(locale, "Unstable volatility pocket", "Нестабильный карман волы"),
        readLine: pickLocale(
          locale,
          "Localized variance spike risk — liquidity can gap between resting levels.",
          "Риск локального всплеска дисперсии — ликвидность может «провалиться» между уровнями.",
        ),
        emphasis: emphasisFrom(vi * 0.5, liq * 0.45),
        x: 32,
        y: 8,
        w: 28,
        h: 22,
        tone: vi >= 68 ? "stress" : "neutral",
        executionNote: pickLocale(
          locale,
          "Avoid resting stops in known air-pocket geometry.",
          "Не ставить стопы в известной геометрии воздушных карманов.",
        ),
      },
      {
        id: "session",
        label: pickLocale(locale, "Session transition", "Сессионный переход"),
        readLine: pickLocale(
          locale,
          "Leadership migration between pockets — participation depth re-prices quickly.",
          "Миграция ведения между карманами — глубина участия быстро переоценивается.",
        ),
        emphasis: emphasisFrom(42 + (simTick % 17), div * 0.35),
        x: 6,
        y: 48,
        w: 26,
        h: 40,
        tone: "neutral",
        executionNote: pickLocale(
          locale,
          "Execution: expect different micro-structure across session handoff.",
          "Исполнение: ждать другую микроструктуру на передаче сессий.",
        ),
      },
    ],
  };

  const evoLines: string[] = [];
  if (history.length >= 2) {
    const a = history[0]!;
    const b = history[history.length - 1]!;
    if (b.liquidityStructuralStress > a.liquidityStructuralStress + 8) {
      evoLines.push(
        pickLocale(
          locale,
          "Liquidity shifts: structural stress migrated higher over the captured window.",
          "Сдвиг ликвидности: структурный стресс вырос в захваченном окне.",
        ),
      );
    } else if (b.liquidityStructuralStress + 8 < a.liquidityStructuralStress) {
      evoLines.push(
        pickLocale(
          locale,
          "Liquidity shifts: stress eased — depth reforming possible.",
          "Сдвиг ликвидности: стресс ослаб — возможно восстановление глубины.",
        ),
      );
    }
    if (b.positioningPressure > a.positioningPressure + 10) {
      evoLines.push(
        pickLocale(
          locale,
          "Participation deterioration: leverage / crowding built into the lattice path.",
          "Ухудшение участия: плечо/скопление нарастали по пути решётки.",
        ),
      );
    }
    if (b.divergenceIndex > a.divergenceIndex + 8) {
      evoLines.push(
        pickLocale(
          locale,
          "Pressure divergence widening — cross-layer disagreement increasing.",
          "Дивергенция давления шире — растёт разногласие между слоями.",
        ),
      );
    }
    if (b.volatilityImpulse > a.volatilityImpulse + 10) {
      evoLines.push(
        pickLocale(
          locale,
          "Volatility evolution: impulse accumulated — expansion risk rising.",
          "Эволюция волатильности: накопился импульс — риск расширения выше.",
        ),
      );
    }
    if (b.phase !== a.phase) {
      evoLines.push(
        pickLocale(
          locale,
          "Regime evolution: phase migrated — structural interpretation repriced.",
          "Эволюция режима: фаза сменилась — переоценка структурного прочтения.",
        ),
      );
    }
  }
  if (evoLines.length === 0) {
    evoLines.push(
      pickLocale(
        locale,
        "Structural evolution: within normal drift — no major lattice migration flagged.",
        "Эволюция структуры: в пределах нормального дрейфа — крупной миграции решётки нет.",
      ),
    );
  }

  const evolution: MapsTopologyLayer = {
    title: pickLocale(locale, "Structural evolution", "Структурная эволюция"),
    synopsis: pickLocale(
      locale,
      "How topology migrates across the simulation window — reclaim stabilization, pressure migration.",
      "Как топология мигрирует в окне симуляции — стабилизация откупа, миграция давления.",
    ),
    executionImplication: pickLocale(
      locale,
      "Evolution informs whether yesterday’s acceptance geometry still funds today’s execution style.",
      "Эволюция подсказывает, финансирует ли вчерашняя геометрия принятия сегодняшний стиль исполнения.",
    ),
    cells: evoLines.slice(0, 5).map((line, i) => ({
      id: `evo-${i}`,
      label: pickLocale(locale, `Migration trace ${i + 1}`, `След миграции ${i + 1}`),
      readLine: line,
      emphasis: emphasisFrom(55 - i * 6, div * 0.2),
      x: clamp(10 + i * 16 + drift(simTick, 9 + i), 6, 78),
      y: clamp(40 + (i % 2) * 22 + drift(simTick, 10 + i), 28, 72),
      w: clamp(28 + (i % 5) * 2, 26, 38),
      h: 16,
      tone: i === 0 ? "neutral" : "support",
      executionNote: pickLocale(
        locale,
        "Use evolution traces to resize conviction, not to predict exact turns.",
        "Следы эволюции — для размера убеждённости, не для точного прогноза разворота.",
      ),
    })),
  };

  return {
    structural: { ...structural, cells: layoutMapsCells(structural.cells) },
    liquidity: { ...liquidity, cells: layoutMapsCells(liquidity.cells) },
    participation: { ...participation, cells: layoutMapsCells(participation.cells) },
    imbalance: { ...imbalance, cells: layoutMapsCells(imbalance.cells) },
    volatility: { ...volatility, cells: layoutMapsCells(volatility.cells) },
    evolution: { ...evolution, cells: layoutMapsCells(evolution.cells) },
  };
}
