import { NextResponse } from "next/server";

import { binancePremiumIndex } from "@/services/binance/rest";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const symbol =
      searchParams.get("symbol")?.trim().replace(/[^A-Z0-9]/gi, "").toUpperCase() || "BTCUSDT";
    const data = await binancePremiumIndex(symbol);
    return NextResponse.json({ ok: true, ...data, ts: Date.now() });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "Binance premiumIndex error" },
      { status: 502 },
    );
  }
}

