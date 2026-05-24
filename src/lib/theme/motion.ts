/** Framer Motion — low-frequency, institutional, restrained. */

export const msEase = [0.22, 1, 0.36, 1] as const;
export const msEaseSoft = [0.45, 0, 0.55, 1] as const;

export const msTransition = {
  instant: { duration: 0.1, ease: msEase },
  fast: { duration: 0.2, ease: msEase },
  medium: { duration: 0.38, ease: msEase },
  slow: { duration: 0.56, ease: msEase },
  reveal: { duration: 0.72, ease: msEase },
} as const;

export const msFade = {
  initial: { opacity: 0, y: 1.5 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -1 },
} as const;

export const msFadeScale = {
  initial: { opacity: 0, scale: 0.992 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.995 },
} as const;

export const msHoverLift = {
  rest: { y: 0, boxShadow: "var(--ms-shadow-sm)" },
  hover: {
    y: -1,
    boxShadow: "var(--ms-shadow-md)",
    transition: msTransition.fast,
  },
} as const;

/** Map motion phase to transition duration scale (1 = default). */
export function motionPhaseDurationScale(phase: string): number {
  if (phase === "critical") return 0.72;
  if (phase === "strained") return 0.86;
  if (phase === "building") return 0.94;
  return 1;
}

export const msStagger = {
  container: {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.035, delayChildren: 0.02 },
    },
  },
  item: {
    hidden: { opacity: 0, y: 4 },
    show: {
      opacity: 1,
      y: 0,
      transition: msTransition.medium,
    },
  },
} as const;
