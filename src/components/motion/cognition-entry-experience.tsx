"use client";

import { m, AnimatePresence } from "framer-motion";
import { useCallback, useEffect, useState } from "react";

import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { msEase, msTransition } from "@/lib/theme";
import { cn } from "@/lib/utils";
import { useUiPrefsStore } from "@/store/ui-prefs-store";
import {
  cognitionEntryEyebrow,
  cognitionEntryLine1,
  cognitionEntryLine2,
  cognitionEntrySkip,
} from "@/lib/i18n/trust-surface";

const STORAGE_KEY = "moneyset_entry_session_v1";

export function readEntryCompletedSession(): boolean {
  if (typeof window === "undefined") return false;
  return sessionStorage.getItem(STORAGE_KEY) === "1";
}

export function writeEntryCompletedSession() {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(STORAGE_KEY, "1");
}

type CognitionEntryExperienceProps = {
  onExited: () => void;
};

/**
 * First-touch entry sequence (brief, skippable).
 */
export function CognitionEntryExperience({ onExited }: CognitionEntryExperienceProps) {
  const reduce = useReducedMotion();
  const locale = useUiPrefsStore((s) => s.uiLocale);
  const [visible, setVisible] = useState(true);

  const requestExit = useCallback(() => {
    writeEntryCompletedSession();
    setVisible(false);
  }, []);

  useEffect(() => {
    if (!visible) return;
    const delay = reduce ? 560 : 3000;
    const t = window.setTimeout(() => requestExit(), delay);
    return () => window.clearTimeout(t);
  }, [visible, reduce, requestExit]);

  return (
    <AnimatePresence
      onExitComplete={() => {
        onExited();
      }}
    >
      {visible ? (
        <m.div
          key="cognition-entry"
          className="fixed inset-0 z-[70] flex flex-col items-center justify-center bg-ms-canvas px-6"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduce ? 0.28 : 0.48, ease: msEase }}
          role="presentation"
        >
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="ms-grid-atmosphere opacity-25" aria-hidden />
          </div>

          <button
            type="button"
            onClick={requestExit}
            className={cn(
              "pointer-events-auto absolute right-4 top-[max(1rem,env(safe-area-inset-top))] z-[2]",
              "ms-focus-ring rounded-ms-md px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-ms-muted",
              "transition-colors hover:text-ms-text",
            )}
          >
            {cognitionEntrySkip(locale)}
          </button>

          <div className="relative z-[1] flex max-w-lg flex-col items-center text-center">
            <m.p
              className="ms-hero-label text-ms-faint"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...msTransition.medium, delay: reduce ? 0 : 0.12 }}
            >
              {cognitionEntryEyebrow(locale)}
            </m.p>
            <m.h1
              className="mt-4 font-mono text-[clamp(1.35rem,5.5vw,2rem)] font-semibold tracking-[0.38em] text-ms-text"
              initial={{ opacity: 0, letterSpacing: "0.48em" }}
              animate={{ opacity: 1, letterSpacing: "0.38em" }}
              transition={{ duration: reduce ? 0.28 : 0.82, ease: msEase, delay: reduce ? 0 : 0.22 }}
            >
              MONEYSET
            </m.h1>
            <m.p
              className="mt-5 max-w-md text-[12px] leading-relaxed text-ms-muted sm:text-[13px]"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...msTransition.slow, delay: reduce ? 0.04 : 0.62 }}
            >
              {cognitionEntryLine1(locale)}
            </m.p>
            <m.p
              className="mt-3 max-w-sm text-[11px] leading-relaxed text-ms-faint"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ ...msTransition.slow, delay: reduce ? 0.08 : 0.95 }}
            >
              {cognitionEntryLine2(locale)}
            </m.p>
          </div>
        </m.div>
      ) : null}
    </AnimatePresence>
  );
}
