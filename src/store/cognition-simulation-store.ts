"use client";

import { create } from "zustand";

import { deriveAgentLattice } from "@/lib/simulation/agents-derive";
import type { DerivedCognitionSnapshot } from "@/lib/simulation/engine-evolve";
import {
  classifyPhase,
  deriveFromLatentCommitted,
  evolveLatent,
} from "@/lib/simulation/engine-evolve";
import {
  entryBootstrap,
  entryConsensus,
  entryDanger,
  entryFlowExtension,
  entryLiquidityShock,
  entryMacroShift,
  entryOrchestrator,
  entryRegimePhaseChange,
  entryScenarioRebalance,
  entrySentimentOverheat,
  entryVolatility,
  formatSimulationClock,
} from "@/lib/simulation/engine-log";
import { initPhaseStabilizer, updatePhaseStabilizer } from "@/lib/simulation/phase-stabilizer";
import type {
  AgentLatticeRow,
  AgentHistoryPoint,
  CognitiveSnapshot,
  ConsensusEvolutionLabel,
  DangerBandId,
  LatentDrivers,
  MarketPhaseId,
  OperationalLogEntry,
  TopScenarioWireId,
  VolatilityTone,
} from "@/lib/simulation/cognition-types";
import { deriveDominantSurface, deriveMainRisk, deriveTopScenario } from "@/lib/simulation/surface-derive";
import type { ScenarioEngineBook } from "@/lib/simulation/scenario-engine";
import { deriveScenarioEngineBook, relocalizeScenarioEngineBook } from "@/lib/simulation/scenario-engine";
import { useUiPrefsStore } from "@/store/ui-prefs-store";

const MAX_LOG = 42;
export const SNAPSHOT_MEMORY_OFFSET_TICKS = 32;
const SNAP_EVERY = 5;

type CooldownMap = Partial<Record<string, number>>;

export const COGNITION_SIMULATION_TICK_MS = 3400; // keep in sync with `COGNITION_TICK_MS` in `@/lib/cognition/temporal-evolution`

type CognitionSimulationState = Readonly<{
  simTick: number;
  latent: LatentDrivers;
  phaseStabilizer: ReturnType<typeof initPhaseStabilizer>;
  derived: DerivedCognitionSnapshot;
  operationalLog: OperationalLogEntry[];
  agentLattice: AgentLatticeRow[];
  dominant: ReturnType<typeof deriveDominantSurface>;
  mainRisk: ReturnType<typeof deriveMainRisk>;
  topScenario: ReturnType<typeof deriveTopScenario>;
  scenarioBook: ScenarioEngineBook;
  consensusSpreadDisplay: string;
  history: CognitiveSnapshot[];
  agentHistory: AgentHistoryPoint[];
  prevLatent: LatentDrivers;
  prevConsensus: ConsensusEvolutionLabel;
  prevDangerBand: DangerBandId;
  prevVolTone: VolatilityTone;
  prevCommittedPhase: MarketPhaseId;
  lastTopScenarioId: TopScenarioWireId | null;
  cooldowns: CooldownMap;
  externalCooldowns: Partial<Record<string, number>>;
}>;

function cooldownReady(cd: CooldownMap, key: string, tick: number): boolean {
  return tick >= (cd[key] ?? 0);
}

function cooldownSet(cd: CooldownMap, key: string, tick: number, wait: number): CooldownMap {
  return { ...cd, [key]: tick + wait };
}

function simLocale(): "en" | "ru" {
  return useUiPrefsStore.getState().uiLocale;
}

function buildInitial(): CognitionSimulationState {
  const simTick = 0;
  const locale = simLocale();
  const latent = evolveLatent(simTick);
  const observed = classifyPhase(latent);
  const phaseStabilizer = initPhaseStabilizer(observed);
  const derived = deriveFromLatentCommitted(latent, simTick, phaseStabilizer.committed);
  const topScenario = deriveTopScenario(latent, derived);
  const scenarioBook = deriveScenarioEngineBook({ tick: simTick, latent, derived, locale });
  const agentLattice = deriveAgentLattice(latent, derived, locale);

  const spreadHi = Math.round(derived.consensusSpreadPct);
  const spreadLo = Math.max(30, Math.round(derived.consensusSpreadPct - 8 - derived.divergenceIndex * 0.08));

  return {
    simTick,
    latent,
    phaseStabilizer,
    derived,
    operationalLog: [entryBootstrap(simTick)],
    agentLattice,
    dominant: deriveDominantSurface(latent, derived),
    mainRisk: deriveMainRisk(derived, latent),
    topScenario,
    scenarioBook,
    consensusSpreadDisplay: `${spreadHi} → ${spreadLo}`,
    history: [
      {
        simTick,
        simulatedClockLabel: formatSimulationClock(simTick),
        phase: derived.phase,
        consensus: derived.consensus,
        dangerBand: derived.dangerBand,
        dangerScore: derived.dangerScore,
        divergenceIndex: derived.divergenceIndex,
        consensusSpreadPct: derived.consensusSpreadPct,
        volatilityImpulse: latent.volatilityImpulse,
        positioningPressure: latent.positioningPressure,
        liquidityStructuralStress: latent.liquidityStructuralStress,
        leadScenarioProb: topScenario.probabilityPct,
      },
    ],
    agentHistory: (() => {
      const by = new Map(agentLattice.map((r) => [r.role, r] as const));
      return [
        {
          simTick,
          macro: by.get("Macro")?.confidencePct ?? 50,
          flow: by.get("Flow")?.confidencePct ?? 50,
          liquidity: by.get("Liquidity")?.confidencePct ?? 50,
          risk: by.get("Risk")?.confidencePct ?? 50,
          sentiment: by.get("Sentiment")?.confidencePct ?? 50,
          orchestrator: by.get("Orchestrator")?.confidencePct ?? 50,
          divergenceIndex: derived.divergenceIndex,
        },
      ];
    })(),
    prevLatent: latent,
    prevConsensus: derived.consensus,
    prevDangerBand: derived.dangerBand,
    prevVolTone: derived.volTone,
    prevCommittedPhase: phaseStabilizer.committed,
    lastTopScenarioId: topScenario.scenarioId,
    cooldowns: {},
    externalCooldowns: {},
  };
}

function maybeHistoryPush(
  history: CognitiveSnapshot[],
  simTick: number,
  derived: DerivedCognitionSnapshot,
  latent: LatentDrivers,
  leadScenarioProb: number,
): CognitiveSnapshot[] {
  if (simTick % SNAP_EVERY !== 0 && simTick !== 0) return history;
  const next: CognitiveSnapshot = {
    simTick,
    simulatedClockLabel: formatSimulationClock(simTick),
    phase: derived.phase,
    consensus: derived.consensus,
    dangerBand: derived.dangerBand,
    dangerScore: derived.dangerScore,
    divergenceIndex: derived.divergenceIndex,
    consensusSpreadPct: derived.consensusSpreadPct,
    volatilityImpulse: latent.volatilityImpulse,
    positioningPressure: latent.positioningPressure,
    liquidityStructuralStress: latent.liquidityStructuralStress,
    leadScenarioProb,
  };
  return [...history, next].slice(-48);
}

function maybeAgentHistoryPush(
  history: AgentHistoryPoint[],
  simTick: number,
  derived: DerivedCognitionSnapshot,
  agentLattice: AgentLatticeRow[],
): AgentHistoryPoint[] {
  if (simTick % SNAP_EVERY !== 0 && simTick !== 0) return history;
  const by = new Map(agentLattice.map((r) => [r.role, r] as const));
  const next = {
    simTick,
    macro: by.get("Macro")?.confidencePct ?? history.at(-1)?.macro ?? 50,
    flow: by.get("Flow")?.confidencePct ?? history.at(-1)?.flow ?? 50,
    liquidity: by.get("Liquidity")?.confidencePct ?? history.at(-1)?.liquidity ?? 50,
    risk: by.get("Risk")?.confidencePct ?? history.at(-1)?.risk ?? 50,
    sentiment: by.get("Sentiment")?.confidencePct ?? history.at(-1)?.sentiment ?? 50,
    orchestrator: by.get("Orchestrator")?.confidencePct ?? history.at(-1)?.orchestrator ?? 50,
    divergenceIndex: derived.divergenceIndex,
  } satisfies AgentHistoryPoint;
  return [...history, next].slice(-48);
}

function applyAdvance(state: CognitionSimulationState): CognitionSimulationState {
  const simTick = state.simTick + 1;
  const locale = simLocale();
  const prevLatent = state.latent;
  const latent = evolveLatent(simTick);
  const observed = classifyPhase(latent);

  const beforeCommitted = state.phaseStabilizer.committed;
  const phaseStabilizer = updatePhaseStabilizer(state.phaseStabilizer, observed);
  const afterCommitted = phaseStabilizer.committed;
  const phaseCommittedChanged = afterCommitted !== beforeCommitted;

  const derived = deriveFromLatentCommitted(latent, simTick, afterCommitted);
  const topScenario = deriveTopScenario(latent, derived);
  const agentLattice = deriveAgentLattice(latent, derived, locale);
  const dominant = deriveDominantSurface(latent, derived);
  const mainRisk = deriveMainRisk(derived, latent);
  const scenarioBook = deriveScenarioEngineBook({
    tick: simTick,
    latent,
    derived,
    previous: state.scenarioBook,
    locale,
  });

  const spreadHi = Math.round(derived.consensusSpreadPct);
  const spreadLo = Math.max(30, Math.round(derived.consensusSpreadPct - 8 - derived.divergenceIndex * 0.08));

  const newEntries: OperationalLogEntry[] = [];
  let cooldowns = state.cooldowns;

  const push = (e: OperationalLogEntry) => {
    newEntries.push(e);
  };

  if (phaseCommittedChanged) {
    push(entryRegimePhaseChange(simTick, beforeCommitted, afterCommitted));
    push(entryOrchestrator(simTick, afterCommitted));
  }

  if (derived.consensus !== state.prevConsensus) {
    push(entryConsensus(simTick, derived.consensus));
  }

  if (derived.dangerBand !== state.prevDangerBand) {
    push(entryDanger(simTick, state.prevDangerBand, derived.dangerBand));
  }

  if (derived.volTone !== state.prevVolTone) {
    push(entryVolatility(simTick, derived.volTone, state.prevVolTone));
  }

  if (
    latent.liquidityStructuralStress - prevLatent.liquidityStructuralStress > 9 &&
    latent.liquidityStructuralStress > 61 &&
    cooldownReady(cooldowns, "liqShock", simTick)
  ) {
    push(entryLiquidityShock(simTick));
    cooldowns = cooldownSet(cooldowns, "liqShock", simTick, 22);
  }

  if (
    latent.positioningPressure >= 70 &&
    prevLatent.positioningPressure < 64 &&
    cooldownReady(cooldowns, "flowExt", simTick)
  ) {
    push(entryFlowExtension(simTick));
    cooldowns = cooldownSet(cooldowns, "flowExt", simTick, 26);
  }

  if (
    latent.macroLiquidityBackdrop >= 72 &&
    prevLatent.macroLiquidityBackdrop < 66 &&
    cooldownReady(cooldowns, "macroShift", simTick)
  ) {
    push(entryMacroShift(simTick));
    cooldowns = cooldownSet(cooldowns, "macroShift", simTick, 40);
  }

  if (
    latent.sentimentThermal >= 74 &&
    prevLatent.sentimentThermal < 68 &&
    cooldownReady(cooldowns, "sentimentHot", simTick)
  ) {
    push(entrySentimentOverheat(simTick));
    cooldowns = cooldownSet(cooldowns, "sentimentHot", simTick, 28);
  }

  if (topScenario.scenarioId !== state.lastTopScenarioId && cooldownReady(cooldowns, "scenario", simTick)) {
    push(entryScenarioRebalance(simTick, topScenario.scenarioId, topScenario.probabilityPct));
    cooldowns = cooldownSet(cooldowns, "scenario", simTick, 18);
  }

  let operationalLog = state.operationalLog;
  if (newEntries.length > 0) {
    operationalLog = [...newEntries, ...operationalLog].slice(0, MAX_LOG);
  }

  return {
    simTick,
    latent,
    phaseStabilizer,
    derived,
    operationalLog,
    agentLattice,
    dominant,
    mainRisk,
    topScenario,
    scenarioBook,
    consensusSpreadDisplay: `${spreadHi} → ${spreadLo}`,
    history: maybeHistoryPush(state.history, simTick, derived, latent, topScenario.probabilityPct),
    agentHistory: maybeAgentHistoryPush(state.agentHistory, simTick, derived, agentLattice),
    prevLatent: latent,
    prevConsensus: derived.consensus,
    prevDangerBand: derived.dangerBand,
    prevVolTone: derived.volTone,
    prevCommittedPhase: afterCommitted,
    lastTopScenarioId: topScenario.scenarioId,
    cooldowns,
    externalCooldowns: state.externalCooldowns,
  };
}

type CognitionSimulationStore = CognitionSimulationState & {
  advance: () => void;
  resetSession: () => void;
  refreshForLocale: () => void;
  getMemorySnapshot: () => CognitiveSnapshot | null;
  pushExternalEntry: (entry: OperationalLogEntry, cooldownKey?: string, cooldownMs?: number) => void;
};

export const useCognitionSimulationStore = create<CognitionSimulationStore>((set, get) => ({
  ...buildInitial(),

  advance: () => set((s) => applyAdvance(s)),

  resetSession: () => set(() => buildInitial()),

  refreshForLocale: () =>
    set((s) => {
      const locale = simLocale();
      return {
        ...s,
        agentLattice: deriveAgentLattice(s.latent, s.derived, locale),
        scenarioBook: relocalizeScenarioEngineBook(s.scenarioBook, s.derived, locale),
      };
    }),

  getMemorySnapshot: () => {
    const s = get();
    const target = s.simTick - SNAPSHOT_MEMORY_OFFSET_TICKS;
    if (target < 0) return null;
    return [...s.history].reverse().find((h) => h.simTick <= target) ?? s.history[0] ?? null;
  },

  pushExternalEntry: (entry, cooldownKey, cooldownMs = 22_000) => {
    const key = cooldownKey ?? entry.headline;
    const now = Date.now();
    const s = get();
    const cd = s.externalCooldowns ?? {};
    const ready = now >= (cd[key] ?? 0);
    if (!ready) return;
    const nextCd = { ...cd, [key]: now + cooldownMs };

    set((prev) => ({
      ...prev,
      externalCooldowns: nextCd,
      operationalLog: [entry, ...prev.operationalLog].slice(0, MAX_LOG),
    }));
  },
}));
