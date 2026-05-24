"use client";

import { useEffect, useRef } from "react";

import { useMarketStore } from "@/store/market-store";
import { useCognitionSimulationStore } from "@/store/cognition-simulation-store";
import { marketEntry } from "@/lib/market/market-log";
import { useShallow } from "zustand/react/shallow";

function bandVol(v: number | null): "compressing" | "neutral" | "expanding" | null {
  if (v === null) return null;
  if (v <= 18) return "compressing";
  if (v >= 46) return "expanding";
  return "neutral";
}

export function useMarketCognitionBridge(enabled = true) {
  const push = useCognitionSimulationStore((s) => s.pushExternalEntry);
  const market = useMarketStore(
    useShallow((s) => ({
      price: s.price,
      realizedVol: s.realizedVol,
      momentum: s.momentum,
      fundingRate: s.fundingRate,
      openInterest: s.openInterest,
    })),
  );

  const prev = useRef<{
    volBand: ReturnType<typeof bandVol>;
    momentumBand: "neg" | "neutral" | "pos" | null;
    lastPrice: number | null;
  }>({ volBand: null, momentumBand: null, lastPrice: null });

  useEffect(() => {
    if (!enabled) return;

    const volBand = bandVol(market.realizedVol);
    const momentumBand =
      typeof market.momentum === "number"
        ? market.momentum >= 35
          ? "pos"
          : market.momentum <= -35
            ? "neg"
            : "neutral"
        : null;

    if (volBand && volBand !== prev.current.volBand) {
      push(
        marketEntry({
          entryType: "VOLATILITY",
          priority: volBand === "expanding" ? "important" : "informational",
          headline: volBand === "expanding" ? "VOLATILITY EXPANSION" : volBand === "compressing" ? "VOLATILITY COMPRESSION" : "VOLATILITY NEUTRAL",
          summary:
            volBand === "expanding"
              ? "Realized vol up; continuation costs more liquidity."
              : volBand === "compressing"
                ? "Realized vol down; break needs follow-through."
                : "Vol bucket unchanged.",
          whyMatters: "Vol step changes fragility and invalidation pace.",
          message: { kind: "mkt_vol", band: volBand },
        }),
        "mkt-vol-band",
        30_000,
      );
      prev.current.volBand = volBand;
    }

    if (momentumBand && momentumBand !== prev.current.momentumBand) {
      push(
        marketEntry({
          entryType: "FLOW",
          priority: momentumBand === "neg" ? "important" : "informational",
          headline:
            momentumBand === "pos"
              ? "PARTICIPATION BROAD"
              : momentumBand === "neg"
                ? "PARTICIPATION THIN"
                : "PARTICIPATION FLAT",
          summary:
            momentumBand === "pos"
              ? "Breadth broad."
              : momentumBand === "neg"
                ? "Breadth thin."
                : "Breadth flat.",
          whyMatters: "Alignment shifts.",
          message: { kind: "mkt_momentum", band: momentumBand },
        }),
        "mkt-momentum-band",
        26_000,
      );
      prev.current.momentumBand = momentumBand;
    }

    if (market.fundingRate !== null && market.fundingRate >= 0.0009) {
      push(
        marketEntry({
          entryType: "LIQUIDITY",
          priority: "important",
          headline: "FUNDING PRESSURE",
          summary: "Funding elevated; carry taxes clean continuation.",
          whyMatters: "Crowding widens sweep risk when depth is thin.",
          message: { kind: "mkt_funding" },
        }),
        "mkt-funding",
        90_000,
      );
    }

    if (market.price && prev.current.lastPrice) {
      const d = Math.abs((market.price - prev.current.lastPrice) / prev.current.lastPrice);
      if (d >= 0.0048) {
        push(
          marketEntry({
            entryType: "RISK",
            priority: "important",
            headline: "RAPID PRICE DISLOCATION",
          summary: "Fast move. Depth distorted.",
          whyMatters: "Reweight scenarios.",
            message: { kind: "mkt_dislocation" },
          }),
          "mkt-dislocation",
          45_000,
        );
      }
    }

    prev.current.lastPrice = market.price ?? prev.current.lastPrice;
  }, [enabled, market.fundingRate, market.momentum, market.price, market.realizedVol, push]);
}

