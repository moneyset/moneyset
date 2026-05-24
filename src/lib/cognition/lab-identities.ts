import type { LabSlug } from "@/lib/labs/labs-modules";

export type LabIdentity = Readonly<{
  slug: LabSlug;
  /** CSS hook: data-ms-machine="chart" */
  machine: string;
  accentVar: string;
  accentDimVar: string;
  layout: "terrain" | "topology" | "matrix" | "narrative" | "timeline" | "archive" | "transmission" | "radar" | "warroom";
  centerpiece: string;
}>;

export const LAB_IDENTITIES: Record<LabSlug, LabIdentity> = {
  chart: {
    slug: "chart",
    machine: "chart",
    accentVar: "--ms-flow",
    accentDimVar: "--ms-flow-dim",
    layout: "terrain",
    centerpiece: "execution-terrain",
  },
  liquidity: {
    slug: "liquidity",
    machine: "liquidity",
    accentVar: "--ms-cognition",
    accentDimVar: "--ms-cognition-dim",
    layout: "topology",
    centerpiece: "topology-theater",
  },
  macro: {
    slug: "macro",
    machine: "macro",
    accentVar: "--ms-warning",
    accentDimVar: "--ms-warning-dim",
    layout: "matrix",
    centerpiece: "pressure-matrix",
  },
  sentiment: {
    slug: "sentiment",
    machine: "sentiment",
    accentVar: "--ms-sentiment",
    accentDimVar: "--ms-sentiment-dim",
    layout: "narrative",
    centerpiece: "narrative-tension",
  },
  replay: {
    slug: "replay",
    machine: "replay",
    accentVar: "--ms-consensus",
    accentDimVar: "--ms-consensus-dim",
    layout: "timeline",
    centerpiece: "structural-replay",
  },
  "strategy-memory": {
    slug: "strategy-memory",
    machine: "memory",
    accentVar: "--ms-consensus",
    accentDimVar: "--ms-consensus-dim",
    layout: "archive",
    centerpiece: "memory-archive",
  },
  "cross-asset": {
    slug: "cross-asset",
    machine: "cross-asset",
    accentVar: "--ms-flow",
    accentDimVar: "--ms-flow-dim",
    layout: "transmission",
    centerpiece: "transmission-engine",
  },
  "risk-radar": {
    slug: "risk-radar",
    machine: "risk-radar",
    accentVar: "--ms-danger",
    accentDimVar: "--ms-danger-dim",
    layout: "radar",
    centerpiece: "fragility-radar",
  },
};

export function getLabIdentity(slug: LabSlug): LabIdentity {
  return LAB_IDENTITIES[slug];
}
