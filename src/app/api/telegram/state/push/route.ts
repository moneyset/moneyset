import { NextResponse } from "next/server";

import type { TelegramPushState } from "@/types/telegram";
import { tgSetLatestState } from "@/services/telegram/memory";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const secret = process.env.CRON_SECRET?.trim();
    if (secret) {
      const auth = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "").trim();
      const header = req.headers.get("x-ms-cron-secret")?.trim();
      if (auth !== secret && header !== secret) {
        return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
      }
    }

    const body = (await req.json()) as TelegramPushState;
    if (!body?.symbol) return NextResponse.json({ ok: false, error: "Missing symbol" }, { status: 400 });
    tgSetLatestState({ ...body, ts: body.ts ?? Date.now() });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : "State push error" }, { status: 500 });
  }
}

