/**
 * Premium demo states — visual / copy only. No market logic.
 */

export const DEMO_MARKET_POSTURE = {
  headline: "Trend up",
  summary: "Trend up. Depth thin.",
  tags: ["Depth thin", "Leverage extended", "Divergence contained"],
};

export const DEMO_DANGER = {
  level: "elevated" as const,
  headline: "Stress elevated",
  summary: "Sweep risk. Unwind risk.",
  signals: ["Sweep risk", "Unwind risk", "Fast-move risk"],
};

export const DEMO_CONSENSUS = {
  headline: "Alignment down",
  summary: "Divergence wide.",
  spread: "Down",
};

/** Demo scenario deck — probability, confidence, invalidation, note. */
export const DEMO_SCENARIOS_STRATEGIC = [
  {
    id: "s1",
    title: "Controlled Bullish Expansion",
    probability: "Base",
    confidence: "Mixed",
    invalidation: "Support fails.",
    explanation: "Trend holds.",
  },
  {
    id: "s2",
    title: "Liquidity Sweep Before Continuation",
    probability: "Alt",
    confidence: "Mixed",
    invalidation: "Sweep rejected.",
    explanation: "Reclaim holds.",
  },
  {
    id: "s3",
    title: "Structural Breakdown Risk",
    probability: "Tail",
    confidence: "Low",
    invalidation: "Reclaim holds.",
    explanation: "Breakdown risk.",
  },
  {
    id: "s4",
    title: "Volatility Compression",
    probability: "Alt",
    confidence: "High",
    invalidation: "Break fails.",
    explanation: "Compression active.",
  },
] as const;

export const DEMO_REGIME = {
  label: "Controlled expansion",
  summary: "Drift toward late-cycle liquidity; confidence moderate; breadth still OK.",
  factors: ["Liquidity", "Vol", "Breadth"],
};

export const DEMO_OPERATIONAL_LOG = [
  { ts: "14:02:11", level: "info" as const, line: "Session open · desk idle" },
  { ts: "14:02:14", level: "info" as const, line: "Scenario weights reconciled to tape." },
  { ts: "14:02:19", level: "note" as const, line: "Consensus spread compressed — review suggested" },
];

/** Operations feed — timeline, not chat. */
export const DEMO_OPERATIONAL_FEED = [
  {
    id: "f1",
    category: "FLOW DETECTED",
    body: "Spot absorption up near resistance.",
  },
  {
    id: "f2",
    category: "CONSENSUS SHIFT",
    body: "Risk layer diverging from momentum continuation.",
  },
  {
    id: "f3",
    category: "VOLATILITY REGIME",
    body: "Compression holding ahead of macro.",
  },
  {
    id: "f4",
    category: "LEVERAGE WARNING",
    body: "OI rising faster than spot trend.",
  },
  {
    id: "f5",
    category: "LIQUIDITY STATE",
    body: "Bid depth better; ask thin into local high.",
  },
  {
    id: "f6",
    category: "MOMENTUM NOTE",
    body: "Exhaustion risk up on short horizon only.",
  },
] as const;

export type AgentLatticeRole = "Macro" | "Flow" | "Risk" | "Sentiment" | "Liquidity" | "Orchestrator";

export const DEMO_AGENT_LATTICE: Array<{
  role: AgentLatticeRole;
  confidence: string;
  alignment: string;
  divergence: string;
  state: string;
  accent: "cognition" | "flow" | "danger" | "sentiment" | "consensus" | "warning";
}> = [
  { role: "Macro", confidence: "—", alignment: "Macro leads", divergence: "Contained", state: "Stable", accent: "cognition" },
  { role: "Flow", confidence: "—", alignment: "Bid-led", divergence: "Contained", state: "Monitor", accent: "flow" },
  { role: "Risk", confidence: "—", alignment: "Stress-led", divergence: "Wide", state: "Tighten", accent: "danger" },
  { role: "Sentiment", confidence: "—", alignment: "Participation hot", divergence: "Contained", state: "Monitor", accent: "sentiment" },
  { role: "Liquidity", confidence: "—", alignment: "Depth thin", divergence: "Wide", state: "Tighten", accent: "consensus" },
  { role: "Orchestrator", confidence: "—", alignment: "Inputs mixed", divergence: "Wide", state: "Measured", accent: "warning" },
];

export const DEMO_DOMINANT_DRIVER = {
  headline: "Depth thin",
  summary: "Depth thin.",
};

export const DEMO_MAIN_RISK = {
  headline: "Momentum exhaustion risk",
  summary: "Impulse aging. Confirmation thin.",
};

export const DEMO_TOP_SCENARIO = {
  title: "Liquidity Sweep Before Continuation",
  probability: "Base",
  summary: "Sweep risk. Reclaim holds.",
};

export const DEMO_AGENT_MESH = [
  { name: "Scout", state: "Standby", tone: "cognition" as const },
  { name: "Analyst", state: "Working", tone: "flow" as const },
  { name: "Arbiter", state: "Idle", tone: "consensus" as const },
  { name: "Historian", state: "Standby", tone: "sentiment" as const },
];

export const DEMO_INTEL_BRIEF = {
  title: "Workspace read",
  body: "Posture → stress → scenarios → ops.",
};
