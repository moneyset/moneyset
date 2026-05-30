"use client";

import { useEffect, useState } from "react";
import { ArrowRight, Link2, MessageSquareText } from "lucide-react";

import { CognitionPanel } from "@/components/ui/panel";
import { Button } from "@/components/ui/button";
import { StatusPill } from "@/components/ui/status-pill";
import { Toggle } from "@/components/ui/toggle";
import { MemberSupportPanel } from "@/components/support/member-support-panel";
import { useTelegramStore } from "@/store/telegram-store";
import { useUiPrefsStore } from "@/store/ui-prefs-store";
import { cn } from "@/lib/utils";
import { useShallow } from "zustand/react/shallow";

export function TelegramSettingsCard() {
  const uiLocale = useUiPrefsStore((s) => s.uiLocale);
  const tg = useTelegramStore(
    useShallow((s) => ({
      status: s.status,
      linkCode: s.linkCode,
      chatId: s.chatId,
      prefs: s.prefs,
      setPending: s.setPending,
      setLinked: s.setLinked,
      reset: s.reset,
    })),
  );

  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    const poll = async () => {
      if (tg.status !== "pending" || !tg.linkCode) return;
      try {
        const res = await fetch(`/api/telegram/link-status?code=${encodeURIComponent(tg.linkCode)}`, { cache: "no-store" });
        const json = (await res.json()) as unknown;
        const obj = (json ?? {}) as Record<string, unknown>;
        if (!alive) return;
        if (obj.ok && obj.status === "linked" && obj.chatId) {
          tg.setLinked({ chatId: String(obj.chatId) });
          setNote(uiLocale === "ru" ? "Telegram связан." : "Telegram linked.");
        }
      } catch {
        // ignore
      }
    };
    poll();
    const id = window.setInterval(poll, 4000);
    return () => {
      alive = false;
      window.clearInterval(id);
    };
  }, [tg, uiLocale]);

  const startLink = async () => {
    setBusy(true);
    setNote(null);
    try {
      const res = await fetch("/api/telegram/link-code", { method: "POST" });
      const json = (await res.json()) as { ok: boolean; code?: string };
      if (!json.ok || !json.code) throw new Error("Link code error");
      tg.setPending(json.code);
      setNote(null);
    } catch {
      setNote(
        uiLocale === "ru"
          ? "Не удалось начать подключение Telegram. Попробуйте снова."
          : "Could not start Telegram linking. Try again.",
      );
    } finally {
      setBusy(false);
    }
  };

  const botUsername = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME?.trim();
  const deeplink = botUsername && tg.linkCode ? `https://t.me/${botUsername}?start=${tg.linkCode}` : null;

  return (
    <CognitionPanel
      eyebrow={uiLocale === "ru" ? "Компаньон" : "Companion"}
      accent="cognition"
      title={uiLocale === "ru" ? "Telegram" : "Telegram"}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="ms-intelligence-summary">
            {uiLocale === "ru"
              ? "Тактические обновления без спама. Связка нужна для команд и редких алертов."
              : "High-signal updates without spam. Link required for commands and rare alerts."}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <StatusPill accent={tg.status === "linked" ? "warning" : "neutral"}>
              {tg.status === "linked"
                ? (uiLocale === "ru" ? "Подключён" : "Connected")
                : tg.status === "pending"
                  ? (uiLocale === "ru" ? "Ожидание" : "Pending")
                  : (uiLocale === "ru" ? "Не подключён" : "Not linked")}
            </StatusPill>
          </div>
        </div>
        <MessageSquareText className="size-5 text-ms-cognition/85" strokeWidth={1.5} aria-hidden />
      </div>

      <div className="mt-5 rounded-ms-xl border border-ms-border bg-ms-elevated/20 p-4">
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button type="button" variant="outline" className="flex-1" onClick={startLink} disabled={busy}>
            <Link2 className="size-4" strokeWidth={1.5} />
            {uiLocale === "ru" ? "Связать Telegram" : "Link Telegram"}
          </Button>
          <Button type="button" variant="ghost" className="flex-1" onClick={tg.reset} disabled={busy}>
            {uiLocale === "ru" ? "Сброс" : "Reset"}
          </Button>
        </div>

        {tg.linkCode ? (
          <div className="mt-4 space-y-2">
            <p className="ms-data-label text-ms-faint">{uiLocale === "ru" ? "Код связки" : "Link code"}</p>
            <div className="rounded-ms-lg border border-ms-border bg-ms-surface/50 px-3 py-2 font-mono text-[12px] text-ms-text">
              {tg.linkCode}
            </div>
            <p className="text-[12px] leading-relaxed text-ms-muted">
              {uiLocale === "ru"
                ? "Отправьте боту: /link CODE. Или откройте deep link ниже."
                : "Send the bot: /link CODE. Or use the deep link below."}
            </p>
            {deeplink ? (
              <a
                className={cn(
                  "ms-focus-ring inline-flex items-center gap-2 rounded-ms-md border border-ms-border bg-ms-surface/60 px-3 py-2",
                  "font-mono text-[10px] uppercase tracking-[0.14em] text-ms-text hover:border-ms-border-mid",
                )}
                href={deeplink}
                target="_blank"
                rel="noreferrer"
              >
                <ArrowRight className="size-4" strokeWidth={1.6} />
                {uiLocale === "ru" ? "Открыть Telegram" : "Open Telegram"}
              </a>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="mt-5 flex flex-col gap-2">
        <Toggle
          checked={tg.prefs.alertsEnabled}
          onCheckedChange={(v) => useTelegramStore.setState((s) => ({ ...s, prefs: { ...s.prefs, alertsEnabled: v } }))}
          label={uiLocale === "ru" ? "Оповещения" : "Alerts"}
        />
      </div>

      {note ? (
        <>
          <div className="mt-4 rounded-ms-lg border border-ms-border bg-ms-elevated/20 px-3 py-2 text-[12px] text-ms-muted">
            {note}
          </div>
          {note.includes("Could not") || note.includes("Не удалось") ? (
            <MemberSupportPanel variant="auth-error" className="mt-3" />
          ) : null}
        </>
      ) : null}

      <MemberSupportPanel variant="general" className="mt-4" />
    </CognitionPanel>
  );
}

