"use client";

import { AnimatePresence, m } from "framer-motion";
import Image from "next/image";
import { useCallback, useEffect, useState } from "react";

import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { cinematicIntroCopy, cognitionEntrySkip } from "@/lib/i18n/trust-surface";
import { msEase } from "@/lib/theme";
import { cn } from "@/lib/utils";
import { useUiPrefsStore } from "@/store/ui-prefs-store";

const LOGO_SRC = "/brand/moneyset-logo.png";

/** Premium launch — 1.5–2.5s, every full app entry. */
const INTRO_MS = 2000;
const INTRO_REDUCED_MS = 720;
const EXIT_S = 0.52;
const EXIT_REDUCED_S = 0.28;

type MoneysetCinematicIntroProps = {
  onExited: () => void;
};

/**
 * Full-screen institutional splash — black field, centered mark, calm fade into workspace.
 */
export function MoneysetCinematicIntro({ onExited }: MoneysetCinematicIntroProps) {
  const reduce = useReducedMotion();
  const locale = useUiPrefsStore((s) => s.uiLocale);
  const copy = cinematicIntroCopy(locale);
  const [visible, setVisible] = useState(true);

  const requestExit = useCallback(() => setVisible(false), []);

  useEffect(() => {
    if (!visible) return;
    const delay = reduce ? INTRO_REDUCED_MS : INTRO_MS;
    const t = window.setTimeout(requestExit, delay);
    return () => window.clearTimeout(t);
  }, [visible, reduce, requestExit]);

  const exitDur = reduce ? EXIT_REDUCED_S : EXIT_S;

  return (
    <AnimatePresence onExitComplete={onExited}>
      {visible ? (
        <m.div
          key="ms-cinematic-intro"
          className="ms-cinematic-intro"
          role="dialog"
          aria-modal="true"
          aria-label="MONEYSET"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: exitDur, ease: msEase }}
        >
          <div className="ms-cinematic-intro__veil" aria-hidden />

          <button
            type="button"
            onClick={requestExit}
            className={cn("ms-cinematic-intro__skip ms-focus-ring rounded-ms-md px-2 py-1")}
          >
            {cognitionEntrySkip(locale)}
          </button>

          <m.div
            className="ms-cinematic-intro__stage"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: reduce ? 0.22 : 0.42, ease: msEase }}
          >
            <m.div
              className="ms-cinematic-intro__logo-wrap"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{
                duration: reduce ? 0.32 : 0.62,
                ease: msEase,
                delay: reduce ? 0 : 0.06,
              }}
            >
              <div className="ms-cinematic-intro__logo-glow" aria-hidden />
              <Image
                src={LOGO_SRC}
                alt="MONEYSET"
                width={560}
                height={560}
                priority
                className="ms-cinematic-intro__logo"
                sizes="(max-width: 480px) 68vw, 240px"
              />
            </m.div>

            <m.p
              className="ms-cinematic-intro__tagline"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: reduce ? 0.24 : 0.4, ease: msEase, delay: reduce ? 0.12 : 0.42 }}
            >
              {copy.tagline}
            </m.p>
          </m.div>
        </m.div>
      ) : null}
    </AnimatePresence>
  );
}
