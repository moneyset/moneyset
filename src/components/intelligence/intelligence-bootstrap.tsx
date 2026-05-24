"use client";

import { useBinanceMarket } from "@/hooks/use-binance-market";
import { useIntelligenceMarketBridge } from "@/hooks/use-intelligence-market-bridge";
import { useDailyBrief } from "@/hooks/use-daily-brief";
import { useIntelligencePipeline } from "@/hooks/use-intelligence-pipeline";
import { useProfileAccess } from "@/hooks/use-profile-access";

/** Wires live tape + server market aggregation + profile access sync. */
export function IntelligenceBootstrap() {
  useBinanceMarket("BTCUSDT", true);
  useIntelligenceMarketBridge(true);
  useProfileAccess();
  useIntelligencePipeline(true);
  useDailyBrief(true);
  return null;
}
