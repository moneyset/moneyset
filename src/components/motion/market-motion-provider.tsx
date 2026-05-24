"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

import { MarketMotionContextProvider } from "@/components/motion/market-motion-context";
import { useMarketMotion } from "@/hooks/use-market-motion";
import type { MarketMotionBundle } from "@/lib/motion/market-motion-engine";
import { useCognitionSimulationStore } from "@/store/cognition-simulation-store";

function setVar(name: string, value: string) {
  if (typeof document === "undefined") return;
  document.documentElement.style.setProperty(name, value);
}

function dangerToWarmth(band: string): number {
  if (band === "calm") return 0.12;
  if (band === "moderate") return 0.18;
  if (band === "elevated") return 0.28;
  if (band === "dangerous") return 0.38;
  return 0.46;
}

function applyAtmosphere(bundle: MarketMotionBundle, dangerBand: string) {
  if (typeof document === "undefined") return;
  const theme = document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark";
  const el = document.documentElement;

  if (theme === "light") {
    setVar("--ms-atmo-fog-opacity", String(0.52 + bundle.intensity * 0.08));
    setVar("--ms-atmo-grid-opacity", String(0.15 + bundle.tension * 0.06));
    setVar("--ms-atmo-vignette-opacity", String(0.1 + bundle.tension * 0.05));
    setVar("--ms-atmo-grain-opacity", String(0.045 + bundle.intensity * 0.02));
  } else {
    setVar("--ms-atmo-fog-opacity", String(0.28 + bundle.intensity * 0.1));
    setVar("--ms-atmo-grid-opacity", String(0.14 + bundle.tension * 0.08));
    setVar("--ms-atmo-vignette-opacity", String(0.12 + bundle.tension * 0.06));
    setVar("--ms-atmo-grain-opacity", String(0.034 + bundle.intensity * 0.018));
  }

  const warmth = dangerToWarmth(dangerBand) + bundle.tension * 0.12;
  setVar("--ms-atmo-warmth", warmth.toFixed(3));
  setVar("--ms-atmo-glow-opacity", (bundle.volatilityGlow * 0.22).toFixed(3));

  for (const [key, val] of Object.entries(bundle.cssVars)) {
    setVar(key, val);
  }

  el.dataset.msMotionPhase = bundle.phase;
  if (bundle.activeEvent) {
    el.dataset.msMotionEvent = bundle.activeEvent;
  } else {
    delete el.dataset.msMotionEvent;
  }
  el.dataset.msMotionLive = bundle.pulses.length > 0 ? "1" : "0";
}

/**
 * Global market motion intelligence — CSS variables, atmosphere, cognition pulse state.
 * Merges and extends the legacy environment controller.
 */
export function MarketMotionProvider({ children }: { children: ReactNode }) {
  const [breathPhase, setBreathPhase] = useState(0);
  const startRef = useRef(0);
  const bundle = useMarketMotion(breathPhase);
  const derived = useCognitionSimulationStore((s) => s.derived);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setBreathPhase(0);
      return;
    }

    startRef.current = performance.now();
    let id = 0;

    const loop = (t: number) => {
      const elapsed = (t - startRef.current) / 1000;
      const duration = bundle.breathDurationSec;
      setBreathPhase((elapsed % duration) / duration);
      id = requestAnimationFrame(loop);
    };

    id = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(id);
  }, [bundle.breathDurationSec]);

  useEffect(() => {
    applyAtmosphere(bundle, derived.dangerBand);
  }, [bundle, derived.dangerBand]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const el = document.documentElement;
    const obs = new MutationObserver(() => applyAtmosphere(bundle, derived.dangerBand));
    obs.observe(el, { attributes: true, attributeFilter: ["data-theme"] });
    return () => obs.disconnect();
  }, [bundle, derived.dangerBand]);

  useEffect(() => {
    setVar("--ms-parallax-x", "0px");
    setVar("--ms-parallax-y", "0px");
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const onOver = (e: Event) => {
      const t = e.target as HTMLElement | null;
      if (!t) return;
      const focus = t.closest?.("[data-ms-focus]");
      document.documentElement.dataset.msFocus = focus ? "1" : "0";
    };

    window.addEventListener("pointerover", onOver, { passive: true, capture: true });
    return () => window.removeEventListener("pointerover", onOver, true);
  }, []);

  return <MarketMotionContextProvider value={bundle}>{children}</MarketMotionContextProvider>;
}
