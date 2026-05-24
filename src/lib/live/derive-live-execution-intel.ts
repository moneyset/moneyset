import type { NormalizedMarketState } from "@/types/market-state";
import type { DerivedCognitionSnapshot } from "@/lib/simulation/engine-evolve";
import type { LatentDrivers } from "@/lib/simulation/cognition-types";
import { pickLocale } from "@/lib/i18n/cognition-dict";
import { utcSessionEvolutionLine } from "@/lib/cognition/temporal-evolution";
import type { UiLocale } from "@/store/ui-prefs-store";
import type { LiveBehaviorRead, LiveEmphasisId, LiveExecutionIntel } from "@/lib/live/live-intel-types";

type Args = Readonly<{
  locale: UiLocale;
  market: Pick<
    NormalizedMarketState,
    "price" | "markPrice" | "realizedVol" | "momentum" | "fundingRate" | "openInterest" | "connection" | "ts"
  >;
  derived: Pick<DerivedCognitionSnapshot, "dangerBand" | "volTone" | "phase" | "divergenceIndex">;
  latent: Pick<LatentDrivers, "liquidityStructuralStress" | "positioningPressure" | "volatilityImpulse">;
}>;

function behaviorRead(args: Args): LiveBehaviorRead {
  const { derived, latent } = args;
  if (derived.dangerBand === "critical" || derived.dangerBand === "dangerous") return "defensive";
  if (derived.volTone === "expanding" && latent.volatilityImpulse >= 52) return "expansion_vulnerable";
  if (derived.divergenceIndex >= 52 && derived.volTone !== "compressing") return "continuation_fragile";
  if (latent.positioningPressure >= 62 && derived.volTone === "compressing") return "reactive_favored";
  if (derived.volTone === "compressing" && derived.dangerBand === "elevated") return "reactive_favored";
  return "measured";
}

function emphasis(args: Args): { id: LiveEmphasisId; line: string } {
  const { locale, market, derived, latent } = args;

  if (market.connection === "stale" || market.connection === "disconnected") {
    return {
      id: "stable_field",
      line: pickLocale(locale, "Tape link degraded — execution reads conditional.", "Связь с лентой слаба — прочтение условно."),
    };
  }

  if (derived.dangerBand === "critical" || derived.dangerBand === "dangerous") {
    return {
      id: "liquidity_instability",
      line: pickLocale(locale, "Liquidity instability dominates — defensive shelves widen.", "Доминирует нестабильность ликвидности — полки шире."),
    };
  }

  if (latent.liquidityStructuralStress >= 62) {
    return {
      id: "reclaim_stress",
      line: pickLocale(locale, "Reclaim quality under stress — sponsorship fragile.", "Откуп под стрессом — спонсорство хрупкое."),
    };
  }

  if (typeof market.fundingRate === "number" && market.fundingRate >= 0.00085) {
    return {
      id: "funding_carry",
      line: pickLocale(locale, "Funding carry elevated — continuation taxes breadth.", "Кэрри по фандингу выше — продолжение дороже по ширине."),
    };
  }

  if (derived.volTone === "expanding") {
    return {
      id: "vol_transition",
      line: pickLocale(locale, "Volatility transition active — timing sensitivity up.", "Переход волы активен — выше чувствительность тайминга."),
    };
  }

  if (derived.volTone === "compressing") {
    return {
      id: "compression_coil",
      line: pickLocale(locale, "Compression strengthening — breakout discipline tight.", "Сжатие усиливается — дисциплина пробоя жёстче."),
    };
  }

  if (derived.divergenceIndex >= 48) {
    return {
      id: "sponsorship_soft",
      line: pickLocale(locale, "Sponsorship softening — primary path less stable.", "Спонсорство слабеет — базовый путь менее стабилен."),
    };
  }

  const mom = market.momentum;
  if (typeof mom === "number" && (mom >= 38 || mom <= -38)) {
    return {
      id: "participation_shift",
      line: pickLocale(locale, "Participation shift — responsive execution bias surfaces.", "Сдвиг участия — всплывает реактивный уклон."),
    };
  }

  return {
    id: "stable_field",
    line: pickLocale(locale, "Stable execution field — emphasis rotational, not idle.", "Стабильное поле — акцент ротируется, не простой."),
  };
}

function secondary(args: Args): string | null {
  const { locale, derived, latent } = args;
  if (latent.positioningPressure >= 58 && derived.dangerBand === "elevated") {
    return pickLocale(locale, "Breadth: elevated participation pressure.", "Ширина: повышенное давление участия.");
  }
  if (derived.phase === "liquidity_compression" || derived.phase === "fragile_continuation") {
    return pickLocale(locale, "Regime: fragile continuation / liquidity coil.", "Режим: хрупкое продолжение / ликвидностная катушка.");
  }
  return null;
}

function behaviorLine(locale: UiLocale, b: LiveBehaviorRead): string {
  const m: Record<LiveBehaviorRead, { en: string; ru: string }> = {
    defensive: { en: "Behavior: defensive — reduce aggression surface.", ru: "Поведение: защита — снижать агрессию." },
    measured: { en: "Behavior: measured — honor invalidation first.", ru: "Поведение: мера — сначала снятие." },
    reactive_favored: {
      en: "Behavior: reactive favored — acceptance gates continuation.",
      ru: "Поведение: реактив — принятие воротами продолжения.",
    },
    continuation_fragile: {
      en: "Behavior: continuation fragile — size to divergence.",
      ru: "Поведение: продолжение хрупко — размер к дивергенции.",
    },
    expansion_vulnerable: { en: "Behavior: expansion vulnerable — avoid chase.", ru: "Поведение: расширение уязвимо — без погони." },
  };
  return pickLocale(locale, m[b].en, m[b].ru);
}

export function deriveLiveExecutionIntel(args: Args): LiveExecutionIntel {
  const { locale, market, derived, latent } = args;
  const em = emphasis(args);
  const b = behaviorRead(args);
  const sec = secondary(args);
  const sessionLine = utcSessionEvolutionLine(locale) ?? pickLocale(locale, "Session: UTC desk rhythm.", "Сессия: ритм UTC.");
  const fundingElevated =
    typeof market.fundingRate === "number" && Number.isFinite(market.fundingRate) && market.fundingRate >= 0.00085
      ? 1
      : 0;
  const sig = [
    locale,
    market.connection,
    fundingElevated,
    derived.phase,
    em.id,
    b,
    derived.volTone,
    derived.dangerBand,
    Math.round(latent.liquidityStructuralStress),
    Math.round(latent.positioningPressure),
  ].join("|");

  return {
    signature: sig,
    emphasisId: em.id,
    emphasisLine: em.line,
    behavior: b,
    behaviorLine: behaviorLine(locale, b),
    sessionLine,
    secondaryLine: sec,
  };
}
