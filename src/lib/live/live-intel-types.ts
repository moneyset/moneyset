/** Compressed live execution intelligence — no fake precision, no raw metric dumps. */

export type LiveEmphasisId =
  | "liquidity_instability"
  | "reclaim_stress"
  | "compression_coil"
  | "vol_transition"
  | "sponsorship_soft"
  | "participation_shift"
  | "funding_carry"
  | "tape_dislocation"
  | "stable_field";

export type LiveBehaviorRead =
  | "defensive"
  | "measured"
  | "reactive_favored"
  | "continuation_fragile"
  | "expansion_vulnerable";

export type LiveExecutionIntel = Readonly<{
  /** Stable key for coalescing UI / buffer writes. */
  signature: string;
  emphasisId: LiveEmphasisId;
  emphasisLine: string;
  behavior: LiveBehaviorRead;
  behaviorLine: string;
  sessionLine: string;
  /** Single secondary condition — optional, already compressed. */
  secondaryLine: string | null;
}>;

export type ExecutionEvolutionFrame = Readonly<{
  ts: number;
  signature: string;
  emphasisId: LiveEmphasisId;
  emphasisLine: string;
  behaviorLine: string;
}>;
