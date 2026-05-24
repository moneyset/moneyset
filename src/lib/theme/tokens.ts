/**
 * TypeScript mirror of design contract — use for programmatic motion / props.
 * Source of truth for values remains CSS (`src/styles/tokens.css`).
 */

export const MS_MOTION = {
  ease: [0.22, 1, 0.36, 1] as const,
  durationMs: {
    instant: 100,
    fast: 180,
    medium: 320,
    slow: 520,
    reveal: 720,
    ambient: 16_000,
    breathe: 6500,
  },
} as const;

export type MsSemanticAccent = "cognition" | "flow" | "sentiment" | "danger" | "warning" | "consensus" | "neutral";
