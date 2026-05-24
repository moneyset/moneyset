import type { AgentId } from "@/lib/openrouter/models";
import type { AgentOutput, OrchestratorOutput } from "@/lib/openrouter/prompts";

function clamp(n: number, lo: number, hi: number) {
  return Math.min(hi, Math.max(lo, n));
}

export function parseAgentJson(agent: AgentId, raw: string): AgentOutput | OrchestratorOutput {
  let obj: unknown;
  try {
    obj = JSON.parse(raw) as unknown;
  } catch {
    throw new Error("Agent output was not valid JSON");
  }

  if (!obj || typeof obj !== "object") throw new Error("Agent output invalid shape");
  const o = obj as Record<string, unknown>;

  if (agent === "orchestrator") {
    // tolerate missing/incorrect agent tag, but enforce orchestrator shape
    const out: OrchestratorOutput = {
      agent: "orchestrator",
      headline: String(o.headline ?? "DESK SUMMARY"),
      confidencePct: clamp(Number(o.confidencePct ?? 55), 34, 94),
      consensusState: String(o.consensusState ?? "Alignment down") as OrchestratorOutput["consensusState"],
      synthesis: String(o.synthesis ?? ""),
      contradictions: Array.isArray(o.contradictions) ? o.contradictions.map(String).slice(0, 3) : [],
      dominantDriver: String(o.dominantDriver ?? "Dominant driver unclear"),
      actionBias: String(o.actionBias ?? "stay_measured") as OrchestratorOutput["actionBias"],
    };
    if (!out.synthesis) throw new Error("Desk synthesis missing");
    return out;
  }

  const out: AgentOutput = {
    agent,
    headline: String(o.headline ?? "COGNITION UPDATE"),
    confidencePct: clamp(Number(o.confidencePct ?? 55), 34, 94),
    state: String(o.state ?? "Monitor") as AgentOutput["state"],
    summary: String(o.summary ?? ""),
    whyMatters: o.whyMatters ? String(o.whyMatters) : undefined,
    keyDrivers: Array.isArray(o.keyDrivers)
      ? o.keyDrivers.map(String).slice(0, 5)
      : ["Insufficient structured drivers"],
    fragilityFactors: Array.isArray(o.fragilityFactors)
      ? o.fragilityFactors.map(String).slice(0, 4)
      : ["Fragility factors unclear"],
  };

  if (!out.summary) throw new Error("Agent summary missing");
  return out;
}

