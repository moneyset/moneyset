"use client";

import { useEffect } from "react";

import type { UnifiedMarketSnapshot } from "@/lib/intelligence/types";
import { useIntelligencePipelineStore } from "@/store/intelligence-pipeline-store";
import { useMarketStore } from "@/store/market-store";

const POLL_MS = 45_000;

/**
 * Server-aggregated market state → client market store (REST complement to WS).
 * Lightweight; does not invoke AI.
 */
export function useIntelligenceMarketBridge(enabled = true) {
  const setWsPrice = useMarketStore((s) => s.setWsPrice);
  const setDerived = useMarketStore((s) => s.setDerived);
  const setPremiumIndex = useMarketStore((s) => s.setPremiumIndex);
  const setOpenInterest = useMarketStore((s) => s.setOpenInterest);
  const setConnection = useMarketStore((s) => s.setConnection);
  const setUnifiedMarket = useIntelligencePipelineStore((s) => s.setUnifiedMarket);

  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;

    let alive = true;
    let inflight: AbortController | null = null;

    const pull = async () => {
      inflight?.abort();
      inflight = new AbortController();
      const signal = inflight.signal;
      try {
        const res = await fetch("/api/intelligence/market-state", {
          cache: "no-store",
          signal,
        });
        const json = (await res.json()) as {
          ok: boolean;
          market?: UnifiedMarketSnapshot & {
            tape: {
              price: number | null;
              markPrice: number | null;
              fundingRate: number | null;
              nextFundingTime: number | null;
              openInterest: number | null;
              realizedVol: number | null;
              momentum: number | null;
              connection: string;
              ts: number | null;
              changePercent24h: number | null;
            };
          };
        };
        if (!alive || !json.ok || !json.market?.tape) return;
        setUnifiedMarket(json.market as UnifiedMarketSnapshot);
        const t = json.market.tape;
        const ts = t.ts ?? Date.now();
        if (t.price !== null) {
          setWsPrice({
            price: t.price,
            ts,
            changePercent24h: t.changePercent24h ?? undefined,
          });
        }
        setPremiumIndex({
          markPrice: t.markPrice,
          fundingRate: t.fundingRate,
          nextFundingTime: t.nextFundingTime,
          ts,
        });
        setOpenInterest({ openInterest: t.openInterest, ts });
        setDerived({ realizedVol: t.realizedVol, momentum: t.momentum, ts });
        setConnection(
          t.connection === "live" || t.connection === "stale" || t.connection === "connecting"
            ? t.connection
            : t.price !== null
              ? "live"
              : "disconnected",
          null,
        );
      } catch (e) {
        if (e instanceof Error && e.name === "AbortError") return;
        /* keep WS path */
      }
    };

    pull();
    const id = window.setInterval(pull, POLL_MS);
    return () => {
      alive = false;
      inflight?.abort();
      window.clearInterval(id);
    };
  }, [enabled, setConnection, setDerived, setOpenInterest, setPremiumIndex, setUnifiedMarket, setWsPrice]);
}
