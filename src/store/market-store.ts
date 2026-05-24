"use client";

import { create } from "zustand";

import type { NormalizedMarketState } from "@/types/market-state";

type MarketStore = NormalizedMarketState & {
  setWsPrice: (args: { price: number; ts: number; changePercent24h?: number }) => void;
  setDerived: (args: { realizedVol: number | null; momentum: number | null; ts: number }) => void;
  setPremiumIndex: (args: {
    markPrice: number | null;
    fundingRate: number | null;
    nextFundingTime: number | null;
    ts: number;
  }) => void;
  setOpenInterest: (args: { openInterest: number | null; ts: number }) => void;
  setConnection: (connection: NormalizedMarketState["connection"], error?: string | null) => void;
};

const initial: NormalizedMarketState = {
  symbol: "BTCUSDT",
  price: null,
  ts: null,
  changePercent24h: null,
  markPrice: null,
  fundingRate: null,
  nextFundingTime: null,
  openInterest: null,
  realizedVol: null,
  momentum: null,
  connection: "disconnected",
  lastWsTs: null,
  lastRestTs: null,
  error: null,
};

export const useMarketStore = create<MarketStore>((set) => ({
  ...initial,

  setWsPrice: ({ price, ts, changePercent24h }) =>
    set((s) => ({
      price: s.price === price ? s.price : price,
      ts,
      changePercent24h:
        typeof changePercent24h === "number" && Number.isFinite(changePercent24h)
          ? changePercent24h
          : s.changePercent24h,
      lastWsTs: ts,
      connection: s.connection === "disconnected" ? "live" : s.connection,
      error: null,
    })),

  setDerived: ({ realizedVol, momentum, ts }) =>
    set(() => ({
      realizedVol,
      momentum,
      lastRestTs: ts,
    })),

  setPremiumIndex: ({ markPrice, fundingRate, nextFundingTime, ts }) =>
    set(() => ({
      markPrice,
      fundingRate,
      nextFundingTime,
      lastRestTs: ts,
    })),

  setOpenInterest: ({ openInterest, ts }) =>
    set(() => ({
      openInterest,
      lastRestTs: ts,
    })),

  setConnection: (connection, error = null) =>
    set(() => ({
      connection,
      error,
    })),
}));

