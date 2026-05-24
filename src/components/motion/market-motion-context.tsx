"use client";

import { createContext, useContext, type ReactNode } from "react";

import type { MarketMotionBundle } from "@/lib/motion/market-motion-engine";

const MarketMotionContext = createContext<MarketMotionBundle | null>(null);

export function MarketMotionContextProvider({
  value,
  children,
}: {
  value: MarketMotionBundle;
  children: ReactNode;
}) {
  return <MarketMotionContext.Provider value={value}>{children}</MarketMotionContext.Provider>;
}

export function useMarketMotionContext(): MarketMotionBundle | null {
  return useContext(MarketMotionContext);
}
