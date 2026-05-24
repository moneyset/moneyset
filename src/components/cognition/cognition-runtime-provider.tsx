"use client";

import type { ReactNode } from "react";

import { AttentionPriorityProvider } from "@/components/cognition/attention-priority-context";
import { CategoryExperienceBridge } from "@/components/experience/category-experience-bridge";
import { CognitionDramaBridge } from "@/components/cognition/cognition-drama-bridge";
import { MarketMotionProvider } from "@/components/motion/market-motion-provider";
import { useCognitionArchiver } from "@/hooks/use-cognition-archiver";
import { useCognitionSimulationTick } from "@/hooks/use-cognition-simulation-tick";
import { useBinanceMarket } from "@/hooks/use-binance-market";
import { useLiveExecutionIntelBridge } from "@/hooks/use-live-execution-intel-bridge";
import { useMarketCognitionBridge } from "@/hooks/use-market-cognition-bridge";
import { useOpenRouterCognition } from "@/hooks/use-openrouter-cognition";
import { useTelegramBridge } from "@/hooks/use-telegram-bridge";

export function CognitionRuntimeProvider({ children }: { children: ReactNode }) {
  useCognitionSimulationTick(true);
  useBinanceMarket("BTCUSDT", true);
  useMarketCognitionBridge(true);
  useLiveExecutionIntelBridge(true);
  useOpenRouterCognition(true);
  useCognitionArchiver(true);
  useTelegramBridge(true);

  return (
    <MarketMotionProvider>
      <CategoryExperienceBridge>
        <CognitionDramaBridge>
          <AttentionPriorityProvider>{children}</AttentionPriorityProvider>
        </CognitionDramaBridge>
      </CategoryExperienceBridge>
    </MarketMotionProvider>
  );
}
