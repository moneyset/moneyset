import { NextResponse } from "next/server";

import { binanceOpenInterest } from "@/services/binance/rest";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const symbol =
      searchParams.get("symbol")?.trim().replace(/[^A-Z0-9]/gi, "").toUpperCase() || "BTCUSDT";
    const openInterest = await binanceOpenInterest(symbol);
    return NextResponse.json({ ok: true, openInterest, ts: Date.now() });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "Binance openInterest error" },
      { status: 502 },
    );
  }
}

