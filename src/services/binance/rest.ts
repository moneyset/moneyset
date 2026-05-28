import { BINANCE_FAPI_BASE } from "@/services/binance/constants";
import { fetchBinanceJson } from "@/lib/binance/upstream";

export type BinanceSymbol = string;

function cleanSymbol(s: string | null | undefined, fallback = "BTCUSDT"): string {
  const sym = (s ?? fallback).trim().replace(/[^A-Z0-9]/gi, "").toUpperCase();
  return sym || fallback;
}

export async function binanceFuturesPrice(symbol?: string): Promise<number> {
  const sym = cleanSymbol(symbol);
  const url = `${BINANCE_FAPI_BASE}/fapi/v1/ticker/price?symbol=${sym}`;
  const json = await fetchBinanceJson<{ price?: unknown }>(url);
  const price = typeof json.price === "string" ? Number(json.price) : Number(json.price);
  if (!Number.isFinite(price)) throw new Error("Binance price fetch failed");
  return price;
}

export async function binancePremiumIndex(symbol?: string): Promise<{
  markPrice: number | null;
  indexPrice: number | null;
  fundingRate: number | null;
  nextFundingTime: number | null;
}> {
  const sym = cleanSymbol(symbol);
  const url = `${BINANCE_FAPI_BASE}/fapi/v1/premiumIndex?symbol=${sym}`;
  const json = await fetchBinanceJson<Record<string, unknown>>(url);
  const markPrice = Number(json.markPrice);
  const indexPrice = Number(json.indexPrice);
  const fundingRate = Number(json.lastFundingRate);
  const nextFundingTime = Number(json.nextFundingTime);
  return {
    markPrice: Number.isFinite(markPrice) ? markPrice : null,
    indexPrice: Number.isFinite(indexPrice) ? indexPrice : null,
    fundingRate: Number.isFinite(fundingRate) ? fundingRate : null,
    nextFundingTime: Number.isFinite(nextFundingTime) ? nextFundingTime : null,
  };
}

export async function binanceOpenInterest(symbol?: string): Promise<number | null> {
  const sym = cleanSymbol(symbol);
  const url = `${BINANCE_FAPI_BASE}/fapi/v1/openInterest?symbol=${sym}`;
  const json = await fetchBinanceJson<{ openInterest?: unknown }>(url);
  const oi = typeof json.openInterest === "string" ? Number(json.openInterest) : Number(json.openInterest);
  return Number.isFinite(oi) ? oi : null;
}
