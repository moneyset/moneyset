"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Link2, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { authHeadersForUser } from "@/lib/access/request-user";
import { isAdmin } from "@/lib/access/roles";
import { pickLocale } from "@/lib/i18n/cognition-dict";
import { useAccessStore } from "@/store/access-store";
import { useAuthStore } from "@/store/auth-store";
import { useUiPrefsStore } from "@/store/ui-prefs-store";

type PartnerRow = Readonly<{
  code: string;
  label: string | null;
  commissionRate: number;
  visits: number;
  signups: number;
  purchases: number;
  revenue: number;
  commission: number;
  url: string;
}>;

export default function FoundingPartnersAdminPage() {
  const locale = useUiPrefsStore((s) => s.uiLocale);
  const profile = useAccessStore((s) => s.profile);
  const user = useAuthStore((s) => s.user);
  const session = useAuthStore((s) => s.session);
  const [partners, setPartners] = useState<PartnerRow[]>([]);
  const [newCode, setNewCode] = useState("");
  const [label, setLabel] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const headers = useMemo(
    () => authHeadersForUser(user?.id ?? null, session?.access_token ?? null),
    [session?.access_token, user?.id],
  );

  const load = useCallback(async () => {
    if (!user?.id || !isAdmin(profile)) return;
    const res = await fetch("/api/admin/partners", { headers, cache: "no-store" });
    const json = (await res.json()) as { ok: boolean; partners?: PartnerRow[]; error?: string };
    if (json.ok && json.partners) setPartners(json.partners);
  }, [headers, profile, user?.id]);

  useEffect(() => {
    void load();
  }, [load]);

  if (!isAdmin(profile)) {
    return (
      <div className="ms-fpp-admin ms-fpp-admin--denied">
        <p>{pickLocale(locale, "Admin access required.", "Требуется доступ администратора.")}</p>
        <Link href="/" className="ms-fpp-admin__back">
          {pickLocale(locale, "Back to MONEYSET", "Назад в MONEYSET")}
        </Link>
      </div>
    );
  }

  const totals = partners.reduce(
    (acc, row) => ({
      visits: acc.visits + row.visits,
      signups: acc.signups + row.signups,
      purchases: acc.purchases + row.purchases,
      revenue: acc.revenue + row.revenue,
      commission: acc.commission + row.commission,
    }),
    { visits: 0, signups: 0, purchases: 0, revenue: 0, commission: 0 },
  );

  return (
    <div className="ms-fpp-admin">
      <div className="ms-fpp-admin__shell">
        <header className="ms-fpp-admin__header">
          <Link href="/settings" className="ms-fpp-admin__back ms-focus-ring">
            <ArrowLeft className="size-4" strokeWidth={1.5} />
            {pickLocale(locale, "Settings", "Настройки")}
          </Link>
          <div className="ms-fpp-admin__identity">
            <p className="ms-fpp-admin__wordmark">MONEYSET</p>
            <h1 className="ms-fpp-admin__title">
              {pickLocale(locale, "Founding Partner Program", "Founding Partner Program")}
            </h1>
            <p className="ms-fpp-admin__subtitle">
              {pickLocale(
                locale,
                "Create partner links, track referrals, signups, and Founding Access revenue.",
                "Создавайте партнёрские ссылки, отслеживайте переходы, регистрации и выручку Founding Access.",
              )}
            </p>
          </div>
        </header>

        <section className="ms-fpp-admin__generator">
          <div className="ms-fpp-admin__section-head">
            <Sparkles className="size-4 text-ms-cognition/80" strokeWidth={1.5} />
            <h2>{pickLocale(locale, "Partner link generator", "Генератор партнёрских ссылок")}</h2>
          </div>
          <form
            className="ms-fpp-admin__form"
            onSubmit={(e) => {
              e.preventDefault();
              void (async () => {
                setBusy(true);
                setError(null);
                const res = await fetch("/api/admin/partners", {
                  method: "POST",
                  headers: { "Content-Type": "application/json", ...headers },
                  body: JSON.stringify({ code: newCode, label: label || undefined }),
                });
                const json = (await res.json()) as { ok: boolean; error?: string };
                if (!json.ok) {
                  setError(json.error ?? "Failed");
                  setBusy(false);
                  return;
                }
                setNewCode("");
                setLabel("");
                await load();
                setBusy(false);
              })();
            }}
          >
            <input
              className="ms-fpp-admin__input"
              placeholder={pickLocale(locale, "Partner code (alex)", "Код партнёра (alex)")}
              value={newCode}
              onChange={(e) => setNewCode(e.target.value)}
            />
            <input
              className="ms-fpp-admin__input"
              placeholder={pickLocale(locale, "Label (optional)", "Метка (необязательно)")}
              value={label}
              onChange={(e) => setLabel(e.target.value)}
            />
            <Button type="submit" variant="cognition" disabled={busy || !newCode.trim()}>
              {pickLocale(locale, "Create partner link", "Создать ссылку")}
            </Button>
          </form>
          {error ? <p className="ms-fpp-admin__error">{error}</p> : null}
          <p className="ms-fpp-admin__hint">
            {pickLocale(locale, "Default commission: 50%", "Комиссия по умолчанию: 50%")}
          </p>
        </section>

        <section className="ms-fpp-admin__summary">
          {[
            [pickLocale(locale, "Visits", "Переходы"), totals.visits],
            [pickLocale(locale, "Signups", "Регистрации"), totals.signups],
            [pickLocale(locale, "Purchases", "Покупки"), totals.purchases],
            [pickLocale(locale, "Revenue", "Выручка"), `$${totals.revenue.toFixed(2)}`],
            [pickLocale(locale, "Commission", "Комиссия"), `$${totals.commission.toFixed(2)}`],
          ].map(([labelText, value]) => (
            <div key={String(labelText)} className="ms-fpp-admin__metric">
              <p className="ms-fpp-admin__metric-label">{labelText}</p>
              <p className="ms-fpp-admin__metric-value">{value}</p>
            </div>
          ))}
        </section>

        <section className="ms-fpp-admin__table-wrap">
          <table className="ms-fpp-admin__table">
            <thead>
              <tr>
                <th>{pickLocale(locale, "Partner", "Партнёр")}</th>
                <th>{pickLocale(locale, "Link", "Ссылка")}</th>
                <th>{pickLocale(locale, "Visits", "Переходы")}</th>
                <th>{pickLocale(locale, "Signups", "Регистрации")}</th>
                <th>{pickLocale(locale, "Purchases", "Покупки")}</th>
                <th>{pickLocale(locale, "Revenue", "Выручка")}</th>
                <th>{pickLocale(locale, "Commission", "Комиссия")}</th>
              </tr>
            </thead>
            <tbody>
              {partners.map((row) => (
                <tr key={row.code}>
                  <td>
                    <p className="font-medium text-ms-text">{row.code}</p>
                    {row.label ? <p className="text-[11px] text-ms-muted">{row.label}</p> : null}
                  </td>
                  <td>
                    <a href={row.url} className="ms-fpp-admin__link" target="_blank" rel="noreferrer">
                      <Link2 className="size-3.5" strokeWidth={1.5} />
                      {row.url.replace(/^https?:\/\//, "")}
                    </a>
                  </td>
                  <td>{row.visits}</td>
                  <td>{row.signups}</td>
                  <td>{row.purchases}</td>
                  <td>${row.revenue.toFixed(2)}</td>
                  <td>${row.commission.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!partners.length ? (
            <p className="ms-fpp-admin__empty">
              {pickLocale(locale, "No partner links yet.", "Партнёрских ссылок пока нет.")}
            </p>
          ) : null}
        </section>
      </div>
    </div>
  );
}
