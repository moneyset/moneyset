"use client";

import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { CognitionPanel } from "@/components/ui/panel";
import { authHeadersForUser } from "@/lib/access/request-user";
import { isAdmin } from "@/lib/access/roles";
import { pickLocale } from "@/lib/i18n/cognition-dict";
import { useAccessStore } from "@/store/access-store";
import { useAuthStore } from "@/store/auth-store";
import { useUiPrefsStore } from "@/store/ui-prefs-store";

type InviteRow = Readonly<{
  code: string;
  label: string | null;
  duration_days: number;
  max_uses: number;
  use_count: number;
  disabled: boolean;
  code_expires_at: string | null;
}>;

export function InvitationAdminPanel() {
  const locale = useUiPrefsStore((s) => s.uiLocale);
  const profile = useAccessStore((s) => s.profile);
  const user = useAuthStore((s) => s.user);
  const session = useAuthStore((s) => s.session);

  const [codes, setCodes] = useState<InviteRow[]>([]);
  const [newCode, setNewCode] = useState("");
  const [days, setDays] = useState("7");
  const [maxUses, setMaxUses] = useState("1");
  const [label, setLabel] = useState("");
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user?.id || !isAdmin(profile)) return;
    const res = await fetch("/api/admin/invitations", {
      headers: authHeadersForUser(user.id, session?.access_token ?? null),
      cache: "no-store",
    });
    const json = (await res.json()) as { ok: boolean; codes?: InviteRow[]; error?: string };
    if (json.ok && json.codes) setCodes(json.codes);
  }, [profile, session?.access_token, user?.id]);

  useEffect(() => {
    void load();
  }, [load]);

  if (!isAdmin(profile)) return null;

  const headers = authHeadersForUser(user?.id ?? null, session?.access_token ?? null);

  return (
    <CognitionPanel
      id="admin-invitations"
      eyebrow={pickLocale(locale, "Admin", "Админ")}
      accent="warning"
      title={pickLocale(locale, "Invitation codes", "Коды приглашений")}
    >
      <form
        className="mt-2 space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          void (async () => {
            setError(null);
            const res = await fetch("/api/admin/invitations", {
              method: "POST",
              headers: { "Content-Type": "application/json", ...headers },
              body: JSON.stringify({
                code: newCode,
                label: label || undefined,
                durationDays: Number(days) || 7,
                maxUses: Number(maxUses) || 1,
              }),
            });
            const json = (await res.json()) as { ok: boolean; error?: string };
            if (!json.ok) {
              setError(json.error ?? "Failed");
              return;
            }
            setNewCode("");
            setLabel("");
            await load();
          })();
        }}
      >
        <div className="grid gap-2 sm:grid-cols-2">
          <input
            className="rounded-ms-md border border-ms-border/50 bg-ms-surface/40 px-3 py-2 text-[12px] text-ms-text"
            placeholder={pickLocale(locale, "CODE-2026", "CODE-2026")}
            value={newCode}
            onChange={(e) => setNewCode(e.target.value)}
            required
          />
          <input
            className="rounded-ms-md border border-ms-border/50 bg-ms-surface/40 px-3 py-2 text-[12px] text-ms-text"
            placeholder={pickLocale(locale, "Label (optional)", "Метка")}
            value={label}
            onChange={(e) => setLabel(e.target.value)}
          />
          <input
            type="number"
            min={1}
            className="rounded-ms-md border border-ms-border/50 bg-ms-surface/40 px-3 py-2 text-[12px] text-ms-text"
            placeholder={pickLocale(locale, "Days", "Дней")}
            value={days}
            onChange={(e) => setDays(e.target.value)}
          />
          <input
            type="number"
            min={1}
            className="rounded-ms-md border border-ms-border/50 bg-ms-surface/40 px-3 py-2 text-[12px] text-ms-text"
            placeholder={pickLocale(locale, "Max uses", "Использований")}
            value={maxUses}
            onChange={(e) => setMaxUses(e.target.value)}
          />
        </div>
        {error ? <p className="text-[11px] text-ms-danger">{error}</p> : null}
        <Button type="submit" variant="cognition" size="sm">
          {pickLocale(locale, "Create code", "Создать код")}
        </Button>
      </form>

      <ul className="mt-5 max-h-64 space-y-2 overflow-y-auto border-t border-ms-border/20 pt-4">
        {codes.map((row) => (
          <li
            key={row.code}
            className="flex flex-wrap items-center justify-between gap-2 rounded-ms-md border border-ms-border/25 bg-ms-elevated/10 px-3 py-2 text-[11px]"
          >
            <div className="min-w-0">
              <p className="font-mono font-medium text-ms-text">{row.code}</p>
              <p className="text-ms-faint">
                {row.use_count}/{row.max_uses} · {row.duration_days}d
                {row.label ? ` · ${row.label}` : ""}
                {row.disabled ? " · disabled" : ""}
              </p>
              <p className="text-ms-dim/90">/invite/{row.code}</p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                void (async () => {
                  await fetch("/api/admin/invitations", {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json", ...headers },
                    body: JSON.stringify({ code: row.code, disabled: !row.disabled }),
                  });
                  await load();
                })()
              }
            >
              {row.disabled
                ? pickLocale(locale, "Enable", "Включить")
                : pickLocale(locale, "Disable", "Отключить")}
            </Button>
          </li>
        ))}
      </ul>
    </CognitionPanel>
  );
}
