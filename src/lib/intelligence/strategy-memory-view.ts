import type { DerivedCognitionSnapshot } from "@/lib/simulation/engine-evolve";
import type { CognitiveSnapshot, LatentDrivers } from "@/lib/simulation/cognition-types";
import { pickLocale } from "@/lib/i18n/cognition-dict";
import type { UiLocale } from "@/store/ui-prefs-store";

export type StrategyArchetype = Readonly<{
  id: string;
  title: string;
  body: string;
  /** Execution recall — what worked or failed in this archetype. */
  executionRecall: string;
  /** 0–100 pattern resonance with current lattice. */
  resonance: number;
}>;

export type StrategyMemoryBundle = Readonly<{
  intelligenceHeadline: string;
  intelligenceBody: string;
  analogClock: string | null;
  analogNote: string;
  archetypes: readonly StrategyArchetype[];
}>;

function vecFromSnapshot(h: CognitiveSnapshot): readonly number[] {
  return [
    h.positioningPressure,
    h.liquidityStructuralStress,
    h.volatilityImpulse,
    h.divergenceIndex,
    h.dangerScore,
  ];
}

function vecCurrent(latent: LatentDrivers, derived: DerivedCognitionSnapshot): number[] {
  return [
    latent.positioningPressure,
    latent.liquidityStructuralStress,
    latent.volatilityImpulse,
    derived.divergenceIndex,
    derived.dangerScore,
  ];
}

function dist(a: readonly number[], b: readonly number[]): number {
  let s = 0;
  for (let i = 0; i < a.length; i++) s += (a[i]! - b[i]!) ** 2;
  return Math.sqrt(s);
}

function clampResonance(n: number): number {
  return Math.max(8, Math.min(96, Math.round(n)));
}

export function deriveStrategyMemoryBundle(
  locale: UiLocale,
  latent: LatentDrivers,
  derived: DerivedCognitionSnapshot,
  history: readonly CognitiveSnapshot[],
): StrategyMemoryBundle {
  const cur = vecCurrent(latent, derived);
  let best: CognitiveSnapshot | null = null;
  let bestD = Infinity;
  for (const h of history) {
    const d = dist(vecFromSnapshot(h), cur);
    if (d < bestD && h.simTick !== history[history.length - 1]?.simTick) {
      bestD = d;
      best = h;
    }
  }
  const analogClock = best?.simulatedClockLabel ?? null;
  const analogNote =
    best && bestD < 120
      ? pickLocale(
          locale,
          `Nearest prior structural signature at ${best.simulatedClockLabel} — pressure geometry similar, not identical.`,
          `Ближайший прошлый структурный отпечаток на ${best.simulatedClockLabel} — похожая, но не идентичная геометрия давления.`,
        )
      : pickLocale(
          locale,
          "No close historical analog in the captured lattice window — treat as novel structure.",
          "В захваченном окне решётки нет близкого аналога — трактовать как новую структуру.",
        );

  const liq = latent.liquidityStructuralStress;
  const pp = latent.positioningPressure;
  const vi = latent.volatilityImpulse;
  const mb = latent.macroLiquidityBackdrop;
  const div = derived.divergenceIndex;
  const hot =
    derived.dangerBand === "elevated" || derived.dangerBand === "dangerous" || derived.dangerBand === "critical";

  const archetypes: StrategyArchetype[] = [
    {
      id: "reclaim-continuation",
      title: pickLocale(locale, "Reclaim continuation archetype", "Архетип продолжения от откупа"),
      body: pickLocale(
        locale,
        "Acceptance shelf holds while participation broadens — continuation sponsored, not chased.",
        "Полка принятия держится при расширении участия — продолжение со спонсорством, не в погоне.",
      ),
      executionRecall: pickLocale(
        locale,
        "Recall: scale only after reactive flow confirms shelf; avoid opening into compression without breadth.",
        "Память: масштаб после подтверждения полки реактивным потоком; без открытия в сжатие без ширины.",
      ),
      resonance: clampResonance(55 + (100 - liq) * 0.15 - Math.abs(pp - 58) * 0.4),
    },
    {
      id: "sweep-reversal",
      title: pickLocale(locale, "Liquidity sweep reversal", "Разворот после сноса ликвидности"),
      body: pickLocale(
        locale,
        "Thin pocket cleared — depth reforms asymmetrically; false continuation common before stabilization.",
        "Тонкий карман очищен — глубина асимметрично восстанавливается; ложное продолжение до стабилизации.",
      ),
      executionRecall: pickLocale(
        locale,
        "Recall: fade first expansion leg unless reclaim closes with flow sponsorship.",
        "Память: фейд первого расширения, пока откуп не закроется спонсорством потока.",
      ),
      resonance: clampResonance(liq * 0.72 + (hot ? 12 : 0)),
    },
    {
      id: "failed-breakout",
      title: pickLocale(locale, "Failed breakout exhaustion", "Истощение ложного пробоя"),
      body: pickLocale(
        locale,
        "Impulse extension without participation migration — structure rejects acceptance.",
        "Продление импульса без миграции участия — структура отвергает принятие.",
      ),
      executionRecall: pickLocale(
        locale,
        "Recall: tighten invalidation; treat breakout as inventory exit unless breadth confirms.",
        "Память: ужать инвалидацию; пробой как выход из позиции, пока ширина не подтвердит.",
      ),
      resonance: clampResonance(pp * 0.55 + div * 0.35),
    },
    {
      id: "compression-expansion",
      title: pickLocale(locale, "Compression → expansion pattern", "Паттерн сжатие → расширение"),
      body: pickLocale(
        locale,
        "Volatility envelope stored energy then released — execution style must flip with impulse slope.",
        "Конверт волатильности накопил энергию и отпустил — стиль исполнения меняется с наклоном импульса.",
      ),
      executionRecall: pickLocale(
        locale,
        "Recall: narrow bands in compression; widen and prioritize fills in expansion handoff.",
        "Память: узкие полосы в сжатии; расширить и приоритет исполнения на передаче в расширение.",
      ),
      resonance: clampResonance(
        (derived.volTone === "compressing" ? 72 : 40) + vi * 0.22 + (derived.volTone === "expanding" ? 18 : 0),
      ),
    },
    {
      id: "macro-instability",
      title: pickLocale(locale, "Macro instability regime", "Режим макро-нестабильности"),
      body: pickLocale(
        locale,
        "Macro backdrop dominates micro flow — continuation vulnerable to catalyst shocks.",
        "Макро-фон доминирует над микропотоком — продолжение уязвимо к шокам катализаторов.",
      ),
      executionRecall: pickLocale(
        locale,
        "Recall: reduce naked breakout aggression; favor conditional structures around releases.",
        "Память: меньше голого пробоя; условные конструкции вокруг релизов.",
      ),
      resonance: clampResonance(mb * 0.45 + (hot ? 22 : 0) + div * 0.2),
    },
    {
      id: "thin-continuation",
      title: pickLocale(locale, "Thin-liquidity continuation environment", "Продолжение в среде тонкой ликвидности"),
      body: pickLocale(
        locale,
        "Trend sponsored on shallow depth — participation quality determines survival, not direction.",
        "Тренд на мелкой глубине — выживание задаёт качество участия, не направление.",
      ),
      executionRecall: pickLocale(
        locale,
        "Recall: staged size, wider invalidation; assume air pockets on continuation probes.",
        "Память: поэтапный размер, шире снятие; закладывать воздушные карманы на пробах продолжения.",
      ),
      resonance: clampResonance(liq * 0.62 + pp * 0.28),
    },
  ];

  archetypes.sort((a, b) => b.resonance - a.resonance);

  const top = archetypes[0]!;
  const intelligenceHeadline = pickLocale(locale, "Memory intelligence", "Интеллект памяти");

  let intelligenceBody = pickLocale(
    locale,
    `Highest resonance: «${top.title}». ${top.executionRecall}`,
    `Наибольший резонанс: «${top.title}». ${top.executionRecall}`,
  );

  if (liq >= 66 && hot && mb >= 58) {
    intelligenceBody = pickLocale(
      locale,
      "Pattern analog: thin-liquidity continuation under elevated macro uncertainty — compare to the nearest signature in Replay Studio.",
      "Аналог паттерна: продолжение на тонкой ликвидности при повышенной макро-неопределённости — сравните с ближайшим отпечатком в Replay Studio.",
    );
  }

  return {
    intelligenceHeadline,
    intelligenceBody,
    analogClock,
    analogNote,
    archetypes,
  };
}
