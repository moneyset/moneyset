import type { CognitiveSnapshot } from "@/lib/simulation/cognition-types";
import type { UiLocale } from "@/store/ui-prefs-store";
import { pickLocale } from "@/lib/i18n/cognition-dict";

/** Wall interval between cognition advances — keep in sync with `COGNITION_SIMULATION_TICK_MS` in the simulation store. */
const COGNITION_TICK_MS = 3400;

export type LiveTemporalSurface = Readonly<{
  /** Wall-clock span of the sampled history window (approximate). */
  windowLabel: string;
  /** Delta-first lines (max 3). */
  lines: readonly string[];
  /** Lead scenario temporal read when scenario slope is meaningful. */
  scenarioTemporalLine: string | null;
  /** Optional session / overlap framing (UTC). */
  sessionLine: string | null;
  stressSeries: readonly number[];
  participationSeries: readonly number[];
  liquiditySeries: readonly number[];
  volSeries: readonly number[];
  scenarioSeries: readonly number[];
}>;

function windowMinutes(oldest: CognitiveSnapshot, newest: CognitiveSnapshot): number {
  const dTick = Math.max(0, newest.simTick - oldest.simTick);
  return Math.max(1, Math.round((dTick * COGNITION_TICK_MS) / 60_000));
}

function windowLabel(locale: UiLocale, oldest: CognitiveSnapshot, newest: CognitiveSnapshot): string {
  const m = windowMinutes(oldest, newest);
  return pickLocale(locale, `Recent evolution · ~${m}m`, `Недавняя динамика · ~${m} мин`);
}

function slope(series: readonly number[]): number {
  if (series.length < 2) return 0;
  const a = series[0]!;
  const b = series[series.length - 1]!;
  return (b - a) / Math.max(1, series.length - 1);
}

function classify(s: number): "rising" | "falling" | "flat" {
  if (s > 0.42) return "rising";
  if (s < -0.42) return "falling";
  return "flat";
}

/** UTC buckets — coarse desk framing, not exchange calendars. */
export function utcSessionEvolutionLine(locale: UiLocale): string | null {
  const h = new Date().getUTCHours();
  if (h >= 0 && h < 7) {
    return pickLocale(
      locale,
      "Asia session — depth can thin; continuation quality more conditional.",
      "Азия — глубина реже; качество продолжения условнее.",
    );
  }
  if (h >= 7 && h < 13) {
    return pickLocale(
      locale,
      "London window — participation breadth tends to expand.",
      "Лондон — ширина участия обычно расширяется.",
    );
  }
  if (h >= 13 && h < 16) {
    return pickLocale(
      locale,
      "EU/US overlap — liquidity and vol transitions often accelerate here.",
      "Перекрытие EU/US — здесь чаще ускоряются ликвидность и вол.",
    );
  }
  if (h >= 16 && h < 22) {
    return pickLocale(
      locale,
      "New York hours — volatility pressure on structure typically rises.",
      "Нью-Йорк — давление волы на структуру обычно выше.",
    );
  }
  return pickLocale(
    locale,
    "Post-NY drift — reclaim and acceptance reads often soften.",
    "После NY — откуп и принятие часто мягче.",
  );
}

function scenarioProb(h: CognitiveSnapshot): number {
  return Number.isFinite(h.leadScenarioProb) ? h.leadScenarioProb : 50 + (h.dangerScore - 50) * 0.15;
}

export function deriveLiveTemporalSurface(
  locale: UiLocale,
  history: readonly CognitiveSnapshot[],
): LiveTemporalSurface {
  if (history.length < 2) {
    const v = history[0]?.dangerScore ?? 50;
    const pad = [v, v];
    return {
      windowLabel: pickLocale(locale, "Warming history…", "Копим историю…"),
      lines: [],
      scenarioTemporalLine: null,
      sessionLine: utcSessionEvolutionLine(locale),
      stressSeries: pad,
      participationSeries: pad,
      liquiditySeries: pad,
      volSeries: pad,
      scenarioSeries: pad,
    };
  }

  const slice = history.slice(-18);
  const oldest = slice[0]!;
  const newest = slice[slice.length - 1]!;

  const stressSeries = slice.map((x) => x.dangerScore);
  const participationSeries = slice.map((x) => x.positioningPressure);
  const liquiditySeries = slice.map((x) => x.liquidityStructuralStress);
  const volSeries = slice.map((x) => x.volatilityImpulse);
  const scenarioSeries = slice.map(scenarioProb);

  const sStress = slope(stressSeries);
  const sPart = slope(participationSeries);
  const sLiq = slope(liquiditySeries);
  const sVol = slope(volSeries);
  const sScen = slope(scenarioSeries);

  type Cand = { w: number; text: string };
  const cands: Cand[] = [];
  let scenarioTemporalLine: string | null = null;

  const stressC = classify(sStress);
  if (stressC === "rising") {
    cands.push({
      w: Math.abs(sStress),
      text: pickLocale(locale, "Stress accelerating vs recent window.", "Стресс ускоряется к недавнему окну."),
    });
  } else if (stressC === "falling") {
    cands.push({
      w: Math.abs(sStress),
      text: pickLocale(locale, "Stress easing vs recent window.", "Стресс сходит к недавнему окну."),
    });
  } else if (Math.abs(newest.dangerScore - oldest.dangerScore) < 2 && newest.dangerScore >= 62) {
    cands.push({
      w: 0.35,
      text: pickLocale(locale, "Stress elevated but stable in window.", "Стресс выше, но стабилен в окне."),
    });
  }

  const partC = classify(sPart);
  if (partC === "rising") {
    cands.push({
      w: Math.abs(sPart),
      text: pickLocale(locale, "Participation pressure building.", "Давление участия нарастает."),
    });
  } else if (partC === "falling") {
    cands.push({
      w: Math.abs(sPart),
      text: pickLocale(locale, "Participation pressure cooling.", "Давление участия охлаждается."),
    });
  } else if (sPart > 0.12) {
    cands.push({
      w: Math.abs(sPart),
      text: pickLocale(locale, "Participation recovering gradually.", "Участие мягко восстанавливается."),
    });
  }

  const liqC = classify(sLiq);
  if (liqC === "rising") {
    cands.push({
      w: Math.abs(sLiq) * 1.05,
      text: pickLocale(locale, "Liquidity strain rising.", "Напряжение ликвидности растёт."),
    });
  } else if (liqC === "falling") {
    cands.push({
      w: Math.abs(sLiq) * 1.05,
      text: pickLocale(locale, "Liquidity strain moderating.", "Напряжение ликвидности слабеет."),
    });
  }

  const volC = classify(sVol);
  if (volC === "rising") {
    cands.push({
      w: Math.abs(sVol),
      text: pickLocale(locale, "Volatility impulse expanding.", "Импульс волы расширяется."),
    });
  } else if (volC === "falling") {
    cands.push({
      w: Math.abs(sVol),
      text: pickLocale(locale, "Volatility compressing in window.", "Вола сжимается в окне."),
    });
  }

  const scC = classify(sScen);
  if (scC === "rising") {
    const text = pickLocale(locale, "Lead scenario strengthening in window.", "Базовый сценарий усиливается в окне.");
    scenarioTemporalLine = text;
    cands.push({
      w: Math.abs(sScen) * 1.1,
      text,
    });
  } else if (scC === "falling") {
    const text = pickLocale(locale, "Lead scenario degrading in window.", "Базовый сценарий слабеет в окне.");
    scenarioTemporalLine = text;
    cands.push({
      w: Math.abs(sScen) * 1.1,
      text,
    });
  }

  cands.sort((a, b) => b.w - a.w);
  const lines = cands.slice(0, 3).map((c) => c.text);

  return {
    windowLabel: windowLabel(locale, oldest, newest),
    lines,
    scenarioTemporalLine,
    sessionLine: utcSessionEvolutionLine(locale),
    stressSeries,
    participationSeries,
    liquiditySeries,
    volSeries,
    scenarioSeries,
  };
}
