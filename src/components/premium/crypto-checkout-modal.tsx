"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ExternalLink, Shield } from "lucide-react";

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

// 30 minutes at 12-second intervals
const POLL_INTERVAL_MS = 12_000;
const POLL_MAX_TICKS = 150; // 30 min

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
      lastPaymentUrl: s.lastPaymentUrl,
      provider: s.provider,
      setPendingInvoice: s.setPendingInvoice,
      clearPendingInvoice: s.clearPendingInvoice,
      setTierActive: s.setTierActive,
    })),
  );

  const currency = "USDT" as const;
  const signedIn = authStatus === "signed_in" && Boolean(user?.id);
  const [busy, setBusy] = useState(false);
  const [invoice, setInvoice] = useState<CreateInvoiceResult | null>(null);
  const [poll, setPoll] = useState<InvoiceStatusResult | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const pollTicksRef = useRef(0);

  // Effective invoice ID — prefer freshly-created invoice; fall back to
  // last known invoice from the subscription store (resume-on-reload support)
  const invoiceId = useMemo(() => {
    if (invoice && invoice.ok) return invoice.invoiceId;
    return sub.lastInvoiceId;
  }, [invoice, sub.lastInvoiceId]);

  // Reset state when modal closes
  useEffect(() => {
    if (!open) {
      setInvoice(null);
      setPoll(null);
      setNote(null);
      setBusy(false);
      pollTicksRef.current = 0;
    }
  }, [open]);

  /**
   * Poll the billing status endpoint.
   * The server now derives the orderId and verifies ownership/amount
   * from the provider's API — we only send the invoiceId.
   */
  const check = useCallback(async (opts?: { invoiceId?: string }) => {
    const pollInvoiceId = opts?.invoiceId ?? invoiceId;
    if (!pollInvoiceId) return;
    setBusy(true);
    setNote(null);
    try {
      const qs = new URLSearchParams({ invoiceId: pollInvoiceId });
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
        // Refresh authoritative server-side profile
        const me = await fetch("/api/access/me", {
          headers: authHeadersForUser(user?.id ?? null, session?.access_token ?? null),
          cache: "no-store",
        });
        const profileJson = (await me.json()) as {
          ok: boolean;
          profile?: Parameters<typeof setProfile>[0];
        };
        if (profileJson.ok && profileJson.profile) setProfile(profileJson.profile);
        sub.clearPendingInvoice();
        setNote(
          pickLocale(
            locale,
            isFounding ? "Founding Access active." : "Premium access active.",
            isFounding ? "Founding Access активен." : "Премиум доступ активен.",
          ),
        );
      }
      if (!json.ok) setNote("error" in json ? json.error : null);
    } catch {
      setNote(
        pickLocale(locale, "Could not verify payment. Try again.", "Не удалось проверить оплату."),
      );
    } finally {
      setBusy(false);
    }
  }, [invoiceId, user?.id, session?.access_token, productId, product?.subscriptionDays, locale, sub, setProfile]);

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
        sub.setPendingInvoice({
          provider: json.provider,
          invoiceId: json.invoiceId,
          paymentUrl: json.paymentUrl ?? null,
        });
        pollTicksRef.current = 0;
        if (json.paymentUrl) void check({ invoiceId: json.invoiceId });
      }
      if (!json.ok) setNote("error" in json ? json.error : null);
    } catch {
      setNote(
        pickLocale(locale, "Could not create invoice. Try again.", "Не удалось создать счёт."),
      );
    } finally {
      setBusy(false);
    }
  };

  const paid = poll?.ok && poll.status === "paid";

  // Auto-poll every 12 s for up to 30 minutes while the modal is open
  // and an invoice is active. Stops immediately when paid.
  useEffect(() => {
    if (!open || !invoiceId) return;
    if (paid) return;

    pollTicksRef.current = 0;
    void check();

    const id = window.setInterval(() => {
      pollTicksRef.current += 1;
      if (pollTicksRef.current > POLL_MAX_TICKS) {
        window.clearInterval(id);
        setNote(
          pickLocale(
            locale,
            "Verification timed out. Payment may still settle — reopen this panel or refresh access.",
            "Время проверки истекло. Оплата может ещё пройти — откройте панель снова или обновите доступ.",
          ),
        );
        return;
      }
      void check();
    }, POLL_INTERVAL_MS);

    return () => window.clearInterval(id);
  }, [open, invoiceId, paid, check, locale]);

  const confirming = poll?.ok && (poll.status === "confirming" || poll.status === "unpaid");
  const hasInvoice = Boolean(invoiceId);
  // Resume UX: invoice exists but was loaded from store (not freshly created this session)
  const isResumedInvoice = hasInvoice && !(invoice?.ok);

  const planLabel =
    productId === "founding_access"
      ? pickLocale(locale, "Founding Access", "Founding Access")
      : (product?.label ?? "Premium");

  return (
    <Modal
      open={open}
      onClose={() => onClose()}
      title={pickLocale(locale, "Complete your access", "Оформление доступа")}
      description={pickLocale(
        locale,
        "Pay in USDT via NOWPayments — settlement is automatic.",
        "Оплата USDT через NOWPayments — зачисление автоматическое.",
      )}
    >
      <div className="space-y-4">
        {/* Order summary */}
        <div className="rounded-ms-xl border border-ms-border bg-ms-surface/35 p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="ms-data-label text-ms-faint">
                {pickLocale(locale, "You are purchasing", "Вы покупаете")}
              </p>
              <p className="mt-1 text-[14px] font-semibold text-ms-text">{planLabel}</p>
              {productId === "founding_access" && (
                <p className="mt-1 text-[12px] text-ms-muted">
                  {pickLocale(
                    locale,
                    "Lifetime access · no renewal",
                    "Пожизненный доступ · без продления",
                  )}
                </p>
              )}
            </div>
            <div className="text-right">
              <p className="font-mono text-[20px] font-semibold tabular-nums text-ms-text">
                ${product?.priceUsd ?? "—"}
              </p>
              <p className="mt-0.5 font-mono text-[10px] uppercase tracking-wider text-ms-faint">
                USD
              </p>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <StatusPill accent="neutral">USDT · TRC-20</StatusPill>
            {paid && (
              <StatusPill accent="warning">
                {pickLocale(locale, "Payment received", "Оплата получена")}
              </StatusPill>
            )}
            {confirming && !paid && (
              <StatusPill accent="neutral">
                {pickLocale(locale, "Awaiting confirmation", "Ожидаем подтверждения")}
              </StatusPill>
            )}
          </div>
        </div>

        {/* Action zone */}
        <div className="rounded-ms-xl border border-ms-border bg-ms-elevated/20 p-4">
          {!hasInvoice ? (
            <>
              <p className="mb-3 text-[12px] leading-relaxed text-ms-muted">
                {signedIn
                  ? pickLocale(
                      locale,
                      "Tap below to generate a USDT payment address. You will be redirected to NOWPayments to complete the transfer.",
                      "Нажмите ниже для генерации адреса USDT. Вы будете перенаправлены на NOWPayments для перевода.",
                    )
                  : pickLocale(
                      locale,
                      "Sign in first to create a payment invoice.",
                      "Войдите, чтобы создать счёт.",
                    )}
              </p>
              <Button
                type="button"
                variant="cognition"
                className="w-full"
                disabled={busy || !signedIn}
                onClick={create}
              >
                {busy
                  ? pickLocale(locale, "Preparing invoice…", "Готовим счёт…")
                  : pickLocale(locale, "Generate USDT invoice", "Создать счёт USDT")}
              </Button>
              {!signedIn && (
                <p className="mt-3 text-center text-[11px] text-ms-muted">
                  <button
                    type="button"
                    onClick={openAuth}
                    className="text-ms-cognition/80 hover:text-ms-cognition"
                  >
                    {pickLocale(locale, "Sign in →", "Войти →")}
                  </button>
                </p>
              )}
            </>
          ) : (
            <div className="space-y-3">
              {/* Resume notice */}
              {isResumedInvoice && (
                <div className="rounded-ms-lg border border-ms-border/60 bg-ms-elevated/15 px-3 py-2 text-[11px] text-ms-muted">
                  {pickLocale(
                    locale,
                    "Resuming previous payment session — checking your transaction status.",
                    "Возобновляем предыдущую оплату — проверяем статус транзакции.",
                  )}
                </div>
              )}

              {/* Payment URL */}
              {(invoice && invoice.ok && invoice.paymentUrl) || sub.lastPaymentUrl ? (
                <a
                  href={(invoice && invoice.ok && invoice.paymentUrl) || sub.lastPaymentUrl || "#"}
                  target="_blank"
                  rel="noreferrer"
                  className="ms-focus-ring flex w-full items-center justify-center gap-2 rounded-ms-lg border border-ms-cognition/40 bg-ms-cognition/8 px-4 py-3 text-[13px] font-medium text-ms-text hover:border-ms-cognition/60 hover:bg-ms-cognition/12 transition-colors"
                >
                  <ExternalLink className="size-4" strokeWidth={1.5} />
                  {pickLocale(locale, "Open payment page", "Открыть страницу оплаты")}
                </a>
              ) : (
                !isResumedInvoice && (
                  <div className="rounded-ms-lg border border-dashed border-ms-border bg-ms-elevated/15 px-4 py-3 text-center text-[12px] text-ms-muted">
                    {pickLocale(
                      locale,
                      "Payment page is loading — use 'Check status' in a moment.",
                      "Страница загружается — нажмите 'Проверить' через момент.",
                    )}
                  </div>
                )
              )}

              {/* Poll status */}
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  disabled={busy}
                  onClick={() => void check()}
                >
                  {busy
                    ? pickLocale(locale, "Checking…", "Проверяем…")
                    : pickLocale(locale, "Check payment status", "Проверить статус")}
                </Button>
                {poll?.ok && (
                  <StatusPill accent={paid ? "warning" : "neutral"}>
                    {paid
                      ? pickLocale(locale, "Paid", "Оплачено")
                      : poll.status === "confirming"
                        ? pickLocale(locale, "Confirming", "Подтверждается")
                        : poll.status === "expired"
                          ? pickLocale(locale, "Expired", "Истёк")
                          : pickLocale(locale, "Awaiting", "Ожидание")}
                  </StatusPill>
                )}
              </div>

              {/* Waiting hint */}
              {hasInvoice && !paid && (
                <p className="text-[11px] leading-relaxed text-ms-faint">
                  {pickLocale(
                    locale,
                    "Checks automatically every 12 seconds for up to 30 minutes. Access activates immediately after confirmation.",
                    "Проверка каждые 12 сек в течение 30 минут. Доступ активируется сразу после подтверждения.",
                  )}
                </p>
              )}
            </div>
          )}

          {note ? (
            <div
              className={`mt-4 rounded-ms-lg border px-3 py-2 text-[12px] ${paid ? "border-ms-warning/40 bg-ms-warning/8 text-ms-text" : "border-ms-border bg-ms-elevated/20 text-ms-muted"}`}
            >
              {note}
            </div>
          ) : null}
        </div>

        {/* Trust note */}
        <div className="flex items-start gap-2 px-1">
          <Shield
            className="mt-0.5 size-3.5 flex-shrink-0 text-ms-warning/60"
            strokeWidth={1.5}
            aria-hidden
          />
          <p className="text-[11px] leading-snug text-ms-faint">
            {pickLocale(
              locale,
              "Settlement is fully automatic. Your access tier is updated server-side within seconds of confirmation.",
              "Зачисление полностью автоматическое. Уровень доступа обновляется на сервере в течение секунд после подтверждения.",
            )}
          </p>
        </div>
      </div>
    </Modal>
  );
}
