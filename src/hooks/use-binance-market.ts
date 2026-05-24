"use client";

import { useEffect, useRef } from "react";

import { connectBtcUsdtSpotTicker, type BtcUsdtTickerTick } from "@/lib/binance";
import { momentumFromCandles, realizedVolFromCandles } from "@/lib/market/metrics";
import type { OhlcCandle } from "@/types/market";
import { useMarketStore } from "@/store/market-store";

type KlineResponse = { ok: boolean; candles?: OhlcCandle[] };
type PremiumIndexResponse = {
  ok: boolean;
  markPrice?: number | null;
  indexPrice?: number | null;
  fundingRate?: number | null;
  nextFundingTime?: number | null;
  ts?: number;
};
type OpenInterestResponse = { ok: boolean; openInterest?: number | null; ts?: number };

function now() {
  return Date.now();
}

/**
 * Live Binance pulse for BTCUSDT:
 * - WebSocket: spot `btcusdt@ticker` (price + 24h change + event time) via `lib/binance`.
 * - REST (throttled): klines for realized vol + momentum, premiumIndex for funding/mark, open interest.
 */
export function useBinanceMarket(symbol = "BTCUSDT", enabled = true) {
  const setWsPrice = useMarketStore((s) => s.setWsPrice);
  const setDerived = useMarketStore((s) => s.setDerived);
  const setPremiumIndex = useMarketStore((s) => s.setPremiumIndex);
  const setOpenInterest = useMarketStore((s) => s.setOpenInterest);
  const setConnection = useMarketStore((s) => s.setConnection);

  const retryRef = useRef(0);
  const disconnectRef = useRef<(() => void) | null>(null);
  const pendingTickRef = useRef<BtcUsdtTickerTick | null>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;
    if (symbol.toUpperCase() !== "BTCUSDT") return;

    let alive = true;
    const stalenessMs = 12_000;
    const staleCheck = window.setInterval(() => {
      const last = useMarketStore.getState().lastWsTs;
      if (!last) return;
      if (Date.now() - last >= stalenessMs) {
        useMarketStore.getState().setConnection("stale", null);
      }
    }, 2500);

    const flushTick = () => {
      rafRef.current = 0;
      const tick = pendingTickRef.current;
      pendingTickRef.current = null;
      if (!alive || !tick) return;
      setWsPrice({
        price: tick.price,
        ts: tick.ts,
        changePercent24h: tick.changePercent24h,
      });
    };

    const open = () => {
      if (!alive) return;
      setConnection("connecting", null);
      disconnectRef.current?.();
      disconnectRef.current = connectBtcUsdtSpotTicker({
        onOpen: () => {
          retryRef.current = 0;
          setConnection("live", null);
        },
        onTick: (tick) => {
          pendingTickRef.current = tick;
          if (rafRef.current === 0) {
            rafRef.current = window.requestAnimationFrame(flushTick);
          }
        },
        onClose: () => {
          if (!alive) return;
          setConnection("disconnected", null);
          const attempt = (retryRef.current += 1);
          const wait = Math.min(12_000, 800 + attempt * 700);
          window.setTimeout(() => open(), wait);
        },
      });
    };

    open();

    return () => {
      alive = false;
      window.clearInterval(staleCheck);
      if (rafRef.current) {
        window.cancelAnimationFrame(rafRef.current);
        rafRef.current = 0;
      }
      pendingTickRef.current = null;
      disconnectRef.current?.();
      disconnectRef.current = null;
    };
  }, [enabled, setConnection, setWsPrice, symbol]);

  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;

    let alive = true;

    const refreshDerived = async () => {
      try {
        const res = await fetch(`/api/binance/kline?symbol=${encodeURIComponent(symbol)}&interval=1&limit=180`, {
          cache: "no-store",
        });
        const json = (await res.json()) as KlineResponse;
        if (!alive || !json.ok || !json.candles) return;
        const realizedVol = realizedVolFromCandles(json.candles, 90);
        const momentum = momentumFromCandles(json.candles, 24);
        setDerived({ realizedVol, momentum, ts: now() });
      } catch {
        // ignore
      }
    };

    const refreshPremium = async () => {
      try {
        const res = await fetch(`/api/binance/premium-index?symbol=${encodeURIComponent(symbol)}`, { cache: "no-store" });
        const json = (await res.json()) as PremiumIndexResponse;
        if (!alive || !json.ok) return;
        setPremiumIndex({
          markPrice: json.markPrice ?? null,
          fundingRate: json.fundingRate ?? null,
          nextFundingTime: json.nextFundingTime ?? null,
          ts: json.ts ?? now(),
        });
      } catch {
        // ignore
      }
    };

    const refreshOI = async () => {
      try {
        const res = await fetch(`/api/binance/open-interest?symbol=${encodeURIComponent(symbol)}`, { cache: "no-store" });
        const json = (await res.json()) as OpenInterestResponse;
        if (!alive || !json.ok) return;
        setOpenInterest({ openInterest: json.openInterest ?? null, ts: json.ts ?? now() });
      } catch {
        // ignore
      }
    };

    refreshDerived();
    refreshPremium();
    refreshOI();

    const id1 = window.setInterval(refreshDerived, 70_000);
    const id2 = window.setInterval(refreshPremium, 50_000);
    const id3 = window.setInterval(refreshOI, 75_000);

    return () => {
      alive = false;
      window.clearInterval(id1);
      window.clearInterval(id2);
      window.clearInterval(id3);
    };
  }, [enabled, setDerived, setOpenInterest, setPremiumIndex, symbol]);
}

