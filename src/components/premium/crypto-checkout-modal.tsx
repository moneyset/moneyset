"use client";

import { useEffect, useMemo, useState } from "react";
import { ExternalLink, Lock, Shield } from "lucide-react";

import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { StatusPill } from "@/components/ui/status-pill";
import { billingProduct } from "@/lib/billing/catalog";
import { authHeadersForUser } from "@/lib/access/request-user";
import { pickLocale } from "@/lib/i18n/cognition-dict";
import { useAccessStore } from "@/store/access-store";
import { useAuthModalStore } from "@/store/auth-modal-store";
import { useAuthStore } from "@/store/auth-store";
import { useCheckoutModalStore } from "@/store/checkout-modal-store";
import { useSubscriptionStore } from "@/store/subscription-store";
import type { CreateInvoiceResult, InvoiceStatusResult } from "@/types/billing";
import { useUiPrefsStore } from "@/store/ui-prefs-store";
import { useShallow } from "zustand/react/shallow";

type CryptoCheckoutModalProps = {
  open: boolean;
  onClose: () => void;
};

export function CryptoCheckoutModal({ open, onClose }: CryptoCheckoutModalProps) {
  const locale = useUiPrefsStore((s) => s.uiLocale);
  const productId = useCheckoutModalStore((s) => s.productId);
  const product = billingProduct(productId);
  const user = useAuthStore((s) => s.user);
  const session = useAuthStore((s) => s.session);
  const authStatus = useAuthStore((s) => s.status);
  const openAuth = useAuthModalStore((s) => s.openAuth);
  const setProfile = useAccessStore((s) => s.setProfile);
  const sub = useSubscriptionStore(
    useShallow((s) => ({
      tier: s.tier,
      status: s.status,
      lastInvoiceId: s.lastInvoiceId,
      provider: s.provider,
      setPendingInvoice: s.setPendingInvoice,
      setTierActive: s.setTierActive,
    })),
  );

  const currency = "USDT" as const;
  const signedIn = authStatus === "signed_in" && Boolean(user?.id);
  const [busy, setBusy] = useState(false);
  const [invoice, setInvoice] = useState<CreateInvoiceResult | null>(null);
  const [poll, setPoll] = useState<InvoiceStatusResult | null>(null);
  const [note, setNote] = useState<string | null>(null);

  const canUpgrade = sub.tier !== "premium" || sub.status !== "active";

  const invoiceId = useMemo(() => {
    if (invoice && invoice.ok) return invoice.invoiceId;
    return sub.lastInvoiceId;
  }, [invoice, sub.lastInvoiceId]);

  useEffect(() => {
    if (!open) {
      setInvoice(null);
      setPoll(null);
      setNote(null);
      setBusy(false);
    }
  }, [open]);

  const orderIdForPoll = invoice && invoice.ok ? invoice.orderId : null;

  const check = async (opts?: { invoiceId?: string; orderId?: string }) => {
    const pollInvoiceId = opts?.invoiceId ?? invoiceId;
    const pollOrderId = opts?.orderId ?? orderIdForPoll;
    if (!pollInvoiceId) return;
    setBusy(true);
    setNote(null);
    try {
      const qs = new URLSearchParams({ invoiceId: pollInvoiceId });
      if (pollOrderId) qs.set("orderId", pollOrderId);
      const res = await fetch(`/api/billing/status?${qs.toString()}`, {
        headers: authHeadersForUser(user?.id ?? null, session?.access_token ?? null),
        cache: "no-store",
      });
      const json = (await res.json()) as InvoiceStatusResult;
      setPoll(json);
      if (json.ok && json.status === "paid") {
        const isFounding = productId === "founding_access";
        sub.setTierActive("premium", {
          provider: json.provider,
          periodDays: isFounding ? null : (product?.subscriptionDays ?? 30),
        });
        const me = await fetch("/api/access/me", {
          headers: authHeadersForUser(user?.id ?? null, session?.access_token ?? null),
          cache: "no-store",
        });
        const profileJson = (await me.json()) as { ok: boolean; profile?: Parameters<typeof setProfile>[0] };
        if (profileJson.ok && profileJson.profile) setProfile(profileJson.profile);
        setNote(
          pickLocale(
            locale,
            isFounding ? "Founding access active." : "Premium access active.",
            isFounding ? "Founding доступ активен." : "Премиум доступ активен.",
          ),
        );
      }
      if (!json.ok) setNote(json.error);
    } catch {
      setNote(pickLocale(locale, "Could not verify payment. Try again.", "Не удалось проверить оплату."));
    } finally {
      setBusy(false);
    }
  };

  const create = async () => {
    if (!signedIn) {
      setNote(pickLocale(locale, "Sign in to create an invoice.", "Войдите, чтобы создать счёт."));
      openAuth();
      return;
    }
    setNote(null);
    setBusy(true);
    try {
      const res = await fetch("/api/billing/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeadersForUser(user?.id ?? null, session?.access_token ?? null),
        },
        body: JSON.stringify({ productId, payCurrency: currency }),
      });
      const json = (await res.json()) as CreateInvoiceResult;
      setInvoice(json);
      if (json.ok) {
        sub.setPendingInvoice({ provider: json.provider, invoiceId: json.invoiceId });
        if (json.paymentUrl) void check({ invoiceId: json.invoiceId, orderId: json.orderId });
      }
      if (!json.ok) setNote(json.error);
    } catch {
      setNote(pickLocale(locale, "Could not create invoice. Try again.", "Не удалось создать счёт."));
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    if (!open || !invoiceId || !orderIdForPoll) return;
    let ticks = 0;
    const id = window.setInterval(() => {
      ticks += 1;
      if (ticks > 24) {
        window.clearInterval(id);
        return;
      }
      void check();
    }, 12_000);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- poll while modal open
  }, [open, invoiceId, orderIdForPoll]);

  return (
    <Modal
      open={open}
      onClose={() => onClose()}
      title={pickLocale(locale, "Crypto invoice", "Крипто-счёт")}
      description={pickLocale(
        locale,
        "Pay in USDT (TRC-20) via NOWPayments.",
        "Оплата USDT (TRC-20) через NOWPayments.",
      )}
    >
      <div className="space-y-4">
        <div className="rounded-ms-xl border border-ms-border bg-ms-surface/35 p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="ms-data-label text-ms-faint">Plan</p>
              <p className="mt-1 text-[13px] font-semibold text-ms-text">{product?.label ?? "Premium"}</p>
              <p className="mt-1 text-[12px] text-ms-muted">{product?.description ?? ""}</p>
              <p className="mt-1 font-mono text-[11px] tabular-nums text-ms-faint">
                ${product?.priceUsd ?? "—"} USD
              </p>
            </div>
            <StatusPill accent={sub.status === "active" ? "warning" : "neutral"}>{sub.status}</StatusPill>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <StatusPill accent="neutral">USDT · TRC-20</StatusPill>
          </div>
        </div>

        <div className="rounded-ms-xl border border-ms-border bg-ms-elevated/20 p-4">
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button type="button" variant="outline" className="flex-1" disabled={!canUpgrade || busy || !signedIn} onClick={create}>
              Create invoice
            </Button>
            <Button type="button" variant="outline" className="flex-1" disabled={!invoiceId || busy} onClick={() => void check()}>
              Check status
            </Button>
          </div>

          {invoice && invoice.ok ? (
            <div className="mt-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="ms-data-label text-ms-faint">Invoice</p>
                <StatusPill accent="neutral">
                  {invoice.provider} · {invoice.status}
                </StatusPill>
              </div>
              <div className="rounded-ms-lg border border-ms-border bg-ms-surface/45 px-3 py-2">
                <p className="font-mono text-[11px] text-ms-text">{invoice.invoiceId}</p>
              </div>

              {invoice.paymentUrl ? (
                <a
                  href={invoice.paymentUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="ms-focus-ring inline-flex items-center gap-2 rounded-ms-md border border-ms-border bg-ms-surface/60 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.14em] text-ms-text hover:border-ms-border-mid"
                >
                  <ExternalLink className="size-4" strokeWidth={1.5} />
                  Open payment page
                </a>
              ) : (
                <div className="rounded-ms-lg border border-dashed border-ms-border bg-ms-elevated/15 px-3 py-3 text-[12px] text-ms-muted">
                  {pickLocale(
                    locale,
                    "Payment link is being prepared. Use Check status after a moment.",
                    "Ссылка готовится. Нажмите «Проверить статус» через минуту.",
                  )}
                </div>
              )}
            </div>
          ) : null}

          {poll && poll.ok ? (
            <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-ms-lg border border-ms-border bg-ms-surface/45 px-3 py-2">
              <div className="flex items-center gap-2">
                <Lock className="size-4 text-ms-muted" strokeWidth={1.5} />
                <p className="text-[12px] text-ms-muted">Status</p>
              </div>
              <StatusPill accent={poll.status === "paid" ? "warning" : "neutral"}>{poll.status}</StatusPill>
            </div>
          ) : null}

          {note ? (
            <div className="mt-4 rounded-ms-lg border border-ms-border bg-ms-elevated/20 px-3 py-2 text-[12px] text-ms-muted">
              {note}
            </div>
          ) : null}
        </div>

        <div className="rounded-ms-xl border border-ms-border bg-ms-elevated/15 p-4">
          <div className="flex items-start gap-2">
            <Shield className="mt-0.5 size-4 text-ms-warning/70" strokeWidth={1.5} aria-hidden />
            <p className="text-[12px] leading-snug text-ms-muted">
              {pickLocale(
                locale,
                "Settlement server-side. Tier follows invoice state.",
                "Проводка на сервере. Уровень по статусу счёта.",
              )}
            </p>
          </div>
        </div>
      </div>
    </Modal>
  );
}

