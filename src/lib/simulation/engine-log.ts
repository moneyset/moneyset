import type {
  ConsensusEvolutionLabel,
  DangerBandId,
  LogPriority,
  MarketPhaseId,
  OperationalLogEntry,
  TopScenarioWireId,
  VolatilityTone,
} from "@/lib/simulation/cognition-types";
import { CONSENSUS_LABEL_DISPLAY, CONSENSUS_SUMMARY, DANGER_LABEL, PHASE_LABEL } from "@/lib/simulation/phase-copy";

export const SIM_MINUTES_PER_TICK = 4;

function pad2(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

export function formatSimulationClock(tick: number): string {
  const baseMin = 8 * 60 + tick * SIM_MINUTES_PER_TICK;
  const h = Math.floor((baseMin / 60) % 24);
  const m = baseMin % 60;
  const s = (tick * 11) % 60;
  return `${pad2(h)}:${pad2(m)}:${pad2(s)}`;
}

function prioForDanger(prev: DangerBandId, next: DangerBandId): LogPriority {
  if (next === "critical") return "critical";
  if (next === "dangerous" && prev !== "dangerous") return "elevated";
  if (next === "elevated" && (prev === "calm" || prev === "moderate")) return "important";
  return next === prev ? "informational" : "important";
}

let logSerial = 0;
function nid(): string {
  logSerial += 1;
  return `lop-${Date.now()}-${logSerial}`;
}

export function entryRegimePhaseChange(simTick: number, fromP: MarketPhaseId, toP: MarketPhaseId): OperationalLogEntry {
  const clk = formatSimulationClock(simTick);
  return {
    id: nid(),
    simTick,
    simulatedClockLabel: clk,
    entryType: "REGIME",
    priority: "important",
    message: { kind: "regime_phase", from: fromP, to: toP },
    headline: PHASE_LABEL[toP],
    summary: `${PHASE_LABEL[fromP]} → ${PHASE_LABEL[toP]}.`,
    whyMatters: "Scenario weights reset.",
  };
}

export function entryConsensus(simTick: number, consensus: ConsensusEvolutionLabel): OperationalLogEntry {
  return {
    id: nid(),
    simTick,
    simulatedClockLabel: formatSimulationClock(simTick),
    entryType: "CONSENSUS",
    priority: consensus === "risk_layer_escalating" ? "elevated" : "important",
    message: { kind: "consensus", consensus },
    headline: CONSENSUS_LABEL_DISPLAY[consensus],
    summary: CONSENSUS_SUMMARY[consensus],
    whyMatters: "Conviction shifts.",
  };
}

export function entryDanger(simTick: number, prev: DangerBandId, next: DangerBandId): OperationalLogEntry {
  const severePrev = prev === "elevated" || prev === "dangerous" || prev === "critical";
  const relaxedNext = next === "calm" || next === "moderate";
  const agingFading = severePrev && relaxedNext;

  const prevL = DANGER_LABEL[prev];
  const nextL = DANGER_LABEL[next];

  return {
    id: nid(),
    simTick,
    simulatedClockLabel: formatSimulationClock(simTick),
    entryType: "RISK",
    priority: prioForDanger(prev, next),
    message: { kind: "danger_shift", prev, next, agingFading },
    headline: next === "critical" ? "Stress · CRITICAL" : "Stress band shift",
    summary:
      next === "critical"
        ? "Fast-move risk."
        : `Stress ${prevL} → ${nextL}.`,
    whyMatters:
      next === "critical"
        ? "Cut risk."
        : "Tighten invalidation.",
    agingNote: agingFading ? "Prior spike fading." : undefined,
  };
}

export function entryVolatility(simTick: number, tone: VolatilityTone, prevTone: VolatilityTone): OperationalLogEntry {
  return {
    id: nid(),
    simTick,
    simulatedClockLabel: formatSimulationClock(simTick),
    entryType: "VOLATILITY",
    priority: "informational",
    message: { kind: "vol_tone", tone, prev: prevTone },
    headline:
      tone === "compressing"
        ? "Volatility compressing"
        : tone === "expanding"
          ? "Volatility expanding"
          : "Volatility steady",
    summary:
      tone === "compressing"
        ? "Compression."
        : tone === "expanding"
          ? "Expansion."
          : "Steady.",
    whyMatters: "Bands widen on expansion.",
  };
}

export function entryLiquidityShock(simTick: number): OperationalLogEntry {
  return {
    id: nid(),
    simTick,
    simulatedClockLabel: formatSimulationClock(simTick),
    entryType: "LIQUIDITY",
    priority: "important",
    message: { kind: "liquidity_shock" },
    headline: "Liquidity stress jump",
    summary: "Depth thinner.",
    whyMatters: "Sweep risk up.",
  };
}

export function entryFlowExtension(simTick: number): OperationalLogEntry {
  return {
    id: nid(),
    simTick,
    simulatedClockLabel: formatSimulationClock(simTick),
    entryType: "FLOW",
    priority: "important",
    message: { kind: "flow_extension" },
    headline: "Flow extension",
    summary: "Extension vs participation.",
    whyMatters: "Reversal risk up.",
  };
}

export function entryMacroShift(simTick: number): OperationalLogEntry {
  return {
    id: nid(),
    simTick,
    simulatedClockLabel: formatSimulationClock(simTick),
    entryType: "MACRO",
    priority: "important",
    message: { kind: "macro_shift" },
    headline: "Macro leading the tape",
    summary: "Macro impulse.",
    whyMatters: "Reprice scenarios.",
  };
}

export function entryScenarioRebalance(simTick: number, scenarioId: TopScenarioWireId, probPct: number): OperationalLogEntry {
  return {
    id: nid(),
    simTick,
    simulatedClockLabel: formatSimulationClock(simTick),
    entryType: "SCENARIO",
    priority: "important",
    message: { kind: "scenario_rebalance", scenarioId, prob: probPct },
    headline: "Scenario rebalance",
    summary: `Lead → “${scenarioId}”.`,
    whyMatters: "Update invalidation.",
  };
}

export function entryOrchestrator(simTick: number, phase: MarketPhaseId): OperationalLogEntry {
  const phaseLabel = PHASE_LABEL[phase];
  return {
    id: nid(),
    simTick,
    simulatedClockLabel: formatSimulationClock(simTick),
    entryType: "ORCHESTRATOR",
    priority: "informational",
    message: { kind: "orchestrator_weights", phase },
    headline: "Layer weights updated",
    summary: `Weights → ${phaseLabel}.`,
    whyMatters: "Order attention.",
  };
}

export function entrySentimentOverheat(simTick: number): OperationalLogEntry {
  return {
    id: nid(),
    simTick,
    simulatedClockLabel: formatSimulationClock(simTick),
    entryType: "SENTIMENT",
    priority: "informational",
    message: { kind: "sentiment_overheat" },
    headline: "Crowd heat rising",
    summary: "Heat up.",
    whyMatters: "Reversal sensitivity up.",
  };
}

export function entryBootstrap(simTick: number): OperationalLogEntry {
  return {
    id: nid(),
    simTick,
    simulatedClockLabel: formatSimulationClock(simTick),
    entryType: "ORCHESTRATOR",
    priority: "informational",
    message: { kind: "bootstrap" },
    headline: "Operational feed live",
    summary: "Threshold-driven.",
    whyMatters: "No noise.",
  };
}
