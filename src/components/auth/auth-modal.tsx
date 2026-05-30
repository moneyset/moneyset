"use client";

import { useMemo, useState } from "react";
import { Mail, Shield } from "lucide-react";

import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { StatusPill } from "@/components/ui/status-pill";
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
import { openInExternalBrowser, openTelegramMiniApp } from "@/lib/auth/telegram-client";

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
  const [emailExpanded, setEmailExpanded] = useState(false);
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

  return (
    <Modal
      open={open}
      onClose={() => {
        setNote(null);
        setEmailExpanded(false);
        onClose();
      }}
      title={t("auth.title")}
      description={t("auth.subtitle")}
    >
      <div className="ms-auth-modal space-y-3">
        {!sb ? (
          <div className="rounded-ms-xl border border-ms-border bg-ms-elevated/25 p-4 text-[13px] leading-relaxed text-ms-muted">
            {t("auth.missingConfig")}
          </div>
        ) : null}

        {/* ── Signed-in state ── */}
        {authStatus === "signed_in" && authUser ? (
          <div className="rounded-ms-xl border border-ms-border bg-ms-surface/35 p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="ms-data-label text-ms-faint">{t("auth.signedInAs")}</p>
                <p className="mt-1 truncate font-mono text-[12px] text-ms-text">
                  {authUser.email
                    ? authUser.email.replace(/^(.{2})(.*)(@.*)$/, (_, a, b, c) => `${a}${"•".repeat(b.length)}${c}`)
                    : pickLocale(locale, "Telegram session", "Telegram сессия")}
                </p>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={doSignOut} disabled={!sb || isBusy}>
                {t("auth.signOut")}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {/* ── Primary: Telegram ── */}
            <Button
              type="button"
              variant="cognition"
              className="ms-auth-modal__method-btn w-full justify-between gap-2"
              disabled={isBusy}
              onClick={() => void handleTelegram()}
            >
              <span className="flex min-w-0 flex-1 items-center gap-2 truncate">
                <span className="shrink-0 text-[14px]" aria-hidden>✈</span>
                <span className="truncate">
                  {isBusy
                    ? pickLocale(locale, "Signing in…", "Вход…")
                    : inTelegram && hasInitData
                      ? pickLocale(locale, "Continue with Telegram", "Продолжить через Telegram")
                      : pickLocale(locale, "Open in Telegram", "Открыть в Telegram")}
                </span>
              </span>
              <StatusPill accent="warning" className="shrink-0">
                {pickLocale(locale, "Primary", "Основной")}
              </StatusPill>
            </Button>

            {!inTelegram ? (
              <div className="ms-auth-modal__widget-block">
                <p className="ms-auth-modal__hint mb-2">
                  {pickLocale(
                    locale,
                    "Or sign in here with Telegram (one tap, no app switch):",
                    "Или войдите здесь через Telegram (один тап, без переключения):",
                  )}
                </p>
                <TelegramLoginWidget nextPath="/" className="flex justify-center" />
              </div>
            ) : null}

            {/* ── Secondary: Google ── */}
            <Button
              type="button"
              variant="outline"
              className="ms-auth-modal__method-btn w-full justify-between gap-2"
              onClick={() => void doOAuth()}
              disabled={!sb || isBusy}
            >
              <span className="flex min-w-0 flex-1 items-center gap-2 truncate">
                <span className="shrink-0 font-semibold" aria-hidden>G</span>
                <span className="truncate">{t("auth.google")}</span>
              </span>
              <StatusPill accent="neutral" className="shrink-0">
                {pickLocale(locale, "Secure", "Безопасно")}
              </StatusPill>
            </Button>

            {/* ── Tertiary: Email ── */}
            <div className="rounded-ms-xl border border-ms-border/50 bg-ms-elevated/10">
              <button
                type="button"
                className="flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-ms-elevated/20"
                onClick={() => setEmailExpanded((v) => !v)}
                aria-expanded={emailExpanded}
              >
                <span className="flex items-center gap-2 text-[12px] text-ms-muted">
                  <Mail className="size-3.5" strokeWidth={1.5} aria-hidden />
                  {pickLocale(locale, "Continue with Email", "Продолжить через Email")}
                </span>
                <span
                  className="font-mono text-[10px] text-ms-faint transition-transform duration-200"
                  style={{ transform: emailExpanded ? "rotate(180deg)" : "rotate(0deg)" }}
                  aria-hidden
                >
                  ↓
                </span>
              </button>

              {emailExpanded ? (
                <div className="border-t border-ms-border/30 px-4 pb-4 pt-3">
                  <label className="ms-data-label text-ms-faint">{t("auth.emailLabel")}</label>
                  <div className="mt-2 flex items-center gap-2 rounded-ms-md border border-ms-border bg-ms-surface/60 px-3 py-2">
                    <Mail className="size-4 text-ms-muted" strokeWidth={1.5} aria-hidden />
                    <input
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={t("auth.emailPlaceholder")}
                      className="w-full bg-transparent text-[13px] text-ms-text outline-none placeholder:text-ms-faint"
                      inputMode="email"
                      autoComplete="email"
                    />
                  </div>

                  <label className="ms-data-label mt-3 block text-ms-faint">
                    {pickLocale(locale, "Password", "Пароль")}
                  </label>
                  <div className="mt-2 flex items-center gap-2 rounded-ms-md border border-ms-border bg-ms-surface/60 px-3 py-2">
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={pickLocale(locale, "8+ characters", "8+ символов")}
                      className="w-full bg-transparent text-[13px] text-ms-text outline-none placeholder:text-ms-faint"
                      autoComplete="current-password"
                    />
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={doMagic}
                      disabled={!sb || isBusy || !canEmail}
                      className="text-[11px]"
                    >
                      {t("auth.sendMagic")}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={doEmailSignIn}
                      disabled={!sb || isBusy || !canEmail || !canPassword}
                      className="text-[11px]"
                    >
                      {t("auth.emailSignIn")}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={doSignUp}
                      disabled={!sb || isBusy || !canEmail || !canPassword}
                      className="text-[11px]"
                    >
                      {t("auth.emailSignUp")}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={doResetPassword}
                      disabled={!sb || isBusy || !canEmail}
                      className="text-[11px]"
                    >
                      {pickLocale(locale, "Reset password", "Сброс пароля")}
                    </Button>
                  </div>

                  <div className="mt-3 flex items-start gap-2 rounded-ms-md border border-ms-border bg-ms-elevated/20 px-3 py-2 text-[11px] leading-relaxed text-ms-muted sm:text-[12px]">
                    <Shield className="mt-0.5 size-4 shrink-0 text-ms-warning/75" strokeWidth={1.5} aria-hidden />
                    <p>{authModalPolicyNote(locale)}</p>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        )}

        {note || telegramError ? (
          <div className="ms-auth-modal__hint rounded-ms-lg border border-ms-border bg-ms-elevated/20 px-3 py-2">
            {note ?? mapTelegramAuthError(locale, telegramError)}
          </div>
        ) : null}
      </div>
    </Modal>
  );
}
