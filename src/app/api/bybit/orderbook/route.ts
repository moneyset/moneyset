import { NextResponse } from "next/server";

import { BYBIT_REST_BASE_DEFAULT, normalizeBybitCategory } from "@/services/bybit/config";

export const dynamic = "force-dynamic";

type SideRow = [string, string];

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const category = normalizeBybitCategory(searchParams.get("category") ?? undefined);
    const symbol =
      searchParams.get("symbol")?.trim().replace(/[^A-Z0-9]/gi, "").toUpperCase() || "BTCUSDT";
    const limitRaw = Number(searchParams.get("limit") ?? 50);
    const limit = Math.min(200, Math.max(1, Number.isFinite(limitRaw) ? limitRaw : 50));

    const url = `${BYBIT_REST_BASE_DEFAULT}/v5/market/orderbook?category=${category}&symbol=${symbol}&limit=${limit}`;
    const res = await fetch(url, { cache: "no-store" });
    const json = (await res.json()) as {
      retCode?: number;
      retMsg?: string;
      result?: { b?: SideRow[]; a?: SideRow[]; ts?: number; u?: number };
    };

    if (!res.ok || json.retCode !== 0 || !json.result) {
      return NextResponse.json({ ok: false, error: json.retMsg ?? "Orderbook fetch failed" }, { status: 502 });
    }

    const bids = Array.isArray(json.result.b) ? json.result.b : [];
    const asks = Array.isArray(json.result.a) ? json.result.a : [];
    const ts = typeof json.result.ts === "number" ? json.result.ts : Date.now();

    return NextResponse.json({
      ok: true,
      bids,
      asks,
      ts,
    });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "Orderbook error" },
      { status: 500 },
    );
  }
}
