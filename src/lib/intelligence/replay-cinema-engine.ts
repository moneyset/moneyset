import type { AgentArchetypeId } from "@/lib/agents/agent-archetypes";
import { deriveReplayStudioBundle } from "@/lib/intelligence/replay-studio-view";
import type { ReplayStudioBundle } from "@/lib/intelligence/replay-studio-view";
import type { DerivedCognitionSnapshot } from "@/lib/simulation/engine-evolve";
import type { AgentHistoryPoint, CognitiveSnapshot, TopScenarioWireId } from "@/lib/simulation/cognition-types";
import { consensusLabel, pickLocale, scenarioTitle } from "@/lib/i18n/cognition-dict";
import type { UiLocale } from "@/store/ui-prefs-store";

export type CriticalMomentKind =
  | "continuation_collapse"
  | "sponsorship_failure"
  | "leverage_cascade"
  | "volatility_expansion"
  | "reclaim_rejection"
  | "instability_emergence"
  | "consensus_fracture"
  | "scenario_rotation";

export type ReplayCinemaFrame = Readonly<{
  index: number;
  tick: number;
  clock: string;
  headline: string;
  structuralRead: string;
  executionDrift: string;
  pressurePct: number;
  instabilityPct: number;
  sponsorshipPct: number;
  scenarioWeight: number;
  divergence: number;
  consensus: string;
  /** Layer intensities 0–100 for multi-layer sync */
  layers: Readonly<{
    structure: number;
    liquidity: number;
    agents: number;
    macro: number;
    sentiment: number;
    execution: number;
  }>;
}>;

export type CriticalMoment = Readonly<{
  id: string;
  tick: number;
  clock: string;
  kind: CriticalMomentKind;
  headline: string;
  detail: string;
  frameIndex: number;
}>;

export type AgentReplayEpoch = Readonly<{
  tick: number;
  clock: string;
  leaderId: AgentArchetypeId;
  macro: number;
  flow: number;
  risk: number;
  fracture: boolean;
  riskEscalated: boolean;
  note: string;
}>;

export type CognitionDriftLine = Readonly<{
  id: string;
  line: string;
  severity: "neutral" | "elevated" | "critical";
}>;

export type ReplayCinemaBundle = Readonly<{
  headline: string;
  subline: string;
  frames: readonly ReplayCinemaFrame[];
  criticalMoments: readonly CriticalMoment[];
  cognitionDrift: readonly CognitionDriftLine[];
  agentEpochs: readonly AgentReplayEpoch[];
  layers: ReplayStudioBundle;
  frameCount: number;
}>;

function clamp(n: number, lo = 0, hi = 100): number {
  return Math.min(hi, Math.max(lo, Math.round(n)));
}

function agentAtTick(agentHistory: readonly AgentHistoryPoint[], tick: number): AgentHistoryPoint | undefined {
  return agentHistory.find((a) => a.simTick === tick) ?? agentHistory.filter((a) => a.simTick <= tick).at(-1);
}

function leaderFromAgent(pt: AgentHistoryPoint): AgentArchetypeId {
  const scores: { id: AgentArchetypeId; v: number }[] = [
    { id: "macro", v: pt.macro },
    { id: "flow", v: pt.flow },
    { id: "liquidity", v: pt.liquidity },
    { id: "risk", v: pt.risk },
    { id: "sentiment", v: pt.sentiment },
    { id: "structure", v: (pt.macro + pt.flow) / 2 },
  ];
  return scores.sort((a, b) => b.v - a.v)[0]!.id;
}

function frameFromSnapshot(
  locale: UiLocale,
  snap: CognitiveSnapshot,
  index: number,
  agent?: AgentHistoryPoint,
): ReplayCinemaFrame {
  const pressurePct = clamp(snap.liquidityStructuralStress * 0.55 + snap.positioningPressure * 0.45);
  const instabilityPct = clamp(snap.dangerScore * 0.85 + snap.divergenceIndex * 0.2);
  const sponsorshipPct = clamp(100 - snap.liquidityStructuralStress * 0.7);

  return {
    index,
    tick: snap.simTick,
    clock: snap.simulatedClockLabel,
    headline: pickLocale(locale, `Lattice T${snap.simTick}`, `Решётка T${snap.simTick}`),
    structuralRead: pickLocale(
      locale,
      `Phase ${snap.phase} · stress ${snap.dangerBand} · divergence ${snap.divergenceIndex}`,
      `Фаза ${snap.phase} · стресс ${snap.dangerBand} · расхождение ${snap.divergenceIndex}`,
    ),
    executionDrift: pickLocale(
      locale,
      snap.dangerBand === "calm" || snap.dangerBand === "moderate"
        ? "Execution posture measured — sponsorship tests valid."
        : "Execution posture defensive — widen invalidation awareness.",
      snap.dangerBand === "calm" || snap.dangerBand === "moderate"
        ? "Поза исполнения сдержанная — проверки спонсорства валидны."
        : "Поза исполнения защитная — расширить контроль инвалидации.",
    ),
    pressurePct,
    instabilityPct,
    sponsorshipPct,
    scenarioWeight: snap.leadScenarioProb,
    divergence: snap.divergenceIndex,
    consensus: consensusLabel(locale, snap.consensus),
    layers: {
      structure: clamp(100 - snap.divergenceIndex * 0.5),
      liquidity: clamp(snap.liquidityStructuralStress),
      agents: agent ? clamp(agent.divergenceIndex) : clamp(snap.divergenceIndex),
      macro: agent ? clamp(agent.macro) : 50,
      sentiment: agent ? clamp(agent.sentiment) : clamp(snap.volatilityImpulse),
      execution: clamp(snap.dangerScore * 0.6 + snap.volatilityImpulse * 0.35),
    },
  };
}

function detectCriticalMoments(
  locale: UiLocale,
  history: readonly CognitiveSnapshot[],
  agentHistory: readonly AgentHistoryPoint[],
): CriticalMoment[] {
  const out: CriticalMoment[] = [];
  const push = (
    id: string,
    tick: number,
    clock: string,
    kind: CriticalMomentKind,
    en: string,
    ru: string,
    detailEn: string,
    detailRu: string,
    frameIndex: number,
  ) =>
    out.push({
      id,
      tick,
      clock,
      kind,
      headline: pickLocale(locale, en, ru),
      detail: pickLocale(locale, detailEn, detailRu),
      frameIndex,
    });

  for (let i = 1; i < history.length; i++) {
    const p = history[i - 1]!;
    const c = history[i]!;
    const fi = i;

    if (p.phase !== c.phase && (c.phase === "fragile_continuation" || c.phase === "distribution_phase" || c.phase === "panic_risk")) {
      push(
        `phase-${c.simTick}`,
        c.simTick,
        c.simulatedClockLabel,
        "continuation_collapse",
        "Continuation collapse",
        "Коллапс продолжения",
        `Regime migrated ${p.phase} → ${c.phase} — structural sponsorship repriced.`,
        `Режим сменился ${p.phase} → ${c.phase} — спонсорство переоценено.`,
        fi,
      );
    }

    if (c.liquidityStructuralStress >= 68 && c.liquidityStructuralStress > p.liquidityStructuralStress + 8) {
      push(
        `sponsor-${c.simTick}`,
        c.simTick,
        c.simulatedClockLabel,
        "sponsorship_failure",
        "Sponsorship failure",
        "Провал спонсорства",
        "Depth stress accelerated — reactive proof required at shelves.",
        "Стресс глубины ускорился — нужны реактивные доказательства у полок.",
        fi,
      );
    }

    if (c.positioningPressure >= 72 && c.positioningPressure > p.positioningPressure + 6) {
      push(
        `lev-${c.simTick}`,
        c.simTick,
        c.simulatedClockLabel,
        "leverage_cascade",
        "Leverage cascade geometry",
        "Геометрия каскада плеча",
        "Forced-flow pressure rising — fragility coupling elevated.",
        "Давление вынужденного потока растёт — связка хрупкости выше.",
        fi,
      );
    }

    if (c.volatilityImpulse >= 66 && c.volatilityImpulse > p.volatilityImpulse + 8) {
      push(
        `vol-${c.simTick}`,
        c.simTick,
        c.simulatedClockLabel,
        "volatility_expansion",
        "Volatility expansion",
        "Расширение волатильности",
        "Vol band widening — acceptance proofs must expand with structure.",
        "Полоса волы расширяется — доказательства принятия должны расширяться со структурой.",
        fi,
      );
    }

    if (c.divergenceIndex >= 56 && c.divergenceIndex > p.divergenceIndex + 6) {
      push(
        `frac-${c.simTick}`,
        c.simTick,
        c.simulatedClockLabel,
        "consensus_fracture",
        "Consensus fracture",
        "Разлом консенсуса",
        "Cross-model divergence widened — scenario fork risk elevated.",
        "Расхождение моделей расширилось — выше риск развилки сценариев.",
        fi,
      );
    }

    if (Math.abs(c.leadScenarioProb - p.leadScenarioProb) >= 14) {
      push(
        `scen-${c.simTick}`,
        c.simTick,
        c.simulatedClockLabel,
        "scenario_rotation",
        "Scenario rotation",
        "Ротация сценария",
        "Lead path weight migrated — deck leadership shifted.",
        "Вес базового пути сместился — сменилось лидерство колоды.",
        fi,
      );
    }

    if (c.dangerBand !== "calm" && p.dangerBand === "calm") {
      push(
        `instab-${c.simTick}`,
        c.simTick,
        c.simulatedClockLabel,
        "instability_emergence",
        "Instability emergence",
        "Появление нестабильности",
        "Stress band lifted — defense-first execution window opened.",
        "Полоса стресса поднялась — открыто окно исполнения «защита сначала».",
        fi,
      );
    }
  }

  for (let i = 1; i < agentHistory.length; i++) {
    const p = agentHistory[i - 1]!;
    const c = agentHistory[i]!;
    if (c.risk >= p.risk + 12 && c.risk >= 58) {
      const snap = history.find((h) => h.simTick === c.simTick);
      if (snap && !out.some((m) => m.tick === c.simTick && m.kind === "instability_emergence")) {
        push(
          `risk-agent-${c.simTick}`,
          c.simTick,
          snap?.simulatedClockLabel ?? `T${c.simTick}`,
          "instability_emergence",
          "Risk agent escalation",
          "Эскалация агента риска",
          "Risk lattice tightened before consensus caught up.",
          "Решётка риска ужесточилась раньше консенсуса.",
          history.findIndex((h) => h.simTick === c.simTick),
        );
      }
    }
  }

  return out.slice(0, 10);
}

function buildCognitionDrift(
  locale: UiLocale,
  history: readonly CognitiveSnapshot[],
  agentHistory: readonly AgentHistoryPoint[],
): CognitionDriftLine[] {
  const out: CognitionDriftLine[] = [];
  const push = (id: string, en: string, ru: string, severity: CognitionDriftLine["severity"]) =>
    out.push({ id, line: pickLocale(locale, en, ru), severity });

  if (history.length < 2) {
    push("await", "Cognition window forming — replay populates as lattice captures.", "Окно прочтения формируется — реплей по мере захвата решётки.", "neutral");
    return out;
  }

  const first = history[0]!;
  const last = history[history.length - 1]!;

  if (first.consensus !== last.consensus) {
    push(
      "consensus",
      `Consensus drift: ${consensusLabel(locale, first.consensus)} → ${consensusLabel(locale, last.consensus)}.`,
      `Дрейф консенсуса: ${consensusLabel(locale, first.consensus)} → ${consensusLabel(locale, last.consensus)}.`,
      "elevated",
    );
  }

  const divDelta = last.divergenceIndex - first.divergenceIndex;
  if (divDelta >= 8) push("div-widen", "Conviction decay — cross-model fracture widening.", "Распад убеждённости — расширяется межмодельный разлом.", "elevated");
  else if (divDelta <= -6) push("conv-build", "Conviction reinforcing — fracture compressing.", "Убеждённость усиливается — разлом сжимается.", "neutral");

  if (last.liquidityStructuralStress > first.liquidityStructuralStress + 10) {
    push("frag", "Fragility increasing — sponsorship integrity deteriorated.", "Хрупкость растёт — целостность спонсорства ухудшилась.", "elevated");
  }

  if (last.leadScenarioProb !== first.leadScenarioProb) {
    push(
      "path",
      "Scenario path weight migrated across capture window.",
      "Вес сценарного пути сместился в окне захвата.",
      "neutral",
    );
  }

  if (agentHistory.length >= 2) {
    const af = agentHistory[0]!;
    const al = agentHistory[agentHistory.length - 1]!;
    if (al.risk >= af.risk + 10) {
      push("risk-lattice", "Risk lattice escalated through the window.", "Решётка риска эскалировала в окне.", "critical");
    }
    if (al.divergenceIndex >= af.divergenceIndex + 8) {
      push("agent-frac", "Agent disagreement intensified — accountability trail visible.", "Расхождение агентов усилилось — виден след ответственности.", "elevated");
    }
  }

  return out.slice(0, 7);
}

function buildAgentEpochs(
  locale: UiLocale,
  history: readonly CognitiveSnapshot[],
  agentHistory: readonly AgentHistoryPoint[],
): AgentReplayEpoch[] {
  return agentHistory.slice(-12).map((pt, i, arr) => {
    const prev = i > 0 ? arr[i - 1]! : pt;
    const snap = history.find((h) => h.simTick === pt.simTick);
    const leaderId = leaderFromAgent(pt);
    const fracture = pt.divergenceIndex >= 52;
    const riskEscalated = pt.risk >= prev.risk + 8;
    let note = pickLocale(locale, "Lattice stable", "Решётка стабильна");
    if (riskEscalated) note = pickLocale(locale, "Risk agent escalated", "Агент риска эскалировал");
    else if (fracture) note = pickLocale(locale, "Consensus fractured", "Консенсус раскололся");
    else if (pt.macro > prev.macro + 8) note = pickLocale(locale, "Macro conviction gained", "Макро-убеждённость выросла");
    else if (pt.macro < prev.macro - 8) note = pickLocale(locale, "Macro conviction lost", "Макро-убеждённость потеряна");

    return {
      tick: pt.simTick,
      clock: snap?.simulatedClockLabel ?? `T${pt.simTick}`,
      leaderId,
      macro: pt.macro,
      flow: pt.flow,
      risk: pt.risk,
      fracture,
      riskEscalated,
      note,
    };
  });
}

export function deriveReplayCinemaBundle(args: {
  locale: UiLocale;
  history: readonly CognitiveSnapshot[];
  agentHistory: readonly AgentHistoryPoint[];
  topScenarioId: TopScenarioWireId;
  derived: DerivedCognitionSnapshot;
}): ReplayCinemaBundle {
  const { locale, history, agentHistory, topScenarioId, derived } = args;

  const layers = deriveReplayStudioBundle(locale, history, agentHistory, topScenarioId);

  let frames: ReplayCinemaFrame[];
  if (history.length === 0) {
    frames = [
      frameFromSnapshot(
        locale,
        {
          simTick: 0,
          simulatedClockLabel: "—",
          phase: derived.phase,
          consensus: derived.consensus,
          dangerBand: derived.dangerBand,
          dangerScore: derived.dangerScore,
          divergenceIndex: derived.divergenceIndex,
          consensusSpreadPct: derived.consensusSpreadPct,
          volatilityImpulse: 0,
          positioningPressure: 0,
          liquidityStructuralStress: 0,
          leadScenarioProb: 50,
        },
        0,
      ),
    ];
  } else {
    frames = history.map((snap, index) => frameFromSnapshot(locale, snap, index, agentAtTick(agentHistory, snap.simTick)));
  }

  const criticalMoments = detectCriticalMoments(locale, history, agentHistory);
  const cognitionDrift = buildCognitionDrift(locale, history, agentHistory);
  const agentEpochs = buildAgentEpochs(locale, history, agentHistory);

  const headline =
    history.length >= 2
      ? pickLocale(locale, "Market memory playback", "Воспроизведение рыночной памяти")
      : pickLocale(locale, "Temporal cognition forming", "Формируется временное прочтение");

  const subline = pickLocale(
    locale,
    `Reconstructing structure around ${scenarioTitle(locale, topScenarioId)} — ${frames.length} capture frames.`,
    `Реконструкция структуры вокруг ${scenarioTitle(locale, topScenarioId)} — ${frames.length} кадров захвата.`,
  );

  return {
    headline,
    subline,
    frames,
    criticalMoments,
    cognitionDrift,
    agentEpochs,
    layers,
    frameCount: frames.length,
  };
}
