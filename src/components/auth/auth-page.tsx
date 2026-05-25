"use client";

import { useMemo, useState } from "react";

import { useTelegramAuth } from "@/hooks/use-telegram-auth";
import { pickLocale } from "@/lib/i18n/cognition-dict";
import { supabaseBrowser } from "@/lib/supabase/browser";
import { useAuthStore } from "@/store/auth-store";
import { useEntryStore } from "@/store/entry-store";
import { useUiPrefsStore } from "@/store/ui-prefs-store";
import { useAuthModalStore } from "@/store/auth-modal-store";

export function AuthPage() {
  const locale = useUiPrefsStore((s) => s.uiLocale);
  const completeEntry = useEntryStore((s) => s.completeEntry);
  const setGuest = useAuthStore((s) => s.setGuest);
  const openAuth = useAuthModalStore((s) => s.openAuth);
  const { signInWithTelegram, busy: telegramBusy, error: telegramError, hasInitData } = useTelegramAuth();
  const [googleBusy, setGoogleBusy] = useState(false);
  const sb = useMemo(() => (typeof window !== "undefined" ? supabaseBrowser() : null), []);
  const inTelegram = typeof window !== "undefined" && Boolean(window.Telegram?.WebApp);

  const busy = telegramBusy || googleBusy;

  const enterAsGuest = () => {
    setGuest();
    completeEntry("guest");
  };

  const handleTelegram = async () => {
    if (inTelegram && hasInitData) {
      await signInWithTelegram();
      return;
    }
    const bot = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME?.trim();
    window.open(bot ? `https://t.me/${bot}` : "https://t.me", "_blank", "noopener,noreferrer");
  };

  const handleGoogle = async () => {
    if (!sb) return;
    setGoogleBusy(true);
    try {
      const authCallbackUrl =
        typeof window !== "undefined" ? `${window.location.origin}/auth/callback` : undefined;
      await sb.auth.signInWithOAuth({ provider: "google", options: { redirectTo: authCallbackUrl } });
    } finally {
      setGoogleBusy(false);
    }
  };

  return (
    <div className="ms-auth-page">
      <div className="ms-auth-page__card">
        {/* Identity */}
        <div className="ms-auth-page__identity">
          <p className="ms-auth-page__wordmark">MONEYSET</p>
          <p className="ms-auth-page__tagline">
            {pickLocale(locale, "Market Structure Before Consensus", "Структура рынка до консенсуса")}
          </p>
        </div>

        {/* Separator */}
        <div className="ms-auth-page__rule" aria-hidden />

        {/* Auth methods */}
        <div className="ms-auth-page__methods">
          {/* Primary: Telegram */}
          <button
            type="button"
            className="ms-auth-page__btn ms-auth-page__btn--primary ms-focus-ring"
            disabled={busy}
            onClick={() => void handleTelegram()}
          >
            <span className="ms-auth-page__btn-icon" aria-hidden>✈</span>
            <span>
              {inTelegram && hasInitData
                ? pickLocale(locale, "Continue with Telegram", "Продолжить через Telegram")
                : pickLocale(locale, "Open in Telegram", "Открыть в Telegram")}
            </span>
          </button>

          {/* Secondary: Google */}
          <button
            type="button"
            className="ms-auth-page__btn ms-auth-page__btn--secondary ms-focus-ring"
            disabled={busy || !sb}
            onClick={() => void handleGoogle()}
          >
            <span className="ms-auth-page__btn-icon" aria-hidden>G</span>
            <span>{pickLocale(locale, "Continue with Google", "Продолжить через Google")}</span>
          </button>

          {/* Tertiary: Email */}
          <button
            type="button"
            className="ms-auth-page__btn ms-auth-page__btn--tertiary ms-focus-ring"
            disabled={busy}
            onClick={openAuth}
          >
            <span>{pickLocale(locale, "Continue with Email", "Продолжить через Email")}</span>
          </button>
        </div>

        {/* Error */}
        {telegramError ? (
          <p className="ms-auth-page__error">{telegramError}</p>
        ) : null}

        {/* Separator */}
        <div className="ms-auth-page__divider">
          <div className="ms-auth-page__divider-line" aria-hidden />
          <span>{pickLocale(locale, "or", "или")}</span>
          <div className="ms-auth-page__divider-line" aria-hidden />
        </div>

        {/* Guest entry */}
        <button
          type="button"
          className="ms-auth-page__guest ms-focus-ring"
          onClick={enterAsGuest}
        >
          {pickLocale(locale, "Enter free workspace", "Войти в бесплатное поле")}
        </button>

        {/* Trust note */}
        <p className="ms-auth-page__note">
          {pickLocale(
            locale,
            "Sessions persist on this device. No feed, no noise — access control only.",
            "Сессия сохраняется на устройстве. Без ленты и шума — только контроль доступа.",
          )}
        </p>
      </div>
    </div>
  );
}
