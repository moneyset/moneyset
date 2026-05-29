"use client";

import { AnimatePresence, m } from "framer-motion";
import { useCallback, useEffect, useMemo, useState } from "react";

import { BrandLogo } from "@/components/ui/brand-logo";
import { Button } from "@/components/ui/button";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { readTelegramInitData } from "@/lib/auth/telegram-client";
import { msTransition } from "@/lib/theme";
import { useAuthStore } from "@/store/auth-store";
import { useEntryStore } from "@/store/entry-store";

const STORAGE_KEY = "moneyset_tg_institutional_intro_done_v1";

function isTelegramWebApp(): boolean {
  return readTelegramInitData() !== null;
}

function readDone(): boolean {
  try {
    return sessionStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

function persistDone(): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, "1");
  } catch {
    /* ignore quota / privacy mode */
  }
}

/** First-time Telegram Mini App — institutional entry only; does not replace Cognition onboarding. */
export function TelegramInstitutionalIntro() {
  const reduceMotion = useReducedMotion();
  const authStatus = useAuthStore((s) => s.status);
  const entryComplete = useEntryStore((s) => s.entryComplete);
  const [eligible, setEligible] = useState(false);
  const [step, setStep] = useState(0);
  const done = step >= 5;

  useEffect(() => {
    if (authStatus === "signed_in" || entryComplete) {
      setEligible(false);
      return;
    }
    setEligible(isTelegramWebApp() && !readDone());
  }, [authStatus, entryComplete]);

  const advance = useCallback(() => setStep((s) => Math.min(s + 1, 5)), []);
  const finalize = useCallback(() => {
    persistDone();
    setStep(5);
  }, []);

  const motionEnter = reduceMotion ? { opacity: 1 } : { opacity: 0, y: 6 };
  const motionActive = reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 };
  const motionDur = reduceMotion ? 0 : msTransition.slow.duration;

  const latticeItems = useMemo(
    () => [
      "Liquidity topology",
      "Structural pressure",
      "Scenario mapping",
      "Tactical execution",
      "Cross-asset transmission",
    ],
    [],
  );

  if (!eligible || done) return null;

  return (
    <div
      className="ms-tg-institutional-intro"
      aria-hidden={false}
      role="dialog"
      aria-modal="true"
      aria-label="Institutional entry"
      data-ms-tg-institutional-intro
    >
      <div className="ms-tg-institutional-intro__safe">
        <AnimatePresence mode="sync">
          {step === 0 ? (
            <m.div
              key="s0"
              className="ms-tg-institutional-intro__screen"
              initial={motionEnter}
              animate={motionActive}
              exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -4 }}
              transition={{ duration: motionDur, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="ms-tg-institutional-intro__brand">
                <BrandLogo href={undefined} size="lg" className="!text-ms-text !text-lg sm:!text-xl md:!tracking-[0.22em]" />
              </div>
              <div className="ms-tg-institutional-intro__meta">
                <p className="ms-tg-institutional-intro__line">Institutional Market Intelligence</p>
              </div>
              <div className="ms-tg-institutional-intro__actions">
                <Button type="button" variant="cognition" className="w-full max-w-[16rem]" onClick={advance}>
                  Enter System
                </Button>
              </div>
            </m.div>
          ) : null}

          {step === 1 ? (
            <m.div
              key="s1"
              className="ms-tg-institutional-intro__screen"
              initial={motionEnter}
              animate={motionActive}
              exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -4 }}
              transition={{ duration: motionDur, ease: [0.22, 1, 0.36, 1] }}
            >
              <p className="ms-tg-institutional-intro__display">
                Markets are not predicted.
                <span className="ms-tg-institutional-intro__display-sub">They are interpreted.</span>
              </p>
              <p className="ms-tg-institutional-intro__caption">Structure • Liquidity • Pressure • Participation</p>
              <div className="ms-tg-institutional-intro__actions ms-tg-institutional-intro__actions--solo">
                <Button type="button" variant="outline" size="sm" className="w-full max-w-[10rem]" onClick={advance}>
                  Continue
                </Button>
              </div>
            </m.div>
          ) : null}

          {step === 2 ? (
            <m.div
              key="s2"
              className="ms-tg-institutional-intro__screen ms-tg-institutional-intro__screen--surface"
              initial={motionEnter}
              animate={motionActive}
              exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -4 }}
              transition={{ duration: motionDur, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="ms-tg-institutional-intro__lattice-bg" aria-hidden />
              <p className="ms-tg-institutional-intro__section-label">Intelligence surface</p>
              <ul className="ms-tg-institutional-intro__floating" aria-label="Operational concepts">
                {latticeItems.map((label, i) => (
                  <li key={label} className="ms-tg-institutional-intro__floating-row" style={{ animationDelay: `${i * 0.14}s` }}>
                    {label}
                  </li>
                ))}
              </ul>
              <div className="ms-tg-institutional-intro__actions ms-tg-institutional-intro__actions--solo">
                <Button type="button" variant="outline" size="sm" className="w-full max-w-[10rem]" onClick={advance}>
                  Continue
                </Button>
              </div>
            </m.div>
          ) : null}

          {step === 3 ? (
            <m.div
              key="s3"
              className="ms-tg-institutional-intro__screen"
              initial={motionEnter}
              animate={motionActive}
              exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -4 }}
              transition={{ duration: motionDur, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="ms-tg-institutional-intro__stance">
                <p>No predictions.</p>
                <p>No noise.</p>
                <p>No retail narratives.</p>
              </div>
              <p className="ms-tg-institutional-intro__resolution">Execution-first intelligence environment.</p>
              <div className="ms-tg-institutional-intro__actions ms-tg-institutional-intro__actions--solo">
                <Button type="button" variant="outline" size="sm" className="w-full max-w-[10rem]" onClick={advance}>
                  Continue
                </Button>
              </div>
            </m.div>
          ) : null}

          {step === 4 ? (
            <m.div
              key="s4"
              className="ms-tg-institutional-intro__screen ms-tg-institutional-intro__screen--atmo"
              initial={motionEnter}
              animate={motionActive}
              exit={reduceMotion ? { opacity: 0 } : { opacity: 0 }}
              transition={{ duration: motionDur, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="ms-tg-institutional-intro__atmo-layer" aria-hidden />
              <p className="ms-tg-institutional-intro__closing">
                See the structure.
                <span className="ms-tg-institutional-intro__closing-sub">Execute with precision.</span>
              </p>
              <div className="ms-tg-institutional-intro__actions">
                <Button type="button" variant="cognition" className="w-full max-w-[16rem]" onClick={finalize}>
                  Initialize Surface
                </Button>
              </div>
            </m.div>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
}
