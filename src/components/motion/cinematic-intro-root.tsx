"use client";

import { m } from "framer-motion";
import { useState, type ReactNode } from "react";

import { MoneysetCinematicIntro } from "@/components/motion/moneyset-cinematic-intro";
import { msTransition } from "@/lib/theme";
import { cn } from "@/lib/utils";

/** Cinematic intro on every platform entry — fast, repeatable, institutional. */
export function CinematicIntroRoot({ children }: { children: ReactNode }) {
  const [introActive, setIntroActive] = useState(true);

  return (
    <>
      {introActive ? <MoneysetCinematicIntro onExited={() => setIntroActive(false)} /> : null}
      <m.div
        className={cn(
          "flex min-h-0 min-w-0 flex-1 flex-col",
          introActive && "pointer-events-none select-none",
        )}
        initial={introActive ? { opacity: 0 } : false}
        animate={{ opacity: 1 }}
        transition={
          introActive
            ? { duration: 0.55, ease: [0.22, 1, 0.36, 1], delay: 0.08 }
            : msTransition.fast
        }
        aria-hidden={introActive}
      >
        {children}
      </m.div>
    </>
  );
}
