"use client";

import { useMemo, useState } from "react";
import { Mail, Shield } from "lucide-react";

import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { StatusPill } from "@/components/ui/status-pill";
import { useT } from "@/lib/i18n/use-t";
import { useUiPrefsStore } from "@/store/ui-prefs-store";
import { supabaseBrowser } from "@/lib/supabase/browser";
import { useAuthStore } from "@/store/auth-store";
import { useShallow } from "zustand/react/shallow";
import { authModalPolicyNote } from "@/lib/i18n/trust-surface";

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

function friendlyAuthError(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes("invalid login") || lower.includes("invalid credentials")) {
    return "Email or password is incorrect.";
  }
  if (lower.includes("email not confirmed")) {
    return "Confirm your email before signing in.";
  }
  if (lower.includes("user already registered")) {
    return "An account with this email already exists. Try signing in.";
  }
  if (lower.includes("password")) {
    return "Use at least 8 characters for your password.";
  }
  return message.length > 120 ? "Could not complete sign-in. Please try again." : message;
}

export function AuthModal({ open, onClose }: AuthModalProps) {
  const t = useT();
  const locale = useUiPrefsStore((s) => s.uiLocale);
  const auth = useAuthStore(useShallow((s) => ({ status: s.status, user: s.user })));

  const sb = useMemo(() => supabaseBrowser(), []);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  const canEmail = isValidEmail(email);
  const canPassword = isValidPassword(password);

  const doOAuth = async () => {
    setNote(null);
    if (!sb) return;
    setBusy(true);
    try {
      await sb.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: typeof window === "undefined" ? undefined : `${window.location.origin}/`,
        },
      });
    } catch (e) {
      setNote(friendlyAuthError(e instanceof Error ? e.message : "Auth error"));
    } finally {
      setBusy(false);
    }
  };

  const doMagic = async () => {
    setNote(null);
    if (!sb) return;
    if (!canEmail) return;
    setBusy(true);
    try {
      const { error } = await sb.auth.signInWithOtp({
        email: email.trim(),
        options: { emailRedirectTo: `${window.location.origin}/` },
      });
      if (error) throw error;
      setNote(t("auth.magicSent"));
    } catch (e) {
      setNote(friendlyAuthError(e instanceof Error ? e.message : "Auth error"));
    } finally {
      setBusy(false);
    }
  };

  const doEmailSignIn = async () => {
    setNote(null);
    if (!sb) return;
    if (!canEmail || !canPassword) return;
    setBusy(true);
    try {
      const { error } = await sb.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error) throw error;
      onClose();
    } catch (e) {
      setNote(friendlyAuthError(e instanceof Error ? e.message : "Auth error"));
    } finally {
      setBusy(false);
    }
  };

  const doSignUp = async () => {
    setNote(null);
    if (!sb) return;
    if (!canEmail || !canPassword) return;
    setBusy(true);
    try {
      const { error } = await sb.auth.signUp({
        email: email.trim(),
        password,
        options: { emailRedirectTo: `${window.location.origin}/` },
      });
      if (error) throw error;
      setNote("Account created. Confirm your email if prompted, then sign in.");
    } catch (e) {
      setNote(friendlyAuthError(e instanceof Error ? e.message : "Auth error"));
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
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={() => {
        setNote(null);
        onClose();
      }}
      title={t("auth.title")}
      description={t("auth.subtitle")}
    >
      <div className="space-y-4">
        {!sb ? (
          <div className="rounded-ms-xl border border-ms-border bg-ms-elevated/25 p-4 text-[13px] leading-relaxed text-ms-muted">
            {t("auth.missingConfig")}
          </div>
        ) : null}

        {auth.status === "signed_in" && auth.user ? (
          <div className="rounded-ms-xl border border-ms-border bg-ms-surface/35 p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="ms-data-label text-ms-faint">{t("auth.signedInAs")}</p>
                <p className="mt-1 truncate font-mono text-[12px] text-ms-text">{auth.user.email}</p>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={doSignOut} disabled={!sb || busy}>
                {t("auth.signOut")}
              </Button>
            </div>
          </div>
        ) : (
          <>
            <Button
              type="button"
              variant="outline"
              className="w-full justify-between"
              onClick={doOAuth}
              disabled={!sb || busy}
            >
              <span className="flex items-center gap-2">
                {t("auth.google")}
              </span>
              <StatusPill accent="neutral">OAuth</StatusPill>
            </Button>

            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-ms-border" />
              <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ms-faint">{t("auth.or")}</span>
              <div className="h-px flex-1 bg-ms-border" />
            </div>

            <div className="rounded-ms-xl border border-ms-border bg-ms-elevated/15 p-4">
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

              <label className="ms-data-label mt-3 block text-ms-faint">Password</label>
              <div className="mt-2 flex items-center gap-2 rounded-ms-md border border-ms-border bg-ms-surface/60 px-3 py-2">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="8+ characters"
                  className="w-full bg-transparent text-[13px] text-ms-text outline-none placeholder:text-ms-faint"
                  autoComplete="current-password"
                />
              </div>

              <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
                <Button type="button" variant="outline" onClick={doMagic} disabled={!sb || busy || !canEmail}>
                  {t("auth.sendMagic")}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={doEmailSignIn}
                  disabled={!sb || busy || !canEmail || !canPassword}
                >
                  {t("auth.emailSignIn")}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={doSignUp}
                  disabled={!sb || busy || !canEmail || !canPassword}
                >
                  {t("auth.emailSignUp")}
                </Button>
              </div>

              <div className="mt-3 flex items-start gap-2 rounded-ms-md border border-ms-border bg-ms-elevated/20 px-3 py-2 text-[11px] leading-relaxed text-ms-muted sm:text-[12px]">
                <Shield className="mt-0.5 size-4 shrink-0 text-ms-warning/75" strokeWidth={1.5} aria-hidden />
                <p>{authModalPolicyNote(locale)}</p>
              </div>
            </div>
          </>
        )}

        {note ? (
          <div className="rounded-ms-lg border border-ms-border bg-ms-elevated/20 px-3 py-2 text-[12px] text-ms-muted">
            {note}
          </div>
        ) : null}
      </div>
    </Modal>
  );
}

