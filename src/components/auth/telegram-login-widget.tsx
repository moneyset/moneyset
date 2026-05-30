"use client";

import { useEffect, useRef } from "react";

import { telegramBotUsername, telegramLoginCallbackUrl } from "@/lib/auth/telegram-links";
import { pickLocale } from "@/lib/i18n/cognition-dict";
import { useUiPrefsStore } from "@/store/ui-prefs-store";

type TelegramLoginWidgetProps = Readonly<{
  nextPath?: string;
  className?: string;
}>;

/** Browser-only Telegram Login Widget (one-click, cookie session via callback). */
export function TelegramLoginWidget({ nextPath = "/", className }: TelegramLoginWidgetProps) {
  const locale = useUiPrefsStore((s) => s.uiLocale);
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const bot = telegramBotUsername();
    const host = hostRef.current;
    if (!bot || !host) return;

    host.innerHTML = "";
    const script = document.createElement("script");
    script.src = "https://telegram.org/js/telegram-widget.js?22";
    script.async = true;
    script.setAttribute("data-telegram-login", bot);
    script.setAttribute("data-size", "large");
    script.setAttribute("data-radius", "8");
    script.setAttribute("data-auth-url", telegramLoginCallbackUrl(nextPath));
    script.setAttribute("data-request-access", "write");
    host.appendChild(script);

    return () => {
      host.innerHTML = "";
    };
  }, [nextPath]);

  if (!telegramBotUsername()) {
    return (
      <p className="text-center text-[11px] leading-relaxed text-ms-faint">
        {pickLocale(locale, "Telegram sign-in is not available on this build.", "Вход через Telegram недоступен в этой сборке.")}
      </p>
    );
  }

  return <div ref={hostRef} className={className} data-ms-telegram-login-widget />;
}
