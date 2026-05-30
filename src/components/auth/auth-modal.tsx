"use client";

import { useMemo, useState } from "react";
import { Shield } from "lucide-react";

import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { EmailAccessIcon, GoogleIcon, TelegramBrandIcon } from "@/components/auth/auth-provider-icons";
import { useT } from "@/lib/i18n/use-t";
import { useUiPrefsStore } from "@/store/ui-prefs-store";
import { supabaseBrowser, authCallbackUrl } from "@/lib/supabase/browser";
import { mapAuthFormError, mapTelegramAuthError } from "@/lib/i18n/user-messages";
import { pickLocale } from "@/lib/i18n/cognition-dict";
import { clearClientSession } from "@/lib/auth/sign-out";
import { useAuthStore } from "@/store/auth-store";
import { authModalPolicyNote } from "@/lib/i18n/trust-surface";
import { useTelegramAuth } from "@/hooks/use-telegram-auth";
import { TelegramLoginWidget } from "@/components/auth/telegram-login-widget";
import { MemberSupportPanel } from "@/components/support/member-support-panel";
import { openInExternalBrowser, openTelegramMiniApp } from "@/lib/auth/telegram-client";
import { cn } from "@/lib/utils";

type AuthModalProps = {
  open: boolean;
  onClose: () => void;
};

function isValidEmail(v: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
}

function isValidPassword(v: string): boolean {
  return v.length >= 8;
}

function friendlyAuthError(message: string, locale: ReturnType<typeof useUiPrefsStore.getState>["uiLocale"]): string {
  return mapAuthFormError(locale, message);
}

export function AuthModal({ open, onClose }: AuthModalProps) {
  const t = useT();
  const locale = useUiPrefsStore((s) => s.uiLocale);
  const authStatus = useAuthStore((s) => s.status);
  const authUser = useAuthStore((s) => s.user);
  const sb = useMemo(() => supabaseBrowser(), []);
  const { signInWithTelegram, busy: telegramBusy, hasInitData, error: telegramError } = useTelegramAuth();
  const inTelegram = hasInitData;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [emailActive, setEmailActive] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  const isBusy = busy || telegramBusy;
  const canEmail = isValidEmail(email);
  const canPassword = isValidPassword(password);

  const oauthRedirectTo = authCallbackUrl();

  const handleTelegram = async () => {
    setNote(null);
    if (inTelegram && hasInitData) {
      const ok = await signInWithTelegram();
      if (ok) onClose();
      return;
    }
    openTelegramMiniApp();
    setNote(
      pickLocale(
        locale,
        "Telegram opened — tap Start, then Open MONEYSET. Sign-in completes automatically inside the app.",
        "Telegram открыт — нажмите Start, затем «Открыть MONEYSET». Вход выполняется автоматически.",
      ),
    );
  };

  const doOAuth = async () => {
    setNote(null);
    setEmailActive(false);
    if (inTelegram) {
      setNote(
        pickLocale(
          locale,
          "Google sign-in opens in your browser — not available inside the Telegram app.",
          "Вход через Google откроется в браузере — внутри Telegram недоступен.",
        ),
      );
      openInExternalBrowser(`${window.location.origin}/auth`);
      return;
    }
    if (!sb) return;
    setBusy(true);
    try {
      await sb.auth.signInWithOAuth({ provider: "google", options: { redirectTo: oauthRedirectTo } });
    } catch (e) {
      setNote(friendlyAuthError(e instanceof Error ? e.message : "Auth error", locale));
    } finally {
      setBusy(false);
    }
  };

  const doMagic = async () => {
    setNote(null);
    if (!sb || !canEmail) return;
    setBusy(true);
    try {
      const { error } = await sb.auth.signInWithOtp({
        email: email.trim(),
        options: { emailRedirectTo: oauthRedirectTo },
      });
      if (error) throw error;
      setNote(t("auth.magicSent"));
    } catch (e) {
      setNote(friendlyAuthError(e instanceof Error ? e.message : "Auth error", locale));
    } finally {
      setBusy(false);
    }
  };

  const doEmailSignIn = async () => {
    setNote(null);
    if (!sb || !canEmail || !canPassword) return;
    setBusy(true);
    try {
      const { error } = await sb.auth.signInWithPassword({ email: email.trim(), password });
      if (error) throw error;
      onClose();
    } catch (e) {
      setNote(friendlyAuthError(e instanceof Error ? e.message : "Auth error", locale));
    } finally {
      setBusy(false);
    }
  };

  const doSignUp = async () => {
    setNote(null);
    if (!sb || !canEmail || !canPassword) return;
    setBusy(true);
    try {
      const { error } = await sb.auth.signUp({
        email: email.trim(),
        password,
        options: { emailRedirectTo: oauthRedirectTo },
      });
      if (error) throw error;
      setNote(
        pickLocale(locale, "Account created. Confirm your email if prompted, then sign in.", "Аккаунт создан. Подтвердите email при необходимости, затем войдите."),
      );
    } catch (e) {
      setNote(friendlyAuthError(e instanceof Error ? e.message : "Auth error", locale));
    } finally {
      setBusy(false);
    }
  };

  const doResetPassword = async () => {
    setNote(null);
    if (!sb || !canEmail) return;
    setBusy(true);
    try {
      const { error } = await sb.auth.resetPasswordForEmail(email.trim(), { redirectTo: oauthRedirectTo });
      if (error) throw error;
      setNote(pickLocale(locale, "Password reset link sent. Check your email.", "Ссылка для сброса отправлена. Проверьте почту."));
    } catch (e) {
      setNote(friendlyAuthError(e instanceof Error ? e.message : "Auth error", locale));
    } finally {
      setBusy(false);
    }
  };

  const doSignOut = async () => {
    setNote(null);
    if (!sb) return;
    setBusy(true);
    try {
      await sb.auth.signOut();
      clearClientSession();
    } finally {
      setBusy(false);
    }
  };

  const showSignInMethods = authStatus !== "signed_in" || !authUser;

  const authInfoNotes = useMemo(
    () =>
      new Set([
        t("auth.magicSent"),
        pickLocale(locale, "Account created. Confirm your email if prompted, then sign in.", "Аккаунт создан. Подтвердите email при необходимости, затем войдите."),
        pickLocale(locale, "Password reset link sent. Check your email.", "Ссылка для сброса отправлена. Проверьте почту."),
        pickLocale(
          locale,
          "Telegram opened — tap Start, then Open MONEYSET. Sign-in completes automatically inside the app.",
          "Telegram открыт — нажмите Start, затем «Открыть MONEYSET». Вход выполняется автоматически.",
        ),
        pickLocale(
          locale,
          "Google sign-in opens in your browser — not available inside the Telegram app.",
          "Вход через Google откроется в браузере — внутри Telegram недоступен.",
        ),
      ]),
    [locale, t],
  );

  const showAuthSupport = Boolean(telegramError) || (note != null && !authInfoNotes.has(note));
  const oidcReady = Boolean(process.env.NEXT_PUBLIC_TELEGRAM_OIDC_CLIENT_ID?.trim());
  const showBrowserOidc = !inTelegram && oidcReady;

  const authFooter = showSignInMethods ? (
    inTelegram ? (
      <button
        type="button"
        className="ms-auth-modal__method ms-auth-modal__method--primary ms-focus-ring w-full"
        disabled={isBusy}
        onClick={() => void handleTelegram()}
      >
        <span className="ms-auth-modal__method-icon" aria-hidden>
          <TelegramBrandIcon />
        </span>
        <span className="ms-auth-modal__method-label">
          {isBusy
            ? pickLocale(locale, "Signing in…", "Вход…")
            : pickLocale(locale, "Continue with Telegram", "Продолжить через Telegram")}
        </span>
      </button>
    ) : null
  ) : (
    <Button type="button" variant="outline" className="w-full" onClick={doSignOut} disabled={!sb || isBusy}>
      {t("auth.signOut")}
    </Button>
  );

  return (
    <Modal
      open={open}
      onClose={() => {
        setNote(null);
        setEmailActive(false);
        onClose();
      }}
      variant="premium"
      title={t("auth.title")}
      description={t("auth.subtitle")}
      footer={authFooter}
    >
      <div className="ms-auth-modal ms-auth-modal--premium">
        {!sb ? (
          <div className="ms-auth-modal__hint rounded-ms-xl border border-ms-border bg-ms-elevated/25 p-4 text-[13px] leading-relaxed text-ms-muted">
            {t("auth.missingConfig")}
          </div>
        ) : null}

        {authStatus === "signed_in" && authUser ? (
          <div className="ms-auth-modal__signed-in">
            <div className="min-w-0">
              <p className="ms-data-label text-ms-faint">{t("auth.signedInAs")}</p>
              <p className="mt-1 truncate font-mono text-[12px] text-ms-text">
                {authUser.email
                  ? authUser.email.replace(/^(.{2})(.*)(@.*)$/, (_, a, b, c) => `${a}${"•".repeat(b.length)}${c}`)
                  : pickLocale(locale, "Telegram session", "Telegram сессия")}
              </p>
            </div>
          </div>
        ) : (
          <div className="ms-auth-modal__methods">
            {showBrowserOidc ? (
              <TelegramLoginWidget nextPath="/" className="ms-auth-modal__telegram-widget" />
            ) : !inTelegram ? (
              <button
                type="button"
                className="ms-auth-modal__method ms-auth-modal__method--primary ms-focus-ring"
                disabled={isBusy}
                onClick={() => void handleTelegram()}
              >
                <span className="ms-auth-modal__method-icon" aria-hidden>
                  <TelegramBrandIcon />
                </span>
                <span className="ms-auth-modal__method-label">
                  {pickLocale(locale, "Open in Telegram", "Открыть в Telegram")}
                </span>
              </button>
            ) : null}

            <button
              type="button"
              className="ms-auth-modal__method ms-auth-modal__method--google ms-focus-ring"
              onClick={() => void doOAuth()}
              disabled={!sb || isBusy}
            >
              <span className="ms-auth-modal__method-icon" aria-hidden>
                <GoogleIcon />
              </span>
              <span className="ms-auth-modal__method-label">{t("auth.google")}</span>
            </button>

            <button
              type="button"
              className={cn(
                "ms-auth-modal__method ms-auth-modal__method--email ms-focus-ring",
                emailActive && "ms-auth-modal__method--active",
              )}
              onClick={() => setEmailActive(true)}
              disabled={!sb || isBusy}
              aria-pressed={emailActive}
            >
              <span className="ms-auth-modal__method-icon" aria-hidden>
                <EmailAccessIcon />
              </span>
              <span className="ms-auth-modal__method-label">
                {pickLocale(locale, "Sign in with Email", "Войти через Email")}
              </span>
            </button>

            {emailActive ? (
              <div className="ms-auth-modal__email-panel">
                <p className="ms-auth-modal__email-lead">
                  {pickLocale(locale, "Email access", "Доступ через Email")}
                </p>

                <label className="ms-auth-modal__field-label" htmlFor="ms-auth-email">
                  {t("auth.emailLabel")}
                </label>
                <div className="ms-auth-modal__input-wrap">
                  <input
                    id="ms-auth-email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t("auth.emailPlaceholder")}
                    className="ms-auth-modal__input"
                    inputMode="email"
                    autoComplete="email"
                  />
                </div>

                <label className="ms-auth-modal__field-label" htmlFor="ms-auth-password">
                  {pickLocale(locale, "Password", "Пароль")}
                </label>
                <div className="ms-auth-modal__input-wrap">
                  <input
                    id="ms-auth-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={pickLocale(locale, "8+ characters", "8+ символов")}
                    className="ms-auth-modal__input"
                    autoComplete="current-password"
                  />
                </div>

                <div className="ms-auth-modal__email-actions">
                  <button
                    type="button"
                    className="ms-auth-modal__email-action ms-auth-modal__email-action--primary ms-focus-ring"
                    onClick={doEmailSignIn}
                    disabled={!sb || isBusy || !canEmail || !canPassword}
                  >
                    {t("auth.emailSignIn")}
                  </button>
                  <button
                    type="button"
                    className="ms-auth-modal__email-action ms-focus-ring"
                    onClick={doMagic}
                    disabled={!sb || isBusy || !canEmail}
                  >
                    {t("auth.sendMagic")}
                  </button>
                  <button
                    type="button"
                    className="ms-auth-modal__email-action ms-focus-ring"
                    onClick={doSignUp}
                    disabled={!sb || isBusy || !canEmail || !canPassword}
                  >
                    {t("auth.emailSignUp")}
                  </button>
                  <button
                    type="button"
                    className="ms-auth-modal__email-action ms-auth-modal__email-action--ghost ms-focus-ring"
                    onClick={doResetPassword}
                    disabled={!sb || isBusy || !canEmail}
                  >
                    {pickLocale(locale, "Reset password", "Сброс пароля")}
                  </button>
                </div>

                <div className="ms-auth-modal__policy">
                  <Shield className="size-3.5 shrink-0 text-ms-faint" strokeWidth={1.5} aria-hidden />
                  <p>{authModalPolicyNote(locale)}</p>
                </div>
              </div>
            ) : null}
          </div>
        )}

        {note || telegramError ? (
          <div className="ms-auth-modal__hint">{note ?? mapTelegramAuthError(locale, telegramError)}</div>
        ) : null}

        {showSignInMethods && !showAuthSupport ? (
          <p className="ms-auth-modal__trust-footnote" role="note">
            {pickLocale(
              locale,
              "Encrypted session on this device. Structure-first intelligence — no feed, no noise.",
              "Шифрованная сессия на устройстве. Интеллект через структуру — без ленты и шума.",
            )}
          </p>
        ) : null}

        {showSignInMethods && showAuthSupport ? (
          <MemberSupportPanel variant="auth-error" className="ms-auth-modal__support" />
        ) : null}
      </div>
    </Modal>
  );
}
