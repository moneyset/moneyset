"use client";

import { AnimatePresence, m } from "framer-motion";
import { useCallback, useEffect, useState } from "react";

import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { cinematicIntroCopy } from "@/lib/i18n/trust-surface";
import { msEase } from "@/lib/theme/motion";
import { useUiPrefsStore } from "@/store/ui-prefs-store";

/**
 * Premium launch splash — text wordmark, no image.
 * Four stages: wordmark → tagline → loading line → exit.
 * Total: ~1 200ms standard, ~600ms reduced-motion.
 */

const STAGE_MS = {
  wordmark: 0,
  tagline: 320,
  loading: 740,
  exit: 1320,
} as const;

const STAGE_MS_REDUCED = {
  wordmark: 0,
  tagline: 120,
  loading: 260,
  exit: 560,
} as const;

const EXIT_S = 0.52;
const EXIT_REDUCED_S = 0.22;

export function MoneysetCinematicIntro({ onExited }: { onExited: () => void }) {
  const reduce = useReducedMotion();
  const locale = useUiPrefsStore((s) => s.uiLocale);
  const copy = cinematicIntroCopy(locale);
  const stages = reduce ? STAGE_MS_REDUCED : STAGE_MS;

  const [phase, setPhase] = useState<"wordmark" | "tagline" | "loading" | "exit">("wordmark");
  const [visible, setVisible] = useState(true);

  const scheduleExit = useCallback(() => setVisible(false), []);

  useEffect(() => {
    const timers = [
      window.setTimeout(() => setPhase("tagline"), stages.tagline),
      window.setTimeout(() => setPhase("loading"), stages.loading),
      window.setTimeout(scheduleExit, stages.exit),
    ];
    return () => timers.forEach(window.clearTimeout);
  }, [stages, scheduleExit]);

  const exitDur = reduce ? EXIT_REDUCED_S : EXIT_S;

  return (
    <AnimatePresence onExitComplete={onExited}>
      {visible ? (
        <m.div
          key="ms-cinematic"
          className="ms-cinematic-intro"
          role="status"
          aria-label="MONEYSET loading"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: exitDur, ease: msEase }}
        >
          {/* Ambient field */}
          <div className="ms-cinematic-intro__veil" aria-hidden />

          {/* Center stage */}
          <div className="ms-cinematic-intro__stage">

            {/* Wordmark */}
            <m.p
              className="ms-cinematic-intro__wordmark"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: reduce ? 0.2 : 0.55, ease: msEase }}
            >
              MONEYSET
            </m.p>

            {/* Tagline */}
            <AnimatePresence>
              {phase !== "wordmark" ? (
                <m.p
                  key="tagline"
                  className="ms-cinematic-intro__tagline"
                  initial={{ opacity: 0, y: 7 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: reduce ? 0.18 : 0.44, ease: msEase }}
                >
                  {copy.tagline}
                </m.p>
              ) : null}
            </AnimatePresence>
          </div>

          {/* Loading status — bottom */}
          <AnimatePresence>
            {phase === "loading" ? (
              <m.div
                key="loading"
                className="ms-cinematic-intro__loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.22, ease: msEase }}
                aria-hidden
              >
                <span className="ms-cinematic-intro__loading-dot" />
                <span>{copy.loadingLine}</span>
              </m.div>
            ) : null}
          </AnimatePresence>
        </m.div>
      ) : null}
    </AnimatePresence>
  );
}
