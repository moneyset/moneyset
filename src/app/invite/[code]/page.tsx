"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { authHeadersForUser } from "@/lib/access/request-user";
import { normalizeInviteCode } from "@/lib/access/invitation";
import { pickLocale } from "@/lib/i18n/cognition-dict";
import { useAccessStore } from "@/store/access-store";
import { useAuthModalStore } from "@/store/auth-modal-store";
import { useAuthStore } from "@/store/auth-store";
import { useUiPrefsStore } from "@/store/ui-prefs-store";

export default function InviteRedeemPage() {
  const params = useParams();
  const router = useRouter();
  const locale = useUiPrefsStore((s) => s.uiLocale);
  const user = useAuthStore((s) => s.user);
  const session = useAuthStore((s) => s.session);
  const openAuth = useAuthModalStore((s) => s.openAuth);
  const setProfile = useAccessStore((s) => s.setProfile);

  const rawCode = typeof params.code === "string" ? params.code : "";
  const code = normalizeInviteCode(rawCode);

  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  const redeem = useCallback(async () => {
    if (!code) {
      setStatus("error");
      setMessage(pickLocale(locale, "Invalid invitation link", "Недействительная ссылка"));
      return;
    }
    if (!user?.id) {
      openAuth();
      return;
    }
    setStatus("loading");
    try {
      const res = await fetch("/api/invite/redeem", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeadersForUser(user.id, session?.access_token ?? null),
        },
        body: JSON.stringify({ code }),
      });
      const json = (await res.json()) as { ok: boolean; error?: string; profile?: Parameters<typeof setProfile>[0] };
      if (!json.ok) {
        setStatus("error");
        setMessage(json.error ?? pickLocale(locale, "Redemption failed", "Активация не удалась"));
        return;
      }
      if (json.profile) setProfile(json.profile);
      setStatus("ok");
      setMessage(pickLocale(locale, "Invitation access activated", "Приглашение активировано"));
      window.setTimeout(() => router.replace("/"), 1800);
    } catch {
      setStatus("error");
      setMessage(pickLocale(locale, "Network error. Try again.", "Ошибка сети. Повторите."));
    }
  }, [code, locale, openAuth, router, session?.access_token, setProfile, user?.id]);

  useEffect(() => {
    if (user?.id && code && status === "idle") {
      void redeem();
    }
  }, [user?.id, code, status, redeem]);

  return (
    <div className="ms-page mx-auto flex min-h-[50dvh] max-w-lg flex-col justify-center px-4 py-16">
      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-ms-faint">
        {pickLocale(locale, "Invitation Access", "Приглашение")}
      </p>
      <h1 className="mt-2 text-xl font-semibold tracking-tight text-ms-text">
        {pickLocale(locale, "Activate platform access", "Активировать доступ")}
      </h1>
      {code ? (
        <p className="mt-2 font-mono text-[12px] text-ms-muted">
          {pickLocale(locale, "Code", "Код")}: <span className="text-ms-text">{code}</span>
        </p>
      ) : null}

      {status === "loading" ? (
        <p className="mt-6 text-[13px] text-ms-muted">{pickLocale(locale, "Activating…", "Активация…")}</p>
      ) : null}
      {message ? (
        <p
          className={`mt-6 text-[13px] ${status === "error" ? "text-ms-danger" : "text-ms-cognition"}`}
          role="status"
        >
          {message}
        </p>
      ) : null}

      {!user?.id ? (
        <Button type="button" variant="cognition" className="mt-6" onClick={openAuth}>
          {pickLocale(locale, "Sign in to activate", "Войти для активации")}
        </Button>
      ) : status === "error" ? (
        <Button type="button" variant="outline" className="mt-6" onClick={() => void redeem()}>
          {pickLocale(locale, "Retry", "Повторить")}
        </Button>
      ) : null}

      <Button type="button" variant="ghost" className="mt-3" onClick={() => router.push("/")}>
        {pickLocale(locale, "Return to Core", "На ядро")}
      </Button>
    </div>
  );
}
