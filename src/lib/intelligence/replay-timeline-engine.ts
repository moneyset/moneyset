import { consensusLabel, pickLocale } from "@/lib/i18n/cognition-dict";
import type { ReplayCinemaFrame } from "@/lib/intelligence/replay-cinema-engine";
import type { CognitiveSnapshot } from "@/lib/simulation/cognition-types";
import type { UiLocale } from "@/store/ui-prefs-store";

export type ReplayTimelineOffset = "T-3" | "T-2" | "T-1" | "NOW";

export type ReplayTimelineSlot = Readonly<{
  offset: ReplayTimelineOffset;
  frameIndex: number;
  timestamp: string;
  tick: number;
  stateChange: string;
  regimeShift: string | null;
  consensusShift: string | null;
  confidenceShift: string | null;
  scenarioChange: string | null;
}>;

export type ReplayMetricDelta = Readonly<{
  from: number;
  to: number;
  direction: "up" | "down" | "flat";
}>;

export type ReplayStateComparison = Readonly<{
  previousOffset: ReplayTimelineOffset | null;
  currentOffset: ReplayTimelineOffset;
  consensus: Readonly<{ from: string; to: string }>;
  risk: ReplayMetricDelta;
  liquidity: ReplayMetricDelta;
  sponsorship: ReplayMetricDelta;
  scenarioWeight: ReplayMetricDelta;
  executionPosture: Readonly<{ from: string; to: string }>;
  structuralSummary: string;
}>;

const OFFSETS: readonly ReplayTimelineOffset[] = ["T-3", "T-2", "T-1", "NOW"];

function metricDirection(from: number, to: number, threshold = 2): ReplayMetricDelta["direction"] {
  if (to - from >= threshold) return "up";
  if (from - to >= threshold) return "down";
  return "flat";
}

function snapAtTick(history: readonly CognitiveSnapshot[], tick: number): CognitiveSnapshot | undefined {
  return history.find((h) => h.simTick === tick);
}

function slotMetadata(
  locale: UiLocale,
  prev: CognitiveSnapshot | undefined,
  cur: CognitiveSnapshot,
): Pick<ReplayTimelineSlot, "stateChange" | "regimeShift" | "consensusShift" | "confidenceShift" | "scenarioChange"> {
  const regimeShift =
    prev && prev.phase !== cur.phase
      ? pickLocale(locale, `${prev.phase} → ${cur.phase}`, `${prev.phase} → ${cur.phase}`)
      : null;

  const consensusShift =
    prev && prev.consensus !== cur.consensus
      ? pickLocale(
          locale,
          `${consensusLabel(locale, prev.consensus)} → ${consensusLabel(locale, cur.consensus)}`,
          `${consensusLabel(locale, prev.consensus)} → ${consensusLabel(locale, cur.consensus)}`,
        )
      : null;

  const confidenceShift =
    prev && Math.abs(cur.divergenceIndex - prev.divergenceIndex) >= 4
      ? pickLocale(
          locale,
          `Divergence ${prev.divergenceIndex} → ${cur.divergenceIndex}`,
          `Расхождение ${prev.divergenceIndex} → ${cur.divergenceIndex}`,
        )
      : prev
        ? pickLocale(locale, "Conviction stable", "Убеждённость стабильна")
        : pickLocale(locale, "Baseline capture", "Базовый захват");

  const scenarioChange =
    prev && Math.abs(cur.leadScenarioProb - prev.leadScenarioProb) >= 6
      ? pickLocale(
          locale,
          `Path weight ${prev.leadScenarioProb}% → ${cur.leadScenarioProb}%`,
          `Вес пути ${prev.leadScenarioProb}% → ${cur.leadScenarioProb}%`,
        )
      : null;

  let stateChange = pickLocale(locale, "Lattice steady", "Решётка стабильна");
  if (regimeShift) stateChange = pickLocale(locale, "Regime migration", "Миграция режима");
  else if (consensusShift) stateChange = pickLocale(locale, "Consensus shift", "Сдвиг консенсуса");
  else if (cur.dangerBand !== prev?.dangerBand) stateChange = pickLocale(locale, "Risk band transition", "Переход полосы риска");
  else if (scenarioChange) stateChange = pickLocale(locale, "Scenario rotation", "Ротация сценария");
  else if (cur.liquidityStructuralStress >= 62) stateChange = pickLocale(locale, "Liquidity stress elevated", "Стресс ликвидности выше");

  return { stateChange, regimeShift, consensusShift, confidenceShift, scenarioChange };
}

/**
 * Build T-3 / T-2 / T-1 / NOW slots from the last N capture frames.
 * Always returns up to 4 slots anchored on the latest frame as NOW.
 */
export function buildReplayTimeline(
  locale: UiLocale,
  frames: readonly ReplayCinemaFrame[],
  history: readonly CognitiveSnapshot[],
): readonly ReplayTimelineSlot[] {
  if (frames.length === 0) return [];

  const count = Math.min(4, frames.length);
  const startIndex = frames.length - count;
  const offsets = OFFSETS.slice(4 - count);

  return offsets.map((offset, i) => {
    const frameIndex = startIndex + i;
    const frame = frames[frameIndex]!;
    const snap = snapAtTick(history, frame.tick);
    const prevSnap =
      i > 0
        ? snapAtTick(history, frames[startIndex + i - 1]!.tick)
        : frameIndex > 0
          ? snapAtTick(history, frames[frameIndex - 1]!.tick)
          : undefined;

    const meta = snap
      ? slotMetadata(locale, prevSnap, snap)
      : {
          stateChange: pickLocale(locale, "Capture forming", "Захват формируется"),
          regimeShift: null,
          consensusShift: null,
          confidenceShift: null,
          scenarioChange: null,
        };

    return {
      offset,
      frameIndex,
      timestamp: frame.clock,
      tick: frame.tick,
      ...meta,
    };
  });
}

export function buildStateComparison(
  locale: UiLocale,
  frames: readonly ReplayCinemaFrame[],
  currentSlot: ReplayTimelineSlot,
  previousSlot: ReplayTimelineSlot | null,
): ReplayStateComparison {
  const current = frames[currentSlot.frameIndex]!;
  const previous = previousSlot ? frames[previousSlot.frameIndex] : null;

  const consensusFrom = previous?.consensus ?? current.consensus;
  const consensusTo = current.consensus;

  const executionFrom =
    previous?.executionDrift ??
    pickLocale(locale, "Baseline posture", "Базовая поза");
  const executionTo = current.executionDrift;

  const structuralSummary = (() => {
    if (!previous) {
      return pickLocale(locale, "Opening capture — no prior state in this window.", "Начальный захват — нет предыдущего состояния в окне.");
    }
    const parts: string[] = [];
    if (currentSlot.regimeShift) parts.push(currentSlot.regimeShift);
    if (currentSlot.consensusShift) parts.push(currentSlot.consensusShift);
    if (currentSlot.scenarioChange) parts.push(currentSlot.scenarioChange);
    if (parts.length === 0) {
      parts.push(
        pickLocale(
          locale,
          `Pressure ${previous.pressurePct}→${current.pressurePct} · instability ${previous.instabilityPct}→${current.instabilityPct}`,
          `Давление ${previous.pressurePct}→${current.pressurePct} · нестабильность ${previous.instabilityPct}→${current.instabilityPct}`,
        ),
      );
    }
    return parts.join(" · ");
  })();

  return {
    previousOffset: previousSlot?.offset ?? null,
    currentOffset: currentSlot.offset,
    consensus: { from: consensusFrom, to: consensusTo },
    risk: {
      from: previous?.instabilityPct ?? current.instabilityPct,
      to: current.instabilityPct,
      direction: metricDirection(previous?.instabilityPct ?? current.instabilityPct, current.instabilityPct, 3),
    },
    liquidity: {
      from: previous?.pressurePct ?? current.pressurePct,
      to: current.pressurePct,
      direction: metricDirection(previous?.pressurePct ?? current.pressurePct, current.pressurePct, 4),
    },
    sponsorship: {
      from: previous?.sponsorshipPct ?? current.sponsorshipPct,
      to: current.sponsorshipPct,
      direction: metricDirection(previous?.sponsorshipPct ?? current.sponsorshipPct, current.sponsorshipPct, 4),
    },
    scenarioWeight: {
      from: previous?.scenarioWeight ?? current.scenarioWeight,
      to: current.scenarioWeight,
      direction: metricDirection(previous?.scenarioWeight ?? current.scenarioWeight, current.scenarioWeight, 5),
    },
    executionPosture: { from: executionFrom, to: executionTo },
    structuralSummary,
  };
}

export function slotForFrameIndex(
  timeline: readonly ReplayTimelineSlot[],
  frameIndex: number,
): ReplayTimelineSlot | null {
  return timeline.find((s) => s.frameIndex === frameIndex) ?? timeline[timeline.length - 1] ?? null;
}

export function previousSlot(
  timeline: readonly ReplayTimelineSlot[],
  current: ReplayTimelineSlot,
): ReplayTimelineSlot | null {
  const idx = timeline.findIndex((s) => s.offset === current.offset);
  return idx > 0 ? timeline[idx - 1]! : null;
}
