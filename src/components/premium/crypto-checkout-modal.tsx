"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ExternalLink, Shield } from "lucide-react";

import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { StatusPill } from "@/components/ui/status-pill";
import { billingProduct } from "@/lib/billing/catalog";
import { hasClientAuthToken, resolveClientAuthHeaders } from "@/lib/access/client-auth-headers";
import { pickLocale } from "@/lib/i18n/cognition-dict";
import { mapBillingUserMessage } from "@/lib/i18n/user-messages";
import { useAccessStore } from "@/store/access-store";
import { useAuthModalStore } from "@/store/auth-modal-store";
import { useAuthStore } from "@/store/auth-store";
import { useCheckoutModalStore } from "@/store/checkout-modal-store";
import { useSubscriptionStore } from "@/store/subscription-store";
import type { CreateInvoiceResult, InvoiceStatusResult } from "@/types/billing";
import { useUiPrefsStore } from "@/store/ui-prefs-store";
import { MemberSupportPanel } from "@/components/support/member-support-panel";
import { cn } from "@/lib/utils";

const POLL_INTERVAL_MS = 12_000;
const POLL_MAX_TICKS = 150;

type InitPhase = "idle" | "loading" | "ready";

type CryptoCheckoutModalProps = {
  open: boolean;
  onClose: () => void;
};

function waitForSubscriptionHydration(): Promise<void> {
  return new Promise((resolve) => {
    if (useSubscriptionStore.persist.hasHydrated()) {
      resolve();
      return;
    }
    const unsub = useSubscriptionStore.persist.onFinishHydration(() => {
      unsub();
      resolve();
    });
  });
}

export function CryptoCheckoutModal({ open, onClose }: CryptoCheckoutModalProps) {
  const locale = useUiPrefsStore((s) => s.uiLocale);
  const productId = useCheckoutModalStore((s) => s.productId);
  const product = billingProduct(productId);
  const user = useAuthStore((s) => s.user);
  const authStatus = useAuthStore((s) => s.status);
  const openAuth = useAuthModalStore((s) => s.openAuth);
  const setProfile = useAccessStore((s) => s.setProfile);
  const lastInvoiceId = useSubscriptionStore((s) => s.lastInvoiceId);
  const lastPaymentUrl = useSubscriptionStore((s) => s.lastPaymentUrl);
  const setPendingInvoice = useSubscriptionStore((s) => s.setPendingInvoice);
  const clearPendingInvoice = useSubscriptionStore((s) => s.clearPendingInvoice);
  const setTierActive = useSubscriptionStore((s) => s.setTierActive);

  const currency = "USDT" as const;
  const authReady = authStatus !== "unknown";
  const signedIn = authStatus === "signed_in" && Boolean(user?.id);
  const canPoll = authReady && signedIn;

  const [initPhase, setInitPhase] = useState<InitPhase>("idle");
  const [busy, setBusy] = useState(false);
  const [invoice, setInvoice] = useState<CreateInvoiceResult | null>(null);
  const [poll, setPoll] = useState<InvoiceStatusResult | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const pollTicksRef = useRef(0);

  const invoiceId = useMemo(() => {
    if (invoice && invoice.ok) return invoice.invoiceId;
    return lastInvoiceId;
  }, [invoice, lastInvoiceId]);

  const paymentUrl = useMemo(() => {
    if (invoice && invoice.ok && invoice.paymentUrl) return invoice.paymentUrl;
    return lastPaymentUrl;
  }, [invoice, lastPaymentUrl]);

  useEffect(() => {
    if (!open) {
      setInvoice(null);
      setPoll(null);
      setNote(null);
      setBusy(false);
      setInitPhase("idle");
      pollTicksRef.current = 0;
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;

    let cancelled = false;
    setInitPhase("loading");

    void (async () => {
      await waitForSubscriptionHydration();
      if (cancelled) return;

      if (signedIn && (await hasClientAuthToken())) {
        try {
          const authHeaders = await resolveClientAuthHeaders();
          const qs = new URLSearchParams({ productId });
          const res = await fetch(`/api/billing/pending?${qs.toString()}`, {
            headers: authHeaders,
            cache: "no-store",
          });
          const json = (await res.json()) as {
            ok: boolean;
            invoiceId?: string | null;
            paymentUrl?: string | null;
            provider?: string | null;
            status?: string | null;
          };

          if (cancelled) return;

          if (json.ok && json.invoiceId && json.provider) {
            setPendingInvoice({
              provider: json.provider as "nowpayments",
              invoiceId: json.invoiceId,
              paymentUrl: json.paymentUrl ?? null,
            });
          } else if (json.ok && !json.invoiceId) {
            clearPendingInvoice();
            if (json.status === "expired" || json.status === "failed") {
              setNote(
                pickLocale(
                  locale,
                  "Your previous invoice expired. Generate a new USDT invoice below.",
                  "Предыдущий счёт истёк. Создайте новый USDT-счёт ниже.",
                ),
              );
            }
          }
        } catch {
          /* fall back to local resume state */
        }
      }

      if (!cancelled) setInitPhase("ready");
    })();

    return () => {
      cancelled = true;
    };
  }, [open, signedIn, productId, locale, setPendingInvoice, clearPendingInvoice]);

  const check = useCallback(
    async (opts?: { invoiceId?: string }) => {
      const pollInvoiceId = opts?.invoiceId ?? invoiceId;
      if (!pollInvoiceId) return;
      if (!authReady) return;

      if (!signedIn || !(await hasClientAuthToken())) {
        setNote(
          pickLocale(locale, "Sign in to check payment status.", "Войдите, чтобы проверить статус оплаты."),
        );
        return;
      }

      setBusy(true);
      setNote(null);
      try {
        const authHeaders = await resolveClientAuthHeaders();
        const qs = new URLSearchParams({ invoiceId: pollInvoiceId });
        const res = await fetch(`/api/billing/status?${qs.toString()}`, {
          headers: authHeaders,
          cache: "no-store",
        });
        const json = (await res.json()) as InvoiceStatusResult;
        setPoll(json);

        if (json.ok && (json.status === "expired" || json.status === "failed")) {
          clearPendingInvoice();
          setNote(
            pickLocale(
              locale,
              "This invoice expired. Generate a new USDT invoice to continue.",
              "Срок счёта истёк. Создайте новый USDT-счёт, чтобы продолжить.",
            ),
          );
          return;
        }

        if (json.ok && json.status === "paid") {
          const isFounding = productId === "founding_access";
          setTierActive("premium", {
            provider: json.provider,
            periodDays: isFounding ? null : (product?.subscriptionDays ?? 30),
          });
          const me = await fetch("/api/access/me", { headers: authHeaders, cache: "no-store" });
          const profileJson = (await me.json()) as {
            ok: boolean;
            profile?: Parameters<typeof setProfile>[0];
          };
          if (profileJson.ok && profileJson.profile) setProfile(profileJson.profile);
          clearPendingInvoice();
          setNote(
            pickLocale(
              locale,
              isFounding ? "Founding Access active." : "Premium access active.",
              isFounding ? "Founding Access активен." : "Премиум доступ активен.",
            ),
          );
        }

        if (!json.ok) {
          const err = "error" in json ? json.error : null;
          if (res.status === 401) {
            setNote(
              pickLocale(locale, "Sign in to check payment status.", "Войдите, чтобы проверить статус оплаты."),
            );
          } else {
            setNote(mapBillingUserMessage(locale, err, { httpStatus: res.status, phase: "poll" }));
          }
        }
      } catch {
        setNote(
          pickLocale(locale, "Could not verify payment. Try again.", "Не удалось проверить оплату."),
        );
      } finally {
        setBusy(false);
      }
    },
    [
      invoiceId,
      authReady,
      signedIn,
      productId,
      product?.subscriptionDays,
      locale,
      setProfile,
      setTierActive,
      clearPendingInvoice,
    ],
  );

  const create = async () => {
    if (!signedIn) {
      setNote(pickLocale(locale, "Sign in to create an invoice.", "Войдите, чтобы создать счёт."));
      openAuth();
      return;
    }
    setNote(null);
    setBusy(true);
    try {
      const authHeaders = await resolveClientAuthHeaders();
      const res = await fetch("/api/billing/create", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify({ productId, payCurrency: currency }),
      });
      const json = (await res.json()) as CreateInvoiceResult;
      setInvoice(json);
      if (json.ok) {
        setPendingInvoice({
          provider: json.provider,
          invoiceId: json.invoiceId,
          paymentUrl: json.paymentUrl ?? null,
        });
        pollTicksRef.current = 0;
        if (json.paymentUrl) void check({ invoiceId: json.invoiceId });
      }
      if (!json.ok) {
        setNote(mapBillingUserMessage(locale, "error" in json ? json.error : null, { httpStatus: res.status, phase: "create" }));
      }
    } catch {
      setNote(
        pickLocale(locale, "Could not create invoice. Try again.", "Не удалось создать счёт."),
      );
    } finally {
      setBusy(false);
    }
  };

  const paid = poll?.ok && poll.status === "paid";
  const confirming = poll?.ok && (poll.status === "confirming" || poll.status === "unpaid");
  const hasInvoice = Boolean(invoiceId);
  const isResumedInvoice = hasInvoice && !(invoice?.ok);
  const initializing = initPhase !== "ready" || !authReady;

  const planLabel =
    productId === "founding_access"
      ? pickLocale(locale, "Founding Access", "Founding Access")
      : (product?.label ?? "Premium");

  const paymentSuccessNotes = useMemo(
    () =>
      new Set([
        pickLocale(locale, "Founding Access active.", "Founding Access активен."),
        pickLocale(locale, "Premium access active.", "Премиум доступ активен."),
      ]),
    [locale],
  );

  const showPaymentSupport = note != null && !paid && !paymentSuccessNotes.has(note);

  const resumeBannerText = initializing
    ? pickLocale(locale, "Preparing checkout…", "Подготовка оплаты…")
    : isResumedInvoice
      ? canPoll
        ? pickLocale(
            locale,
            "Resuming previous payment session — checking your transaction status.",
            "Возобновляем предыдущую оплату — проверяем статус транзакции.",
          )
        : pickLocale(
            locale,
            "Resuming previous payment session — sign in to check status.",
            "Возобновляем предыдущую оплату — войдите, чтобы проверить статус.",
          )
      : null;

  const actionFooter = (
    <div className="ms-checkout-modal__action space-y-3">
      <div
        className={cn(
          "ms-checkout-modal__slot ms-checkout-modal__slot--banner",
          !resumeBannerText && "ms-checkout-modal__slot--empty",
        )}
        aria-live="polite"
      >
        {resumeBannerText ? (
          <p className="text-[11px] leading-relaxed text-ms-muted">{resumeBannerText}</p>
        ) : null}
      </div>

      <div className="ms-checkout-modal__slot ms-checkout-modal__slot--primary">
        {initializing ? (
          <div className="ms-checkout-modal__skeleton ms-checkout-modal__skeleton--btn" aria-hidden />
        ) : !hasInvoice ? (
          <>
            <p className="mb-3 text-[12px] leading-relaxed text-ms-muted">
              {signedIn
                ? pickLocale(
                    locale,
                    "Generate a secure USDT payment link. Complete the transfer on the checkout page — access activates after confirmation.",
                    "Создайте защищённую ссылку USDT. Завершите перевод на странице оплаты — доступ активируется после подтверждения.",
                  )
                : pickLocale(locale, "Sign in first to create a payment invoice.", "Войдите, чтобы создать счёт.")}
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
            {!signedIn ? (
              <p className="mt-2 text-center text-[11px] text-ms-muted">
                <button
                  type="button"
                  onClick={openAuth}
                  className="text-ms-cognition/80 hover:text-ms-cognition"
                >
                  {pickLocale(locale, "Sign in →", "Войти →")}
                </button>
              </p>
            ) : null}
          </>
        ) : paymentUrl ? (
          <a
            href={paymentUrl}
            target="_blank"
            rel="noreferrer"
            className="ms-focus-ring flex w-full items-center justify-center gap-2 rounded-ms-lg border border-ms-cognition/40 bg-ms-cognition/8 px-4 py-3 text-[13px] font-medium text-ms-text transition-colors hover:border-ms-cognition/60 hover:bg-ms-cognition/12"
          >
            <ExternalLink className="size-4" strokeWidth={1.5} />
            {pickLocale(locale, "Open payment page", "Открыть страницу оплаты")}
          </a>
        ) : (
          <div className="flex w-full items-center justify-center rounded-ms-lg border border-dashed border-ms-border bg-ms-elevated/15 px-4 py-3 text-center text-[12px] text-ms-muted">
            {pickLocale(locale, "Loading payment link…", "Загрузка ссылки оплаты…")}
          </div>
        )}
      </div>

      <div className="ms-checkout-modal__slot ms-checkout-modal__slot--status">
        {initializing ? (
          <div className="ms-checkout-modal__skeleton ms-checkout-modal__skeleton--row" aria-hidden />
        ) : hasInvoice ? (
          !canPoll ? (
            <div className="rounded-ms-lg border border-ms-border/60 bg-ms-elevated/15 px-3 py-3 text-center text-[12px] text-ms-muted">
              <p>
                {authReady
                  ? pickLocale(
                      locale,
                      "Sign in to check payment status for this invoice.",
                      "Войдите, чтобы проверить статус оплаты по этому счёту.",
                    )
                  : pickLocale(locale, "Loading session…", "Загружаем сессию…")}
              </p>
              {authReady && !signedIn ? (
                <button
                  type="button"
                  onClick={openAuth}
                  className="mt-2 text-ms-cognition/80 hover:text-ms-cognition"
                >
                  {pickLocale(locale, "Sign in →", "Войти →")}
                </button>
              ) : null}
            </div>
          ) : (
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
              {poll?.ok ? (
                <StatusPill accent={paid ? "warning" : "neutral"}>
                  {paid
                    ? pickLocale(locale, "Paid", "Оплачено")
                    : poll.status === "confirming"
                      ? pickLocale(locale, "Confirming", "Подтверждается")
                      : poll.status === "expired"
                        ? pickLocale(locale, "Expired", "Истёк")
                        : pickLocale(locale, "Awaiting", "Ожидание")}
                </StatusPill>
              ) : (
                <StatusPill accent="neutral" className="opacity-60">
                  {pickLocale(locale, "Awaiting", "Ожидание")}
                </StatusPill>
              )}
            </div>
          )
        ) : (
          <div className="rounded-ms-lg border border-transparent px-3 py-3 text-center text-[11px] text-ms-faint">
            {pickLocale(locale, "Status appears after invoice creation.", "Статус появится после создания счёта.")}
          </div>
        )}
      </div>

      {hasInvoice && !paid && canPoll && !initializing ? (
        <p className="text-[11px] leading-relaxed text-ms-faint">
          {pickLocale(
            locale,
            "We check automatically after you pay. Confirmation usually takes a few minutes.",
            "Проверяем автоматически после оплаты. Подтверждение обычно занимает несколько минут.",
          )}
        </p>
      ) : (
        <div className="ms-checkout-modal__slot ms-checkout-modal__slot--hint" aria-hidden />
      )}

      {note ? (
        <div
          className={`rounded-ms-lg border px-3 py-2 text-[12px] ${paid ? "border-ms-warning/40 bg-ms-warning/8 text-ms-text" : "border-ms-border bg-ms-elevated/20 text-ms-muted"}`}
        >
          {note}
        </div>
      ) : null}

      {showPaymentSupport ? <MemberSupportPanel variant="payment-error" /> : null}

      <div className="ms-checkout-modal__trust">
        <Shield className="mt-0.5 size-3.5 shrink-0 text-ms-warning/70" strokeWidth={1.5} aria-hidden />
        <p>
          {pickLocale(
            locale,
            "Access activates automatically once your payment is confirmed.",
            "Доступ активируется автоматически после подтверждения оплаты.",
          )}
        </p>
      </div>

      <MemberSupportPanel variant="compact" />
    </div>
  );

  useEffect(() => {
    if (!open || !invoiceId || !canPoll || initPhase !== "ready") return;
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
  }, [open, invoiceId, paid, canPoll, check, locale, initPhase]);

  return (
    <Modal
      open={open}
      onClose={() => onClose()}
      variant="premium"
      title={pickLocale(locale, "Founding Access", "Founding Access")}
      description={pickLocale(
        locale,
        "Lifetime intelligence depth — execution layer, structural zones, and full platform access.",
        "Пожизненная глубина интеллекта — слой исполнения, структурные зоны и полный доступ к платформе.",
      )}
      footer={actionFooter}
    >
      <div className="ms-checkout-modal ms-checkout-modal--premium">
        <div className="ms-checkout-modal__summary">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="ms-data-label text-ms-faint">
                {pickLocale(locale, "You are purchasing", "Вы покупаете")}
              </p>
              <p className="mt-1 text-[14px] font-semibold text-ms-text">{planLabel}</p>
              {productId === "founding_access" ? (
                <p className="mt-1 text-[12px] text-ms-muted">
                  {pickLocale(locale, "Lifetime access · no renewal", "Пожизненный доступ · без продления")}
                </p>
              ) : null}
            </div>
            <div className="shrink-0 text-right">
              <p className="ms-checkout-modal__price font-mono tabular-nums text-ms-text">
                ${product?.priceUsd ?? "—"}
              </p>
              <p className="mt-0.5 font-mono text-[10px] uppercase tracking-wider text-ms-faint">USD</p>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <StatusPill accent="neutral">{pickLocale(locale, "USDT", "USDT")}</StatusPill>
            {paid ? (
              <StatusPill accent="warning">
                {pickLocale(locale, "Payment received", "Оплачено")}
              </StatusPill>
            ) : null}
            {confirming && !paid ? (
              <StatusPill accent="neutral">
                {pickLocale(locale, "Awaiting confirmation", "Ожидаем подтверждения")}
              </StatusPill>
            ) : null}
          </div>
        </div>
      </div>
    </Modal>
  );
}
