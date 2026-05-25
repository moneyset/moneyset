import { NextResponse } from "next/server";

import { tgAllChats, tgGetChat } from "@/services/telegram/memory";
import { tgSendMessage } from "@/services/telegram/bot-api";

export const dynamic = "force-dynamic";

type Req = {
  text: string;
  minLevel?: "rare" | "standard";
};

export async function POST(req: Request) {
  try {
    const secret = process.env.CRON_SECRET?.trim() || process.env.TELEGRAM_ALERT_SECRET?.trim();
    if (secret) {
      const auth = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "").trim();
      const header = req.headers.get("x-ms-cron-secret")?.trim();
      if (auth !== secret && header !== secret) {
        return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
      }
    }

    const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
    if (!token) return NextResponse.json({ ok: false, error: "TELEGRAM_BOT_TOKEN not configured" }, { status: 200 });

    const body = (await req.json()) as Req;
    const text = body?.text?.trim();
    if (!text) return NextResponse.json({ ok: false, error: "Missing text" }, { status: 400 });

    const chats = tgAllChats().filter((c) => c.prefs.alertsEnabled);
    const eligible = chats.filter((c) => (body.minLevel ?? "standard") === "rare" ? c.prefs.alertLevel === "rare" : true);

    await Promise.all(
      eligible.map(async (c) => {
        const rec = tgGetChat(c.chatId);
        if (!rec) return;
        await tgSendMessage({
          chat_id: rec.chatId,
          text,
          parse_mode: "HTML",
          disable_web_page_preview: true,
        });
      }),
    );

    return NextResponse.json({ ok: true, delivered: eligible.length });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : "Alert send error" }, { status: 502 });
  }
}

