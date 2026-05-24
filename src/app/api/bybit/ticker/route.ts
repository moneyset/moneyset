import { NextResponse } from "next/server";

import { BYBIT_REST_BASE_DEFAULT, normalizeBybitCategory } from "@/services/bybit/config";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const category = normalizeBybitCategory(searchParams.get("category") ?? undefined);
    const symbol =
      searchParams.get("symbol")?.trim().replace(/[^A-Z0-9]/gi, "").toUpperCase() || "BTCUSDT";

    const url = `${BYBIT_REST_BASE_DEFAULT}/v5/market/tickers?category=${category}&symbol=${symbol}`;
    const res = await fetch(url, { cache: "no-store" });
    const json = (await res.json()) as BybitTickerResponse;

    if (!res.ok || json.retCode !== 0 || !json.result?.list?.[0]?.lastPrice) {
      return NextResponse.json({ ok: false, error: json.retMsg ?? "Ticker fetch failed" }, { status: 502 });
    }

    const row = json.result.list[0];
    const lastPrice = Number(row.lastPrice);

    return NextResponse.json({
      ok: true,
      lastPrice: Number.isFinite(lastPrice) ? lastPrice : null,
      ts: Date.now(),
    });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "Ticker error" },
      { status: 500 },
    );
  }
}

type BybitTickerResponse = {
  retCode?: number;
  retMsg?: string;
  result?: {
    list?: Array<{
      symbol?: string;
      lastPrice?: string;
      turnover24h?: string;
    }>;
  };
};
