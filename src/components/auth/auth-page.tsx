"use client";

import { useEffect, useMemo, useState } from "react";

import { useTelegramAuth } from "@/hooks/use-telegram-auth";
import { TelegramLoginWidget } from "@/components/auth/telegram-login-widget";
import { openInExternalBrowser, openTelegramMiniApp } from "@/lib/auth/telegram-client";
import { mapAuthRedirectError, mapAuthFormError, mapTelegramAuthError } from "@/lib/i18n/user-messages";
import { pickLocale } from "@/lib/i18n/cognition-dict";
import { supabaseBrowser, authCallbackUrl } from "@/lib/supabase/browser";
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
  const [oauthError, setOauthError] = useState<string | null>(null);
  const [telegramHint, setTelegramHint] = useState<string | null>(null);
  const sb = useMemo(() => (typeof window !== "undefined" ? supabaseBrowser() : null), []);
  const inTelegram = hasInitData;

  useEffect(() => {
    const err = new URLSearchParams(window.location.search).get("error");
    if (err) setOauthError(mapAuthRedirectError(locale, decodeURIComponent(err)) ?? null);
  }, [locale]);

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
    openTelegramMiniApp();
    setTelegramHint(
      pickLocale(
        locale,
        "Telegram opened — tap Start, then Open MONEYSET. You return here signed in automatically.",
        "Telegram открыт — нажмите Start, затем «Открыть MONEYSET». Вход выполняется автоматически.",
      ),
    );
  };

  const handleGoogle = async () => {
    if (inTelegram) {
      setOauthError(
        pickLocale(
          locale,
          "Open in your browser to continue with Google — not available inside Telegram.",
          "Откройте в браузере для входа через Google — внутри Telegram недоступно.",
        ),
      );
      openInExternalBrowser(`${window.location.origin}/auth`);
      return;
    }
    if (!sb) return;
    setGoogleBusy(true);
    try {
      await sb.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: authCallbackUrl(), skipBrowserRedirect: false },
      });
    } catch (e) {
      setOauthError(mapAuthFormError(locale, e instanceof Error ? e.message : "Sign-in failed"));
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

        <div className="ms-auth-page__value">
          <p className="ms-auth-page__value-lead">
            {pickLocale(
              locale,
              "Institutional-grade market intelligence — posture, scenarios, and execution structure in one war-room surface.",
              "Институциональный рыночный интеллект — поза, сценарии и структура исполнения в одном war-room пространстве.",
            )}
          </p>
          <ul className="ms-auth-page__value-points" aria-label={pickLocale(locale, "Member access includes", "В доступ входит")}>
            <li>{pickLocale(locale, "Saved access across devices", "Сохранённый доступ на устройствах")}</li>
            <li>{pickLocale(locale, "Full intelligence depth & execution layer", "Полная глубина интеллекта и слой исполнения")}</li>
            <li>{pickLocale(locale, "Founding Access · lifetime upgrade path", "Founding Access · пожизненный апгрейд")}</li>
          </ul>
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
              {busy
                ? pickLocale(locale, "Signing in…", "Вход…")
                : inTelegram && hasInitData
                  ? pickLocale(locale, "Continue with Telegram", "Продолжить через Telegram")
                  : pickLocale(locale, "Open in Telegram", "Открыть в Telegram")}
            </span>
          </button>

          {!inTelegram ? (
            <div className="ms-auth-page__widget-block">
              <p className="text-[9px] uppercase tracking-[0.14em] text-ms-faint/70">
                {pickLocale(locale, "One-tap sign-in (browser)", "Вход одним тапом (браузер)")}
              </p>
              <TelegramLoginWidget nextPath="/" />
            </div>
          ) : null}

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
        {telegramError || oauthError ? (
          <p className="ms-auth-page__error">
            {mapTelegramAuthError(locale, telegramError) ?? oauthError}
          </p>
        ) : null}
        {telegramHint ? <p className="ms-auth-page__hint">{telegramHint}</p> : null}

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
