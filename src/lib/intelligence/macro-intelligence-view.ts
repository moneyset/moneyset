import type { DerivedCognitionSnapshot } from "@/lib/simulation/engine-evolve";
import type { LatentDrivers } from "@/lib/simulation/cognition-types";
import { pickLocale } from "@/lib/i18n/cognition-dict";
import type { UiLocale } from "@/store/ui-prefs-store";

export type MacroRegimeView = Readonly<{
  headline: string;
  pressurePct: number;
  detail: string;
  executionImplication: string;
}>;

export type CatalystWindowView = Readonly<{
  id: "cpi" | "fomc" | "nfp";
  label: string;
  tensionPct: number;
  instabilityNote: string;
  executionImplication: string;
}>;

export type MacroIntelligenceBundle = Readonly<{
  regime: MacroRegimeView;
  catalysts: readonly CatalystWindowView[];
  ratesLiquidity: string;
  yieldBehavior: string;
  centralBankPosture: string;
  inflationRead: string;
  historicalAnalogs: readonly string[];
}>;

function clampPct(n: number): number {
  return Math.max(8, Math.min(100, Math.round(n)));
}

function regimeFromState(
  locale: UiLocale,
  latent: LatentDrivers,
  derived: DerivedCognitionSnapshot,
): MacroRegimeView {
  const m = latent.macroLiquidityBackdrop;
  const liq = 100 - latent.liquidityStructuralStress;
  const pressurePct = clampPct(m * 0.55 + derived.divergenceIndex * 0.35 + (derived.volTone === "expanding" ? 12 : 0));

  if (
    latent.positioningPressure >= 62 &&
    latent.liquidityStructuralStress >= 58 &&
    latent.volatilityImpulse <= 52 &&
    m <= 52
  ) {
    return {
      headline: pickLocale(locale, "Yield pressure vs extension", "Давление доходности против продления"),
      pressurePct: clampPct((100 - m) * 0.55 + derived.divergenceIndex * 0.4),
      detail: pickLocale(
        locale,
        "Rates and duration sensitivity rising while BTC holds late continuation — macro fragility under headline strength.",
        "Чувствительность к ставкам и дюрации растёт, пока BTC держит позднее продолжение — макро-хрупкость под силой заголовков.",
      ),
      executionImplication: pickLocale(
        locale,
        "Execution: treat extension as conditional — macro shock can reprice liquidity faster than structure updates.",
        "Исполнение: продление условно — макро-шок переоценивает ликвидность быстрее, чем обновляется структура.",
      ),
    };
  }

  if (m >= 68 && derived.consensus === "macro_dominance_rising") {
    return {
      headline: pickLocale(locale, "Macro-led liquidity supportive", "Макро-ликвидность поддерживает"),
      pressurePct,
      detail: pickLocale(
        locale,
        "Backdrop strong vs micro participation — repricing risk concentrates into catalysts.",
        "Сильный фон против микро-участия — риск переоценки концентрируется у катализаторов.",
      ),
      executionImplication: pickLocale(
        locale,
        "Execution: favor acceptance proofs; avoid naked breakout aggression into known windows.",
        "Исполнение: важнее доказательства принятия; без голого агрессивного пробоя в известные окна.",
      ),
    };
  }
  if (m <= 42 && latent.volatilityImpulse >= 58) {
    return {
      headline: pickLocale(locale, "Tightening pressure rising", "Растёт давление ужесточения"),
      pressurePct,
      detail: pickLocale(
        locale,
        "Liquidity conditions fragile near resistance — volatility-sensitive environment.",
        "Ликвидность хрупка у сопротивления — среда чувствительна к волатильности.",
      ),
      executionImplication: pickLocale(
        locale,
        "Execution: reduce breakout aggression; widen invalidation awareness.",
        "Исполнение: снизить агрессию пробоев; расширить контроль инвалидации.",
      ),
    };
  }
  if (derived.dangerBand === "elevated" || derived.dangerBand === "dangerous") {
    return {
      headline: pickLocale(locale, "Macro uncertainty elevated", "Повышена макро-неопределённость"),
      pressurePct,
      detail: pickLocale(
        locale,
        "Cross-asset volatility expectations lifting — risk appetite deteriorating.",
        "Ожидания кросс-волатильности растут — аппетит к риску слабеет.",
      ),
      executionImplication: pickLocale(
        locale,
        "Execution: prioritize size discipline and sponsorship checks.",
        "Исполнение: дисциплина размера и проверка спонсорства в приоритете.",
      ),
    };
  }
  return {
    headline: pickLocale(locale, "Balanced macro volatility envelope", "Сбалансированный макро-конверт волатильности"),
    pressurePct,
    detail: pickLocale(
      locale,
      `Liquidity backdrop ${liq >= 52 ? "stable" : "thin"} vs structural stress — monitoring catalyst sensitivity.`,
      `Фон ликвидности ${liq >= 52 ? "стабилен" : "тонок"} к структурному стрессу — мониторинг чувствительности к катализаторам.`,
    ),
    executionImplication: pickLocale(
      locale,
      "Execution: base path intact — monitor participation depth through releases.",
      "Исполнение: базовый путь держится — участие в релизах отслеживать.",
    ),
  };
}

function catalysts(
  locale: UiLocale,
  latent: LatentDrivers,
  derived: DerivedCognitionSnapshot,
  simTick: number,
): readonly CatalystWindowView[] {
  const baseTension = clampPct(latent.volatilityImpulse * 0.45 + derived.divergenceIndex * 0.5 + latent.macroLiquidityBackdrop * 0.12);
  const phase = simTick % 11;

  const cpiT = clampPct(baseTension + (phase < 4 ? 14 : 0));
  const fomcT = clampPct(baseTension + (phase >= 4 && phase < 8 ? 16 : 2));
  const nfpT = clampPct(baseTension + (phase >= 8 ? 12 : 4));

  return [
    {
      id: "cpi",
      label: pickLocale(locale, "CPI window", "Окно CPI"),
      tensionPct: cpiT,
      instabilityNote: pickLocale(
        locale,
        "Inflation surprise risk skews breakevens — participation thins into print.",
        "Риск сюрприза по инфляции сдвигает брейкивены — участие редеет к печати.",
      ),
      executionImplication: pickLocale(
        locale,
        "Breakout aggression reduced during pre-event compression.",
        "Агрессия пробоев снижена в пре-событийном сжатии.",
      ),
    },
    {
      id: "fomc",
      label: pickLocale(locale, "FOMC volatility envelope", "Конверт волатильности FOMC"),
      tensionPct: fomcT,
      instabilityNote: pickLocale(
        locale,
        "Policy path repricing expands tails — liquidity migrates defensively.",
        "Переоценка пути политики расширяет хвосты — ликвидность уходит в защиту.",
      ),
      executionImplication: pickLocale(
        locale,
        "Execution: treat expansions as conditional until post-decision acceptance.",
        "Исполнение: расширения условны до принятия после решения.",
      ),
    },
    {
      id: "nfp",
      label: pickLocale(locale, "NFP participation instability", "Нестабильность участия NFP"),
      tensionPct: nfpT,
      instabilityNote: pickLocale(
        locale,
        "Labor pulse can distort flow leadership intraday.",
        "Трудовой импульс может исказить ведение потока внутри дня.",
      ),
      executionImplication: pickLocale(
        locale,
        "Execution: avoid one-sided leverage into thin depth around release.",
        "Исполнение: избегать одностороннего плеча в тонкой глубине у релиза.",
      ),
    },
  ];
}

export function deriveMacroIntelligenceBundle(
  locale: UiLocale,
  latent: LatentDrivers,
  derived: DerivedCognitionSnapshot,
  simTick: number,
): MacroIntelligenceBundle {
  const regime = regimeFromState(locale, latent, derived);
  const cat = catalysts(locale, latent, derived, simTick);

  const ratesLiquidity = pickLocale(
    locale,
    `Rates path: ${latent.macroLiquidityBackdrop >= 58 ? "hawkish skew embedded" : "neutral corridor"} · Liquidity: ${latent.liquidityStructuralStress >= 64 ? "fragile" : "controlled"}.`,
    `Ставки: ${latent.macroLiquidityBackdrop >= 58 ? "заложен уклон в ужесточение" : "нейтральный коридор"} · Ликвидность: ${latent.liquidityStructuralStress >= 64 ? "хрупкая" : "контролируемая"}.`,
  );

  const yieldBehavior = pickLocale(
    locale,
    latent.positioningPressure >= 62 && latent.macroLiquidityBackdrop <= 52 && derived.volTone === "compressing"
      ? "Yield pressure rising while BTC vol compresses — duration shocks transmit before spot structure updates."
      : derived.volTone === "compressing"
        ? "Yield volatility suppressed — curve trades as compression until catalyst."
        : "Yield volatility active — curve reprices participation quickly.",
    latent.positioningPressure >= 62 && latent.macroLiquidityBackdrop <= 52 && derived.volTone === "compressing"
      ? "Давление доходности растёт при сжатой воле BTC — шоки дюрации передаются раньше структуры."
      : derived.volTone === "compressing"
        ? "Волатильность доходностей сжата — кривая как сжатие до катализатора."
        : "Волатильность доходностей активна — кривая быстро переоценивает участие.",
  );

  const centralBankPosture = pickLocale(
    locale,
    latent.macroLiquidityBackdrop >= 62
      ? "Central bank posture: tightening bias dominant in lattice."
      : latent.macroLiquidityBackdrop <= 44
        ? "Central bank posture: easing bias supportive for risk carry."
        : "Central bank posture: mixed — data-dependence elevated.",
    latent.macroLiquidityBackdrop >= 62
      ? "Поза ЦБ: в решётке доминирует уклон к ужесточению."
      : latent.macroLiquidityBackdrop <= 44
        ? "Поза ЦБ: уклон к смягчению поддерживает риск-кэрри."
        : "Поза ЦБ: смешанная — зависимость от данных выше.",
  );

  const inflationRead = pickLocale(
    locale,
    `Inflation impulse proxy: ${latent.volatilityImpulse >= 60 ? "re-acceleration risk" : "contained"} — watch CPI sensitivity.`,
    `Прокси импульса инфляции: ${latent.volatilityImpulse >= 60 ? "риск реускорения" : "сдержан"} — следить за чувствительностью к CPI.`,
  );

  const historicalAnalogs: string[] = [];
  if (derived.volTone === "compressing" && latent.macroLiquidityBackdrop >= 55) {
    historicalAnalogs.push(
      pickLocale(
        locale,
        "Analog: prior hawkish repricing during inflation compression phases.",
        "Аналог: прошлые ястребьи переоценки в фазах сжатия инфляции.",
      ),
    );
  }
  if (latent.liquidityStructuralStress >= 66) {
    historicalAnalogs.push(
      pickLocale(
        locale,
        "Analog: historical liquidity stress when breadth diverged from macro.",
        "Аналог: исторический стресс ликвидности при расхождении ширины и макро.",
      ),
    );
  }
  if (historicalAnalogs.length === 0) {
    historicalAnalogs.push(
      pickLocale(
        locale,
        "No strong historical analog flagged — regime within normal dispersion.",
        "Сильный исторический аналог не выделен — режим в нормальной дисперсии.",
      ),
    );
  }

  return {
    regime,
    catalysts: cat,
    ratesLiquidity,
    yieldBehavior,
    centralBankPosture,
    inflationRead,
    historicalAnalogs: historicalAnalogs.slice(0, 3),
  };
}
