"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ExternalLink, Shield } from "lucide-react";

import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { StatusPill } from "@/components/ui/status-pill";
import { billingProduct } from "@/lib/billing/catalog";
import { hasClientAuthToken, resolveClientAuthHeaders } from "@/lib/access/client-auth-headers";
import { pickLocale } from "@/lib/i18n/cognition-dict";
import { mapBillingUserMessage, shouldInvalidateBillingSession } from "@/lib/i18n/user-messages";
import { useAccessStore } from "@/store/access-store";
import { useAuthModalStore } from "@/store/auth-modal-store";
import { useAuthStore } from "@/store/auth-store";
import { useCheckoutModalStore } from "@/store/checkout-modal-store";
import { useSubscriptionStore } from "@/store/subscription-store";
import type { CreateInvoiceResult, InvoiceStatusResult } from "@/types/billing";
import { useUiPrefsStore } from "@/store/ui-prefs-store";
import { MemberSupportPanel } from "@/components/support/member-support-panel";
import { nowPaymentsInvoiceUrl } from "@/services/payments/providers/nowpayments";
import { cn } from "@/lib/utils";

const POLL_INTERVAL_MS = 12_000;
const POLL_MAX_TICKS = 150;

type CheckoutMode = "initializing" | "create" | "resume" | "paid";

type SurfaceMessage = Readonly<{
  tone: "neutral" | "error" | "success";
  text: string;
}>;

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

  const [checkoutMode, setCheckoutMode] = useState<CheckoutMode>("initializing");
  const [surfaceMessage, setSurfaceMessage] = useState<SurfaceMessage | null>(null);
  const [busy, setBusy] = useState(false);
  const [invoice, setInvoice] = useState<CreateInvoiceResult | null>(null);
  const [poll, setPoll] = useState<InvoiceStatusResult | null>(null);
  const pollTicksRef = useRef(0);

  const initializing = checkoutMode === "initializing" || !authReady;

  const invoiceId = useMemo(() => {
    if (checkoutMode === "create" || checkoutMode === "initializing") {
      if (invoice?.ok) return invoice.invoiceId;
      return null;
    }
    if (invoice?.ok) return invoice.invoiceId;
    return lastInvoiceId;
  }, [checkoutMode, invoice, lastInvoiceId]);

  const paymentUrl = useMemo(() => {
    if (checkoutMode === "create" || checkoutMode === "initializing") {
      if (invoice?.ok && invoice.paymentUrl) return invoice.paymentUrl;
      return null;
    }
    if (invoice?.ok && invoice.paymentUrl) return invoice.paymentUrl;
    return lastPaymentUrl;
  }, [checkoutMode, invoice, lastPaymentUrl]);

  /** Payment link — derive from invoice id when store URL is missing. */
  const effectivePaymentUrl = useMemo(() => {
    if (paymentUrl) return paymentUrl;
    const id = invoice?.ok ? invoice.invoiceId : checkoutMode === "resume" ? lastInvoiceId : null;
    return id ? nowPaymentsInvoiceUrl(id) : null;
  }, [paymentUrl, invoice, checkoutMode, lastInvoiceId]);

  const invoiceReadyMessage = useMemo(
    () =>
      pickLocale(
        locale,
        "Invoice ready — complete payment on the checkout page.",
        "Счёт готов — завершите оплату на странице checkout.",
      ),
    [locale],
  );

  const resetCheckoutState = useCallback(() => {
    clearPendingInvoice();
    setInvoice(null);
    setPoll(null);
    pollTicksRef.current = 0;
  }, [clearPendingInvoice]);

  const switchToCreate = useCallback(
    (message?: SurfaceMessage | null) => {
      resetCheckoutState();
      setCheckoutMode("create");
      setSurfaceMessage(message ?? null);
    },
    [resetCheckoutState],
  );

  useEffect(() => {
    if (!open) {
      setInvoice(null);
      setPoll(null);
      setSurfaceMessage(null);
      setBusy(false);
      setCheckoutMode("initializing");
      pollTicksRef.current = 0;
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;

    let cancelled = false;
    setCheckoutMode("initializing");
    setSurfaceMessage({
      tone: "neutral",
      text: pickLocale(locale, "Preparing checkout…", "Подготовка оплаты…"),
    });

    void (async () => {
      await waitForSubscriptionHydration();
      if (cancelled) return;

      if (!signedIn || !(await hasClientAuthToken())) {
        resetCheckoutState();
        if (!cancelled) {
          setCheckoutMode("create");
          setSurfaceMessage(null);
        }
        return;
      }

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
          setCheckoutMode("resume");
          setSurfaceMessage({
            tone: "neutral",
            text: pickLocale(
              locale,
              "Resuming your previous payment — we'll check status automatically.",
              "Возобновляем предыдущую оплату — статус проверим автоматически.",
            ),
          });
          return;
        }

        resetCheckoutState();
        setCheckoutMode("create");
        if (json.status === "expired" || json.status === "failed") {
          setSurfaceMessage({
            tone: "neutral",
            text: pickLocale(
              locale,
              "Your previous payment session expired. Create a new invoice below.",
              "Предыдущая сессия оплаты истекла. Создайте новый счёт ниже.",
            ),
          });
        } else {
          setSurfaceMessage(null);
        }
      } catch {
        if (!cancelled) switchToCreate(null);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open, signedIn, productId, locale, setPendingInvoice, resetCheckoutState, switchToCreate]);

  const check = useCallback(
    async (opts?: { invoiceId?: string }) => {
      const pollInvoiceId = opts?.invoiceId ?? invoiceId;
      if (!pollInvoiceId || checkoutMode !== "resume") return;
      if (!authReady) return;

      if (!signedIn || !(await hasClientAuthToken())) {
        setSurfaceMessage({
          tone: "neutral",
          text: pickLocale(locale, "Sign in to check payment status.", "Войдите, чтобы проверить статус оплаты."),
        });
        return;
      }

      setBusy(true);
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
          switchToCreate({
            tone: "neutral",
            text: pickLocale(
              locale,
              "Your previous payment session expired. Create a new invoice below.",
              "Предыдущая сессия оплаты истекла. Создайте новый счёт ниже.",
            ),
          });
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
          resetCheckoutState();
          setCheckoutMode("paid");
          setSurfaceMessage({
            tone: "success",
            text: pickLocale(
              locale,
              isFounding ? "Founding Access active." : "Premium access active.",
              isFounding ? "Founding Access активен." : "Премиум доступ активен.",
            ),
          });
          return;
        }

        if (!json.ok) {
          const err = "error" in json ? json.error : null;
          const friendly = mapBillingUserMessage(locale, err, { httpStatus: res.status, phase: "poll" });

          if (res.status === 401) {
            setSurfaceMessage({
              tone: "neutral",
              text: pickLocale(locale, "Sign in to check payment status.", "Войдите, чтобы проверить статус оплаты."),
            });
            return;
          }

          // Status poll failed but invoice exists — non-fatal; user can still pay on NOWPayments.
          if (pollInvoiceId) {
            setSurfaceMessage({ tone: "neutral", text: invoiceReadyMessage });
            return;
          }

          if (shouldInvalidateBillingSession(res.status, err)) {
            switchToCreate({ tone: "error", text: friendly });
            return;
          }

          setSurfaceMessage({ tone: "error", text: friendly });
        } else if (checkoutMode === "resume") {
          setSurfaceMessage({
            tone: "neutral",
            text: pickLocale(
              locale,
              "Resuming your previous payment — we'll check status automatically.",
              "Возобновляем предыдущую оплату — статус проверим автоматически.",
            ),
          });
        }
      } catch {
        if (pollInvoiceId) {
          setSurfaceMessage({ tone: "neutral", text: invoiceReadyMessage });
        } else {
          setSurfaceMessage({
            tone: "error",
            text: pickLocale(
              locale,
              "We couldn't verify your payment right now. Try again or contact Member Support.",
              "Не удалось проверить оплату. Повторите попытку или напишите в Member Support.",
            ),
          });
        }
      } finally {
        setBusy(false);
      }
    },
    [
      invoiceId,
      checkoutMode,
      authReady,
      signedIn,
      productId,
      product?.subscriptionDays,
      locale,
      setProfile,
      setTierActive,
      paymentUrl,
      invoiceReadyMessage,
      resetCheckoutState,
      switchToCreate,
    ],
  );

  const create = async () => {
    if (!signedIn) {
      setSurfaceMessage({
        tone: "neutral",
        text: pickLocale(locale, "Sign in to create an invoice.", "Войдите, чтобы создать счёт."),
      });
      openAuth();
      return;
    }

    setBusy(true);
    setSurfaceMessage({
      tone: "neutral",
      text: pickLocale(locale, "Preparing invoice…", "Готовим счёт…"),
    });

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
        setCheckoutMode("resume");
        pollTicksRef.current = 0;
        setSurfaceMessage({
          tone: "neutral",
          text: invoiceReadyMessage,
        });
        return;
      }

      const friendly = mapBillingUserMessage(locale, "error" in json ? json.error : null, {
        httpStatus: res.status,
        phase: "create",
      });
      switchToCreate({ tone: "error", text: friendly });
    } catch {
      switchToCreate({
        tone: "error",
        text: pickLocale(
          locale,
          "We couldn't create your payment invoice. Try again in a few minutes.",
          "Не удалось создать счёт. Попробуйте через несколько минут.",
        ),
      });
    } finally {
      setBusy(false);
    }
  };

  const paid = checkoutMode === "paid" || (poll?.ok && poll.status === "paid");
  const confirming = poll?.ok && (poll.status === "confirming" || poll.status === "unpaid");
  const showResumeUi = checkoutMode === "resume" && Boolean(invoiceId);

  const planLabel =
    productId === "founding_access"
      ? pickLocale(locale, "Founding Access", "Founding Access")
      : (product?.label ?? "Premium");

  const showPaymentSupport =
    surfaceMessage?.tone === "error" && !paid && checkoutMode === "create";

  const actionFooter = (
    <div className="ms-checkout-modal__action">
      <div
        className={cn(
          "ms-checkout-modal__slot ms-checkout-modal__slot--message",
          !surfaceMessage && "ms-checkout-modal__slot--empty",
          surfaceMessage?.tone === "error" && "ms-checkout-modal__slot--error",
          surfaceMessage?.tone === "success" && "ms-checkout-modal__slot--success",
        )}
        aria-live="polite"
      >
        {surfaceMessage ? (
          <p className="ms-checkout-modal__message-text">{surfaceMessage.text}</p>
        ) : (
          <span className="ms-checkout-modal__message-text" aria-hidden>
            &nbsp;
          </span>
        )}
      </div>

      <div className="ms-checkout-modal__slot ms-checkout-modal__slot--primary">
        {initializing ? (
          <>
            <div className="ms-checkout-modal__skeleton ms-checkout-modal__skeleton--copy" aria-hidden />
            <div className="ms-checkout-modal__skeleton ms-checkout-modal__skeleton--btn" aria-hidden />
          </>
        ) : showResumeUi && effectivePaymentUrl ? (
          <a
            href={effectivePaymentUrl}
            target="_blank"
            rel="noreferrer"
            className="ms-focus-ring flex w-full items-center justify-center gap-2 rounded-ms-lg border border-ms-cognition/40 bg-ms-cognition/8 px-4 py-3 text-[13px] font-medium text-ms-text transition-colors hover:border-ms-cognition/60 hover:bg-ms-cognition/12"
          >
            <ExternalLink className="size-4" strokeWidth={1.5} />
            {pickLocale(locale, "Open payment page", "Открыть страницу оплаты")}
          </a>
        ) : showResumeUi ? (
          <div className="ms-checkout-modal__skeleton ms-checkout-modal__skeleton--btn" aria-hidden />
        ) : (
          <>
            <p className="ms-checkout-modal__primary-copy">
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
              disabled={busy || !signedIn || paid}
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
        )}
      </div>

      <div className="ms-checkout-modal__slot ms-checkout-modal__slot--status">
        {initializing ? (
          <div className="ms-checkout-modal__skeleton ms-checkout-modal__skeleton--row" aria-hidden />
        ) : showResumeUi ? (
          !canPoll ? (
            <div className="ms-checkout-modal__status-placeholder">
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
                disabled={busy || paid}
                onClick={() => void check()}
              >
                {busy
                  ? pickLocale(locale, "Checking…", "Проверяем…")
                  : pickLocale(locale, "Check payment status", "Проверить статус")}
              </Button>
              <StatusPill accent={paid ? "warning" : "neutral"}>
                {paid
                  ? pickLocale(locale, "Paid", "Оплачено")
                  : poll?.ok && poll.status === "confirming"
                    ? pickLocale(locale, "Confirming", "Подтверждается")
                    : poll?.ok && poll.status === "expired"
                      ? pickLocale(locale, "Expired", "Истёк")
                      : pickLocale(locale, "Awaiting", "Ожидание")}
              </StatusPill>
            </div>
          )
        ) : (
          <div className="ms-checkout-modal__status-placeholder ms-checkout-modal__status-placeholder--muted">
            {pickLocale(locale, "Status appears after invoice creation.", "Статус появится после создания счёта.")}
          </div>
        )}
      </div>

      <div className="ms-checkout-modal__slot ms-checkout-modal__slot--hint">
        {showResumeUi && !paid && canPoll && !initializing ? (
          <p className="ms-checkout-modal__hint-text">
            {pickLocale(
              locale,
              "We check automatically after you pay. Confirmation usually takes a few minutes.",
              "Проверяем автоматически после оплаты. Подтверждение обычно занимает несколько минут.",
            )}
          </p>
        ) : (
          <span className="ms-checkout-modal__hint-text" aria-hidden>
            &nbsp;
          </span>
        )}
      </div>

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
    if (!open || checkoutMode !== "resume" || !invoiceId || !canPoll) return;
    if (paid) return;

    pollTicksRef.current = 0;
    void check();

    const id = window.setInterval(() => {
      pollTicksRef.current += 1;
      if (pollTicksRef.current > POLL_MAX_TICKS) {
        window.clearInterval(id);
        setSurfaceMessage({
          tone: "neutral",
          text: pickLocale(
            locale,
            "Verification timed out. Payment may still settle — reopen this panel or refresh access.",
            "Время проверки истекло. Оплата может ещё пройти — откройте панель снова или обновите доступ.",
          ),
        });
        return;
      }
      void check();
    }, POLL_INTERVAL_MS);

    return () => window.clearInterval(id);
  }, [open, checkoutMode, invoiceId, paid, canPoll, check, locale]);

  return (
    <Modal
      open={open}
      onClose={() => onClose()}
      variant="premium"
      panelClassName="ms-modal-panel--checkout"
      title={pickLocale(locale, "Founding Access", "Founding Access")}
      description={pickLocale(
        locale,
        "Lifetime intelligence depth — execution layer, structural zones, and full platform access.",
        "Пожизненная глубина интеллекта — слой исполнения, структурные зоны и полный доступ к платформе.",
      )}
    >
      <div className="ms-checkout-modal ms-checkout-modal--premium ms-checkout-modal__scroll">
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
              ) : (
                <span className="mt-1 block min-h-[1.125rem]" aria-hidden />
              )}
            </div>
            <div className="shrink-0 text-right">
              <p className="ms-checkout-modal__price font-mono tabular-nums text-ms-text">
                ${product?.priceUsd ?? "—"}
              </p>
              <p className="mt-0.5 font-mono text-[10px] uppercase tracking-wider text-ms-faint">USD</p>
            </div>
          </div>
          <div className="ms-checkout-modal__pill-row mt-3 flex flex-wrap items-center gap-2">
            <StatusPill accent="neutral">{pickLocale(locale, "USDT", "USDT")}</StatusPill>
            <span className="ms-checkout-modal__pill-slot">
              {paid ? (
                <StatusPill accent="warning">
                  {pickLocale(locale, "Payment received", "Оплачено")}
                </StatusPill>
              ) : confirming && showResumeUi ? (
                <StatusPill accent="neutral">
                  {pickLocale(locale, "Awaiting confirmation", "Ожидаем подтверждения")}
                </StatusPill>
              ) : null}
            </span>
          </div>
        </div>

        {actionFooter}
      </div>
    </Modal>
  );
}
