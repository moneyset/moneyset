"use client";

import { pickLocale } from "@/lib/i18n/cognition-dict";
import { isTelegramEmbeddedBrowser, isTelegramMiniApp, openInExternalBrowser } from "@/lib/auth/telegram-client";
import { telegramOidcStartUrl } from "@/lib/auth/telegram-links";
import { useUiPrefsStore } from "@/store/ui-prefs-store";
import { cn } from "@/lib/utils";

type TelegramLoginWidgetProps = Readonly<{
  nextPath?: string;
  className?: string;
}>;

/** Browser Telegram login via OIDC (Authorization Code + PKCE). */
export function TelegramLoginWidget({ nextPath = "/", className }: TelegramLoginWidgetProps) {
  const locale = useUiPrefsStore((s) => s.uiLocale);
  const startPath = telegramOidcStartUrl(nextPath);
  const oidcReady = Boolean(process.env.NEXT_PUBLIC_TELEGRAM_OIDC_CLIENT_ID?.trim());
  const useExternalBrowser =
    typeof window !== "undefined" && isTelegramEmbeddedBrowser() && !isTelegramMiniApp();

  if (!oidcReady) {
    return (
      <p className="text-center text-[11px] leading-relaxed text-ms-faint">
        {pickLocale(locale, "Telegram sign-in is not available on this build.", "Вход через Telegram недоступен в этой сборке.")}
      </p>
    );
  }

  const label = pickLocale(locale, "Log in with Telegram", "Войти через Telegram");
  const inModal = className?.includes("ms-auth-modal__telegram-widget");
  const classNames = cn(
    "ms-focus-ring inline-flex w-full items-center justify-center gap-2.5 rounded-ms-lg px-4 py-2.5",
    "text-[15px] font-semibold transition-opacity hover:opacity-95",
    !inModal && "bg-[#54a9eb] text-white",
    className,
  );

  const icon = (
    <svg viewBox="0 0 24 24" className="size-5 shrink-0" aria-hidden>
      <path
        fill="currentColor"
        d="M9.04 15.29 8.9 18.6c.23 0 .33-.1.45-.22l2.18-2.08 4.52 3.31c.83.46 1.42.22 1.63-.77l2.98-14.02h.01c.26-1.22-.44-1.7-1.24-1.4L1.18 9.37C-.04 9.82-.02 10.55 1 10.92l5.5 1.72L18.9 5.5c.56-.37 1.07-.17.65.2"
      />
    </svg>
  );

  if (useExternalBrowser) {
    return (
      <button
        type="button"
        data-ms-telegram-login-widget
        className={classNames}
        onClick={() => openInExternalBrowser(`${window.location.origin}${startPath}`)}
      >
        {icon}
        {label}
      </button>
    );
  }

  return (
    <a href={startPath} data-ms-telegram-login-widget className={classNames}>
      {icon}
      {label}
    </a>
  );
}
