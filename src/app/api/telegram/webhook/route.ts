import { NextResponse } from "next/server";

import { isTelegramIntegrationEnabled, telegramDisabledResponse } from "@/lib/ops/feature-flags";
import { logOpsEvent } from "@/lib/ops/operational-events";
import { tgLinkChat, tgGetLatestState, tgGetChat, tgSetChatPrefs, tgDefaultLocaleForChat } from "@/services/telegram/memory";
import { tgSendMessage } from "@/services/telegram/bot-api";
import {
  tgFormatConsensus,
  tgFormatDanger,
  tgFormatPosture,
  tgFormatRegime,
  tgFormatScenario,
  tgFormatSummary,
} from "@/services/telegram/format";

export const dynamic = "force-dynamic";

type TgUpdate = {
  message?: {
    text?: string;
    chat?: { id?: number | string };
    from?: { username?: string };
  };
};

function cmd(text: string): { name: string; args: string[] } | null {
  const raw = text.trim();
  if (!raw.startsWith("/")) return null;
  const parts = raw.split(/\s+/g);
  const name = parts[0]!.slice(1).toLowerCase();
  const args = parts.slice(1);
  return { name, args };
}

export async function POST(req: Request) {
  if (!isTelegramIntegrationEnabled()) {
    return NextResponse.json(telegramDisabledResponse());
  }

  try {
    const secret = process.env.TELEGRAM_WEBHOOK_SECRET?.trim();
    if (process.env.NODE_ENV === "production" && !secret) {
      logOpsEvent("telegram_webhook_rejected", { reason: "secret_missing" });
      return NextResponse.json({ ok: false, error: "Webhook not configured" }, { status: 503 });
    }
    if (secret) {
      const got = req.headers.get("x-telegram-bot-api-secret-token")?.trim();
      if (!got || got !== secret) {
        logOpsEvent("telegram_webhook_rejected", { reason: "bad_secret" });
        return NextResponse.json({ ok: false }, { status: 401 });
      }
    }

    const update = (await req.json()) as TgUpdate;
    const text = update.message?.text ?? "";
    const chatIdRaw = update.message?.chat?.id;
    const chatId = chatIdRaw !== undefined ? String(chatIdRaw) : null;
    if (!chatId) return NextResponse.json({ ok: true });

    const c = cmd(text);
    if (!c) return NextResponse.json({ ok: true });

    const state = tgGetLatestState();
    const locale = tgGetChat(chatId)?.prefs.locale ?? tgDefaultLocaleForChat(chatId);

    const reply = async (t: string) => {
      await tgSendMessage({ chat_id: chatId, text: t, parse_mode: "HTML", disable_web_page_preview: true });
    };

    if (c.name === "start") {
      const code = (c.args[0] ?? "").trim().toUpperCase();
      if (code) {
        const username = update.message?.from?.username ?? null;
        const res = tgLinkChat({ code, chatId, username });
        if (!res.ok) {
          await reply(locale === "ru" ? `Код недействителен: ${res.error}` : `Invalid code: ${res.error}`);
        } else {
          await reply(
            locale === "ru"
              ? "Связка подтверждена. Уведомления включены (по умолчанию)."
              : "Link confirmed. Alerts enabled by default.",
          );
        }
        return NextResponse.json({ ok: true });
      }
      await reply(
        locale === "ru"
          ? "<b>MONEYSET</b>\nКоманды: /posture /danger /scenario /consensus /regime /summary\nСвязка: /link CODE"
          : "<b>MONEYSET</b>\nCommands: /posture /danger /scenario /consensus /regime /summary\nLink: /link CODE",
      );
      return NextResponse.json({ ok: true });
    }

    if (c.name === "link") {
      const code = (c.args[0] ?? "").trim().toUpperCase();
      const username = update.message?.from?.username ?? null;
      const res = tgLinkChat({ code, chatId, username });
      if (!res.ok) {
        await reply(locale === "ru" ? `Код недействителен: ${res.error}` : `Invalid code: ${res.error}`);
      } else {
        await reply(locale === "ru" ? "Связка подтверждена. Уведомления включены (по умолчанию)." : "Link confirmed. Alerts enabled by default.");
      }
      return NextResponse.json({ ok: true });
    }

    if (c.name === "lang") {
      const v = (c.args[0] ?? "").toLowerCase();
      if (v !== "en" && v !== "ru") {
        await reply(locale === "ru" ? "Используйте: /lang en или /lang ru" : "Use: /lang en or /lang ru");
        return NextResponse.json({ ok: true });
      }
      tgSetChatPrefs(chatId, { locale: v });
      await reply(v === "ru" ? "Язык: RU" : "Language: EN");
      return NextResponse.json({ ok: true });
    }

    if (c.name === "alerts") {
      const v = (c.args[0] ?? "").toLowerCase();
      if (v === "on") tgSetChatPrefs(chatId, { alertsEnabled: true });
      else if (v === "off") tgSetChatPrefs(chatId, { alertsEnabled: false });
      await reply(locale === "ru" ? "Оповещения обновлены." : "Alerts updated.");
      return NextResponse.json({ ok: true });
    }

    if (!state) {
      await reply(locale === "ru" ? "Когниция ещё не синхронизирована. Откройте веб‑приложение." : "State not synced yet. Open the web app.");
      return NextResponse.json({ ok: true });
    }

    if (c.name === "posture") await reply(tgFormatPosture(locale, state));
    else if (c.name === "danger") await reply(tgFormatDanger(locale, state));
    else if (c.name === "scenario") await reply(tgFormatScenario(locale, state));
    else if (c.name === "consensus") await reply(tgFormatConsensus(locale, state));
    else if (c.name === "regime") await reply(tgFormatRegime(locale, state));
    else if (c.name === "summary") await reply(tgFormatSummary(locale, state));
    else {
      await reply(locale === "ru" ? "Команда не распознана." : "Command not recognized.");
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : "Webhook error" }, { status: 200 });
  }
}

