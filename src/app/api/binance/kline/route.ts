import { NextResponse } from "next/server";

import { BINANCE_FAPI_BASE } from "@/services/binance/constants";
import type { OhlcCandle } from "@/types/market";

export const dynamic = "force-dynamic";

/** Maps legacy Bybit interval codes to Binance interval strings */
function intervalToBinance(iv: string): string {
  const v = iv.trim();
  switch (v) {
    case "1":
      return "1m";
    case "3":
      return "3m";
    case "5":
      return "5m";
    case "15":
      return "15m";
    case "60":
      return "1h";
    case "240":
      return "4h";
    case "1440":
    case "D":
      return "1d";
    default:
      if (/^[0-9]+m$/i.test(v)) return v;
      return "1h";
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const symbol =
      searchParams.get("symbol")?.trim().replace(/[^A-Z0-9]/gi, "").toUpperCase() || "BTCUSDT";
    const intervalSrc = searchParams.get("interval")?.trim() || "60";
    const interval = intervalToBinance(intervalSrc);

    const limitRaw = Number(searchParams.get("limit") ?? 280);
    const limit = Math.min(1500, Math.max(20, Number.isFinite(limitRaw) ? limitRaw : 280));

    const url = `${BINANCE_FAPI_BASE}/fapi/v1/klines?symbol=${symbol}&interval=${encodeURIComponent(interval)}&limit=${limit}`;
    const res = await fetch(url, { cache: "no-store" });
    const json = (await res.json()) as unknown;

    if (!res.ok || !Array.isArray(json)) {
      return NextResponse.json({ ok: false, error: `Binance kline failed (${res.status})` }, { status: 502 });
    }

    const candles: OhlcCandle[] = (json as unknown[])
      .map((row): OhlcCandle | null => {
        if (!Array.isArray(row) || row.length < 6) return null;
        const tOpen = Number(row[0]);
        const open = Number(row[1]);
        const high = Number(row[2]);
        const low = Number(row[3]);
        const close = Number(row[4]);
        if (![tOpen, open, high, low, close].every((n) => Number.isFinite(n))) return null;
        return {
          time: Math.floor(tOpen / 1000),
          open,
          high,
          low,
          close,
        };
      })
      .filter((c): c is OhlcCandle => c !== null);

    candles.sort((a, b) => a.time - b.time);

    return NextResponse.json({ ok: true, candles });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "Binance kline error" },
      { status: 500 },
    );
  }
}
