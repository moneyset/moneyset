import { NextResponse } from "next/server";

import { BYBIT_REST_BASE_DEFAULT, normalizeBybitCategory } from "@/services/bybit/config";
import type { OhlcCandle } from "@/types/market";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const category = normalizeBybitCategory(searchParams.get("category") ?? undefined);
    const symbol =
      searchParams.get("symbol")?.trim().replace(/[^A-Z0-9]/gi, "").toUpperCase() || "BTCUSDT";
    const interval = searchParams.get("interval")?.trim() || "60";
    const limitRaw = Number(searchParams.get("limit") ?? 240);
    const limit = Math.min(1000, Math.max(10, Number.isFinite(limitRaw) ? limitRaw : 240));

    const url = `${BYBIT_REST_BASE_DEFAULT}/v5/market/kline?category=${category}&symbol=${symbol}&interval=${encodeURIComponent(interval)}&limit=${limit}`;
    const res = await fetch(url, { cache: "no-store" });
    const json = (await res.json()) as BybitKlineResponse;

    if (!res.ok || json.retCode !== 0 || !json.result?.list?.length) {
      return NextResponse.json({ ok: false, error: json.retMsg ?? "Kline fetch failed" }, { status: 502 });
    }

    const candles: OhlcCandle[] = json.result.list
      .map((row): OhlcCandle | null => {
        if (!row || typeof row !== "object") return null;
        const slot = Array.isArray(row) ? row : null;
        if (!slot || slot.length < 6) return null;
        const t = Number(slot[0]);
        const open = Number(slot[1]);
        const high = Number(slot[2]);
        const low = Number(slot[3]);
        const close = Number(slot[4]);
        if (![t, open, high, low, close].every((n) => Number.isFinite(n))) return null;
        return {
          time: Math.floor(t / 1000),
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
      { ok: false, error: e instanceof Error ? e.message : "Kline error" },
      { status: 500 },
    );
  }
}

type BybitKlineResponse = {
  retCode?: number;
  retMsg?: string;
  result?: {
    list?: unknown[][];
  };
};
