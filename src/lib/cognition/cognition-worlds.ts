import type { LabSlug } from "@/lib/labs/labs-modules";

/** Distinct experiential identity per major cognition surface. */
export type CognitionWorldId =
  | "liquidity"
  | "agents"
  | "replay"
  | "macro"
  | "sentiment"
  | "memory"
  | "risk"
  | "transmission"
  | "execution";

export type CognitionWorldRhythm =
  | "fluid-drift"
  | "tension-pulse"
  | "temporal-glide"
  | "pressure-gravity"
  | "instability-breath"
  | "tactical-escalation"
  | "resonance-echo"
  | "narrative-wave";

export type CognitionWorldProfile = Readonly<{
  id: CognitionWorldId;
  rhythm: CognitionWorldRhythm;
  accentVar: string;
  accentDimVar: string;
  /** CSS class on frame root */
  atmosphereClass: string;
  density: "sparse" | "balanced" | "dense";
  heroScale: string;
  labelScale: string;
  metaScale: string;
}>;

export const COGNITION_WORLDS: Record<CognitionWorldId, CognitionWorldProfile> = {
  liquidity: {
    id: "liquidity",
    rhythm: "fluid-drift",
    accentVar: "--ms-cognition",
    accentDimVar: "--ms-cognition-dim",
    atmosphereClass: "ms-world-atmosphere--liquidity",
    density: "sparse",
    heroScale: "clamp(1.35rem, 3.8vw, 2.35rem)",
    labelScale: "9px",
    metaScale: "10px",
  },
  agents: {
    id: "agents",
    rhythm: "tension-pulse",
    accentVar: "--ms-flow",
    accentDimVar: "--ms-flow-dim",
    atmosphereClass: "ms-world-atmosphere--agents",
    density: "dense",
    heroScale: "clamp(1.2rem, 2.8vw, 1.75rem)",
    labelScale: "10px",
    metaScale: "9px",
  },
  replay: {
    id: "replay",
    rhythm: "temporal-glide",
    accentVar: "--ms-consensus",
    accentDimVar: "--ms-consensus-dim",
    atmosphereClass: "ms-world-atmosphere--replay",
    density: "balanced",
    heroScale: "clamp(1.25rem, 3.2vw, 2rem)",
    labelScale: "9px",
    metaScale: "10px",
  },
  macro: {
    id: "macro",
    rhythm: "pressure-gravity",
    accentVar: "--ms-warning",
    accentDimVar: "--ms-warning-dim",
    atmosphereClass: "ms-world-atmosphere--macro",
    density: "sparse",
    heroScale: "clamp(1.3rem, 3.5vw, 2.2rem)",
    labelScale: "9px",
    metaScale: "10px",
  },
  sentiment: {
    id: "sentiment",
    rhythm: "narrative-wave",
    accentVar: "--ms-sentiment",
    accentDimVar: "--ms-sentiment-dim",
    atmosphereClass: "ms-world-atmosphere--sentiment",
    density: "balanced",
    heroScale: "clamp(1.28rem, 3.3vw, 2.1rem)",
    labelScale: "9px",
    metaScale: "10px",
  },
  memory: {
    id: "memory",
    rhythm: "resonance-echo",
    accentVar: "--ms-consensus",
    accentDimVar: "--ms-consensus-dim",
    atmosphereClass: "ms-world-atmosphere--memory",
    density: "sparse",
    heroScale: "clamp(1.22rem, 3vw, 1.95rem)",
    labelScale: "8px",
    metaScale: "10px",
  },
  risk: {
    id: "risk",
    rhythm: "instability-breath",
    accentVar: "--ms-danger",
    accentDimVar: "--ms-danger-dim",
    atmosphereClass: "ms-world-atmosphere--risk",
    density: "balanced",
    heroScale: "clamp(1.18rem, 2.9vw, 1.85rem)",
    labelScale: "9px",
    metaScale: "9px",
  },
  transmission: {
    id: "transmission",
    rhythm: "pressure-gravity",
    accentVar: "--ms-flow",
    accentDimVar: "--ms-flow-dim",
    atmosphereClass: "ms-world-atmosphere--transmission",
    density: "dense",
    heroScale: "clamp(1.15rem, 2.7vw, 1.7rem)",
    labelScale: "9px",
    metaScale: "9px",
  },
  execution: {
    id: "execution",
    rhythm: "tactical-escalation",
    accentVar: "--ms-flow",
    accentDimVar: "--ms-flow-dim",
    atmosphereClass: "ms-world-atmosphere--execution",
    density: "dense",
    heroScale: "clamp(1.4rem, 4vw, 2.5rem)",
    labelScale: "10px",
    metaScale: "9px",
  },
};

export function getCognitionWorld(id: CognitionWorldId): CognitionWorldProfile {
  return COGNITION_WORLDS[id];
}

export function labSlugToWorld(slug: LabSlug): CognitionWorldId {
  const map: Record<LabSlug, CognitionWorldId> = {
    chart: "execution",
    liquidity: "liquidity",
    macro: "macro",
    sentiment: "sentiment",
    replay: "replay",
    "strategy-memory": "memory",
    "cross-asset": "transmission",
    "risk-radar": "risk",
  };
  return map[slug];
}

export function worldFrameClass(id: CognitionWorldId): string {
  return `ms-cognition-world ms-cognition-world--${id}`;
}

/** Map cognition machine ids (labs) to experiential worlds. */
export function machineToWorld(machine: string): CognitionWorldId {
  const map: Record<string, CognitionWorldId> = {
    chart: "execution",
    liquidity: "liquidity",
    macro: "macro",
    sentiment: "sentiment",
    replay: "replay",
    memory: "memory",
    "cross-asset": "transmission",
    "risk-radar": "risk",
  };
  return map[machine] ?? "execution";
}
