"use client";

import { create } from "zustand";

import type { AgentOutput, OrchestratorOutput } from "@/lib/openrouter/prompts";

type AiCognitionState = {
  status: "idle" | "running" | "error";
  lastRunTs: number | null;
  error: string | null;
  agents: Partial<Record<AgentOutput["agent"], AgentOutput>>;
  orchestrator: OrchestratorOutput | null;
  setRunning: () => void;
  setError: (msg: string) => void;
  setResult: (args: { agents: AgentOutput[]; orchestrator: OrchestratorOutput; ts: number }) => void;
};

export const useAiCognitionStore = create<AiCognitionState>((set) => ({
  status: "idle",
  lastRunTs: null,
  error: null,
  agents: {},
  orchestrator: null,
  setRunning: () => set({ status: "running", error: null }),
  setError: (msg) => set({ status: "error", error: msg }),
  setResult: ({ agents, orchestrator, ts }) =>
    set(() => {
      const map: Partial<Record<AgentOutput["agent"], AgentOutput>> = {};
      agents.forEach((a) => {
        map[a.agent] = a;
      });
      return {
        status: "idle",
        lastRunTs: ts,
        error: null,
        agents: map,
        orchestrator,
      };
    }),
}));

