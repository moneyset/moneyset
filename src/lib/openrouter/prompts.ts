import type { AgentId } from "@/lib/openrouter/models";

export type AgentOutput = Readonly<{
  agent: AgentId;
  headline: string;
  confidencePct: number;
  state:
    | "Stable"
    | "Monitor"
    | "Alignment up"
    | "Alignment down"
    | "Divergence wide"
    | "Tighten risk";
  summary: string;
  whyMatters?: string;
  keyDrivers: string[];
  fragilityFactors: string[];
}>;

export type OrchestratorOutput = Readonly<{
  agent: "orchestrator";
  headline: string;
  confidencePct: number;
  consensusState:
    | "Alignment up"
    | "Alignment down"
    | "Divergence wide"
    | "Macro leads"
    | "Risk leads";
  synthesis: string;
  contradictions: string[];
  dominantDriver: string;
  actionBias: "stay_measured" | "tighten_risk" | "wait_for_acceptance";
}>;

export function systemPrompt(agent: AgentId): string {
  const base = [
    "You are a MONEYSET market desk agent.",
    "You are NOT a chatbot, personality, or roleplay character.",
    "Write compressed, professional market notes. No hype. No emojis. No price targets.",
    "Use controlled vocabulary. Avoid synonyms.",
    "Return ONLY valid JSON. No markdown. No extra keys.",
  ].join("\n");

  const spec = [
    "Output schema for non-orchestrator agents:",
    "{",
    '  "agent": "<macro|flow|liquidity|risk|sentiment>",',
    '  "headline": "SHORT ALL CAPS STYLE HEADLINE (2-6 words)",',
    '  "confidencePct": 34-94,',
    '  "state": "<Stable|Monitor|Alignment up|Alignment down|Divergence wide|Tighten risk>",',
    '  "summary": "1 line. 2–8 words.",',
    '  "whyMatters": "optional 1 line. 2–8 words.",',
    '  "keyDrivers": ["3-5 controlled phrases"],',
    '  "fragilityFactors": ["2-4 controlled phrases"]',
    "}",
  ].join("\n");

  const orchSpec = [
    "Output schema for desk summary (orchestrator):",
    "{",
    '  "agent": "orchestrator",',
    '  "headline": "DESK SUMMARY",',
    '  "confidencePct": 34-94,',
    '  "consensusState": "<Alignment up|Alignment down|Divergence wide|Macro leads|Risk leads>",',
    '  "synthesis": "2-4 short lines. No prose.",',
    '  "contradictions": ["0-3 short items"],',
    '  "dominantDriver": "controlled phrase",',
    '  "actionBias": "<stay_measured|tighten_risk|wait_for_acceptance>"',
    "}",
  ].join("\n");

  const focus: Record<AgentId, string> = {
    macro: "Focus: liquidity backdrop, macro pressure, rates proxies, risk-on/risk-off dominance.",
    flow: "Focus: spot/price behavior, absorption, directional participation, momentum quality.",
    liquidity: "Focus: leverage, funding, positioning, open interest, squeeze / sweep conditions.",
    risk: "Focus: fragility, asymmetry, invalidations, forced-move risk.",
    sentiment: "Focus: crowd positioning, overheating, fear/greed shifts, reversal risk.",
    orchestrator: "Focus: tight desk summary, contradictions, consensus state, dominant driver.",
  };

  return [base, focus[agent], agent === "orchestrator" ? orchSpec : spec].join("\n\n");
}

export function userPrompt(agent: AgentId, ctx: string): string {
  return [
    "Market context (compressed):",
    ctx,
    "",
    "Task:",
    agent === "orchestrator"
      ? "Synthesize agent notes into the desk summary schema. Flag contradictions."
      : "Interpret the context through your lens. Output agent schema.",
  ].join("\n");
}

