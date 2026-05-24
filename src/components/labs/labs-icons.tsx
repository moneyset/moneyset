import type { LucideIcon } from "lucide-react";
import {
  Activity,
  Brain,
  Droplets,
  Globe2,
  LayoutGrid,
  LineChart,
  Newspaper,
  Radar,
  Repeat,
} from "lucide-react";

import type { LabSlug } from "@/lib/labs/labs-modules";

export const LAB_ICONS: Record<LabSlug, LucideIcon> = {
  chart: LineChart,
  liquidity: Droplets,
  macro: Newspaper,
  sentiment: Activity,
  replay: Repeat,
  "strategy-memory": Brain,
  "cross-asset": Globe2,
  "risk-radar": Radar,
};

export const LABS_OVERVIEW_ICON: LucideIcon = LayoutGrid;
