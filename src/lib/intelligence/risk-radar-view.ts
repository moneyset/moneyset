import type { CognitiveSnapshot } from "@/lib/simulation/cognition-types";
import type { DerivedCognitionSnapshot } from "@/lib/simulation/engine-evolve";
import type { LatentDrivers, MarketPhaseId } from "@/lib/simulation/cognition-types";
import { pickLocale } from "@/lib/i18n/cognition-dict";
import type { UiLocale } from "@/store/ui-prefs-store";

function clampPct(n: number): number {
  return Math.max(12, Math.min(94, Math.round(n)));
}

function slope(values: readonly number[]): number {
  if (values.length < 2) return 0;
  const a = values[0]!;
  const b = values[values.length - 1]!;
  return (b - a) / Math.max(1, values.length - 1);
}

export type RiskConditionCard = Readonly<{
  id: string;
  headline: string;
  structuralRead: string;
  executionImplication: string;
  tensionPct: number;
}>;

export type RiskRadarBundle = Readonly<{
  conditions: readonly RiskConditionCard[];
  evolution: readonly string[];
  fieldNote: string;
  deskFootnote: string;
}>;

function fragilePhase(p: MarketPhaseId): boolean {
  return p === "fragile_continuation" || p === "distribution_phase" || p === "liquidity_compression" || p === "panic_risk";
}

export function deriveRiskRadarBundle(
  locale: UiLocale,
  latent: LatentDrivers,
  derived: DerivedCognitionSnapshot,
  history: readonly CognitiveSnapshot[],
): RiskRadarBundle {
  const pp = latent.positioningPressure;
  const liq = latent.liquidityStructuralStress;
  const vi = latent.volatilityImpulse;
  const st = latent.sentimentThermal;
  const m = latent.macroLiquidityBackdrop;
  const div = derived.divergenceIndex;
  const phase = derived.phase;

  const conditions: RiskConditionCard[] = [];

  if (fragilePhase(phase) || derived.dangerBand === "elevated" || derived.dangerBand === "dangerous") {
    conditions.push({
      id: "continuation_fragile",
      headline: pickLocale(locale, "Continuation structurally fragile", "Продолжение структурно хрупко"),
      structuralRead: pickLocale(
        locale,
        "Phase and stress bands imply sponsorship handoffs — invalidation sensitivity elevated without alarmism.",
        "Фаза и полосы стресса — смены спонсорства; чувствительность к инвалидации выше, без паники.",
      ),
      executionImplication: pickLocale(
        locale,
        "Execution: favor defense-first sizing until reclaim quality stabilizes.",
        "Исполнение: защита размера, пока качество откупа не стабилизируется.",
      ),
      tensionPct: clampPct(derived.dangerScore * 0.55 + (fragilePhase(phase) ? 18 : 8)),
    });
  }

  if (st >= 72 || phase === "overheated_momentum") {
    conditions.push({
      id: "participation_hot",
      headline: pickLocale(locale, "Participation overheating", "Перегрев участия"),
      structuralRead: pickLocale(
        locale,
        "Crowding proxy elevated — continuation valid only while liquidity absorbs two-sided probing.",
        "Скопление в прокси выше — продолжение валидно, пока ликвидность держит двусторонний зонд.",
      ),
      executionImplication: pickLocale(
        locale,
        "Execution: reduce initiation aggression; prefer responsive liquidity.",
        "Исполнение: меньше инициации; ответная ликвидность.",
      ),
      tensionPct: clampPct(st * 0.62 + div * 0.22),
    });
  }

  if (pp >= 74) {
    conditions.push({
      id: "leverage_concentration",
      headline: pickLocale(locale, "Leverage concentration elevated", "Концентрация плеча повышена"),
      structuralRead: pickLocale(
        locale,
        "Positioning stress field loading — unwind paths widen if sponsorship thins.",
        "Поле стресса позиции — пути разжима шире при истончении спонсорства.",
      ),
      executionImplication: pickLocale(
        locale,
        "Execution: avoid stacking into thin extensions; monitor flow depth.",
        "Исполнение: без наслоения в тонкие продолжения; глубина потока.",
      ),
      tensionPct: clampPct(pp * 0.58 + liq * 0.28),
    });
  }

  if (derived.volTone === "compressing" && m >= 56 && vi >= 48) {
    conditions.push({
      id: "compression_expansion",
      headline: pickLocale(locale, "Volatility compression nearing expansion risk", "Сжатие волы у риска расширения"),
      structuralRead: pickLocale(
        locale,
        "Macro-sensitive coil — first directional acceptance likely to transmit across books quickly.",
        "Макро-чувствительный змеевик — первое направленное принятие быстро передаётся по книгам.",
      ),
      executionImplication: pickLocale(
        locale,
        "Execution: favor clean-break validation; avoid mid-range conviction.",
        "Исполнение: валидация чистого выхода; без уверенности в середине диапазона.",
      ),
      tensionPct: clampPct(vi * 0.4 + m * 0.35 + (100 - derived.consensusSpreadPct) * 0.2),
    });
  }

  if (m >= 70 && derived.consensus === "macro_dominance_rising") {
    conditions.push({
      id: "macro_sensitive",
      headline: pickLocale(locale, "Macro-sensitive instability expanding", "Макро-чувствительная нестабильность расширяется"),
      structuralRead: pickLocale(
        locale,
        "Policy and liquidity path dominates microstructure — execution quality becomes release-dependent.",
        "Путь политики и ликвидности доминирует микроструктуру — качество исполнения от релизов.",
      ),
      executionImplication: pickLocale(
        locale,
        "Execution: tighten event windows; prioritize structural invalidation over narrative.",
        "Исполнение: ужать окна событий; инвалидация важнее нарратива.",
      ),
      tensionPct: clampPct(m * 0.5 + div * 0.38),
    });
  }

  if (div >= 46 && derived.consensus === "consensus_weakening") {
    conditions.push({
      id: "sponsorship_weak",
      headline: pickLocale(locale, "Sponsorship coherence weakening", "Связность спонсорства слабеет"),
      structuralRead: pickLocale(
        locale,
        "Hidden divergence risk — views splitting faster than headline vol suggests.",
        "Скрытый риск разноса — мнения расходятся быстрее, чем видимая вола.",
      ),
      executionImplication: pickLocale(
        locale,
        "Execution: favor two-sided probes; single-direction conviction costly.",
        "Исполнение: двусторонние зонды; односторонняя уверенность дорога.",
      ),
      tensionPct: clampPct(div * 0.85 + vi * 0.12),
    });
  }

  if (conditions.length === 0) {
    conditions.push({
      id: "stable",
      headline: pickLocale(locale, "Structural risk field contained", "Поле структурного риска сдержано"),
      structuralRead: pickLocale(
        locale,
        "No acute fragility cluster — monitor standard stress migration and session transitions.",
        "Нет острого кластера хрупкости — стандартная миграция стресса и сессии.",
      ),
      executionImplication: pickLocale(
        locale,
        "Execution: base discipline unchanged — size to established invalidation structure.",
        "Исполнение: базовая дисциплина; размер к заданной инвалидации.",
      ),
      tensionPct: clampPct(36 + derived.dangerScore * 0.22),
    });
  }

  const evolution: string[] = [];
  if (history.length >= 10) {
    const sl = history.slice(-10);
    const ds = slope(sl.map((h) => h.dangerScore));
    const ddiv = slope(sl.map((h) => h.divergenceIndex));
    const dpp = slope(sl.map((h) => h.positioningPressure));
    const dliq = slope(sl.map((h) => h.liquidityStructuralStress));
    if (ddiv > 0.35) {
      evolution.push(
        pickLocale(locale, "Crowding / divergence gradually increasing in window.", "Скопление / разнос ползут вверх в окне."),
      );
    } else if (ddiv < -0.35) {
      evolution.push(
        pickLocale(locale, "Sponsorship slowly repairing — divergence compressing.", "Спонсорство мягко чинится — разнос сжимается."),
      );
    }
    if (ds > 0.4) {
      evolution.push(
        pickLocale(locale, "Volatility instability expanding vs prior desk state.", "Нестабильность волы расширяется к прошлому состоянию."),
      );
    } else if (ds < -0.35) {
      evolution.push(
        pickLocale(locale, "Stress field easing — tail validity contracting slowly.", "Поле стресса слабеет — хвосты сужаются."),
      );
    }
    if (dliq > 0.5) {
      evolution.push(
        pickLocale(
          locale,
          "Liquidity stress gradient steepening — macro-sensitive instability channel opening.",
          "Градиент стресса ликвидности круче — канал макро-чувствительной нестабильности.",
        ),
      );
    }
    if (dpp > 0.5) {
      evolution.push(
        pickLocale(locale, "Leverage / participation pressure building gradually in window.", "Давление плеча / участия нарастает в окне."),
      );
    }
  }
  if (evolution.length === 0) {
    evolution.push(
      pickLocale(
        locale,
        "Risk evolution quiet — no material hidden drift detected in the sampled window.",
        "Эволюция риска спокойна — существенного скрытого дрейфа в окне нет.",
      ),
    );
  }

  const fieldNote = pickLocale(
    locale,
    "Instability bands reflect structural pressure composition — not a fear index or retail sentiment meter.",
    "Полосы нестабильности — состав давления, а не индекс страха или розничный метр.",
  );

  const deskFootnote = pickLocale(
    locale,
    "Risk Radar evaluates latent fragility and transmission — calm institutional read, not headline catastrophizing.",
    "Risk Radar оценивает латентную хрупкость и передачу — спокойное институциональное чтение.",
  );

  return {
    conditions: conditions.slice(0, 6),
    evolution: evolution.slice(0, 3),
    fieldNote,
    deskFootnote,
  };
}
