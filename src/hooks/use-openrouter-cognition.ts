"use client";

import { useEffect, useMemo, useRef } from "react";

import { useAiCognitionStore } from "@/store/ai-cognition-store";
import { useAccessStore } from "@/store/access-store";
import { useAuthStore } from "@/store/auth-store";
import { useCognitionSimulationStore } from "@/store/cognition-simulation-store";
import { authHeadersForUser } from "@/lib/access/request-user";
import { useMarketStore } from "@/store/market-store";
import { buildContextPayload } from "@/lib/openrouter/context";
import type { AgentOutput, OrchestratorOutput } from "@/lib/openrouter/prompts";
import { marketEntry } from "@/lib/market/market-log";
import { useShallow } from "zustand/react/shallow";

type Resp =
  | { ok: true; agents: AgentOutput[]; orchestrator: OrchestratorOutput; ts: number }
  | { ok: false; error: string };

function now() {
  return Date.now();
}

type TriggerKey = Readonly<{
  phase: string;
  dangerBand: string;
  volBand: "compressing" | "neutral" | "expanding" | null;
  momentumBand: "neg" | "neutral" | "pos" | null;
  fundingHot: boolean;
  dislocation: boolean;
}>;

function shouldTrigger(prev: TriggerKey | null, next: TriggerKey): { yes: boolean; reason: string } {
  if (!prev) return { yes: true, reason: "initial" };
  if (next.phase !== prev.phase) return { yes: true, reason: "phase" };
  if (next.dangerBand !== prev.dangerBand) return { yes: true, reason: "danger" };
  if (next.volBand !== prev.volBand) return { yes: true, reason: "vol" };
  if (next.momentumBand !== prev.momentumBand) return { yes: true, reason: "momentum" };
  if (next.fundingHot && !prev.fundingHot) return { yes: true, reason: "funding" };
  if (next.dislocation && !prev.dislocation) return { yes: true, reason: "dislocation" };
  return { yes: false, reason: "" };
}

function volBand(v: number | null): "compressing" | "neutral" | "expanding" | null {
  if (v === null) return null;
  if (v <= 18) return "compressing";
  if (v >= 46) return "expanding";
  return "neutral";
}

function momentumBand(v: number | null): "neg" | "neutral" | "pos" | null {
  if (typeof v !== "number") return null;
  if (v >= 35) return "pos";
  if (v <= -35) return "neg";
  return "neutral";
}

export function useOpenRouterCognition(enabled = true) {
  const user = useAuthStore((s) => s.user);
  const session = useAuthStore((s) => s.session);
  const hasExtended = useAccessStore((s) => s.hasExtendedCognition());
  const ai = useAiCognitionStore(
    useShallow((s) => ({
      status: s.status,
      lastRunTs: s.lastRunTs,
      setRunning: s.setRunning,
      setError: s.setError,
      setResult: s.setResult,
    })),
  );
  const push = useCognitionSimulationStore((s) => s.pushExternalEntry);

  const market = useMarketStore(
    useShallow((s) => ({
      symbol: s.symbol,
      price: s.price,
      markPrice: s.markPrice,
      fundingRate: s.fundingRate,
      openInterest: s.openInterest,
      realizedVol: s.realizedVol,
      momentum: s.momentum,
      connection: s.connection,
      ts: s.ts,
    })),
  );
  const sim = useCognitionSimulationStore(
    useShallow((s) => ({
      derived: s.derived,
      scenarioBook: s.scenarioBook,
      agentLattice: s.agentLattice,
      operationalLog: s.operationalLog,
    })),
  );

  const opsFingerprint = sim.operationalLog
    .slice(0, 12)
    .map((e) => `${e.id}:${e.simTick}:${e.headline}`)
    .join("\u001f");

  const latticeFingerprint = sim.agentLattice.map((r) => `${r.role}:${r.confidencePct}`).join("|");

  // eslint-disable-next-line react-hooks/exhaustive-deps -- latticeFingerprint / opsFingerprint / book tick gate identical content
  const context = useMemo(
    () =>
      buildContextPayload({
        symbol: market.symbol,
        market,
        derived: sim.derived,
        scenarioBook: sim.scenarioBook,
        agentLattice: sim.agentLattice,
        operationalLog: sim.operationalLog,
      }),
    [
      market.symbol,
      market.price,
      market.markPrice,
      market.fundingRate,
      market.openInterest,
      market.realizedVol,
      market.momentum,
      market.connection,
      market.ts,
      latticeFingerprint,
      sim.derived,
      opsFingerprint,
      sim.scenarioBook.updatedAtTick,
    ],
  );

  const contextRef = useRef(context);
  contextRef.current = context;

  const prevKey = useRef<TriggerKey | null>(null);
  const lastPriceRef = useRef<number | null>(null);

  // eslint-disable-next-line react-hooks/exhaustive-deps -- ai slice stable for trigger; full object would loop on status churn
  useEffect(() => {
    if (!enabled) return;
    if (!hasExtended) return;
    if (ai.status === "running") return;
    if (market.connection !== "live") return;
    if (!market.price) return;

    const lp = lastPriceRef.current;
    const dislocation = lp ? Math.abs((market.price - lp) / lp) >= 0.0065 : false;
    lastPriceRef.current = market.price;

    const key = {
      phase: sim.derived.phase,
      dangerBand: sim.derived.dangerBand,
      volBand: volBand(market.realizedVol),
      momentumBand: momentumBand(market.momentum),
      fundingHot: market.fundingRate !== null ? market.fundingRate >= 0.0009 : false,
      dislocation,
    };

    const trig = shouldTrigger(prevKey.current, key);
    prevKey.current = key;
    if (!trig.yes) return;

    const cooldownMs = 180_000;
    if (ai.lastRunTs && now() - ai.lastRunTs < cooldownMs) return;

    const run = async () => {
      ai.setRunning();
      try {
        const res = await fetch("/api/openrouter/cognition", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...authHeadersForUser(user?.id ?? null, session?.access_token ?? null),
          },
          body: JSON.stringify({ context: contextRef.current }),
        });
        const json = (await res.json()) as Resp;
        if (!json.ok) throw new Error(json.error);
        ai.setResult({ agents: json.agents, orchestrator: json.orchestrator, ts: json.ts });

        // push a single high-signal orchestrator entry
        push(
          marketEntry({
            entryType: "ORCHESTRATOR",
            priority:
              json.orchestrator.consensusState === "Risk leads" || json.orchestrator.actionBias === "tighten_risk"
                ? "important"
                : "informational",
            headline: json.orchestrator.headline,
            summary: json.orchestrator.synthesis,
            whyMatters:
              json.orchestrator.contradictions.length > 0
                ? `Contradictions: ${json.orchestrator.contradictions.join(" · ")}`
                : `Dominant driver: ${json.orchestrator.dominantDriver}.`,
            message: {
              kind: "ai_orchestrator",
              headline: json.orchestrator.headline,
              summary: json.orchestrator.synthesis,
              whyMatters:
                json.orchestrator.contradictions.length > 0
                  ? `Contradictions: ${json.orchestrator.contradictions.join(" · ")}`
                  : `Dominant driver: ${json.orchestrator.dominantDriver}.`,
            },
          }),
          "ai-orchestrator",
          95_000,
        );
      } catch {
        ai.setError("Interpretation layer is temporarily unavailable.");
        /* failsafe: deterministic pipeline continues without AI overlay */
      }
    };

    run();
  }, [
    ai.lastRunTs,
    ai.setError,
    ai.setResult,
    ai.setRunning,
    ai.status,
    enabled,
    hasExtended,
    market.connection,
    market.fundingRate,
    market.momentum,
    market.price,
    market.realizedVol,
    push,
    sim.derived.dangerBand,
    sim.derived.phase,
    session?.access_token,
    user?.id,
  ]);
}

