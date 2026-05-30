"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { m, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  CreditCard,
  Crown,
  Link2,
  LogOut,
  Mail,
  MessageSquareText,
  ShieldCheck,
  Smartphone,
  UserRound,
  X,
} from "lucide-react";
import { createPortal } from "react-dom";

import { Button } from "@/components/ui/button";
import { StatusPill } from "@/components/ui/status-pill";
import {
  accessPlanDetail,
  accessPlanLabel,
  formatAccountDate,
  formatAccountDateTime,
  formatPaymentAmount,
  FOUNDER_INCLUDED_SYSTEMS,
  maskAccountEmail,
  paymentStatusLabel,
  productLabelFromId,
  providerLabel,
  subscriptionStatusLabel,
} from "@/lib/account/account-display";
import type { PaymentStatus } from "@/lib/billing/payment-record";
import { hasFounderAccess } from "@/lib/access/founder";
import { hasFullPlatformAccess } from "@/lib/access/capabilities";
import { clearClientSession } from "@/lib/auth/sign-out";
import { pickLocale } from "@/lib/i18n/cognition-dict";
import { msFadeScale, msTransition } from "@/lib/theme";
import { supabaseBrowser } from "@/lib/supabase/browser";
import { usePaymentHistory } from "@/hooks/use-payment-history";
import { useAccessStore } from "@/store/access-store";
import { useAuthStore } from "@/store/auth-store";
import { useAuthModalStore } from "@/store/auth-modal-store";
import { useCheckoutModalStore } from "@/store/checkout-modal-store";
import type { ProfileCenterSection } from "@/store/profile-center-store";
import { useProfileCenterStore } from "@/store/profile-center-store";
import { useTelegramStore } from "@/store/telegram-store";
import { useUiPrefsStore } from "@/store/ui-prefs-store";
import { cn } from "@/lib/utils";

type ProfileCenterModalProps = {
  open: boolean;
  onClose: () => void;
  initialSection?: ProfileCenterSection;
};

function SectionNav({
  section,
  onSelect,
  isFounder,
}: {
  section: ProfileCenterSection;
  onSelect: (s: ProfileCenterSection) => void;
  isFounder: boolean;
}) {
  const locale = useUiPrefsStore((s) => s.uiLocale);

  const items: { id: ProfileCenterSection; labelEn: string; labelRu: string }[] = [
    { id: "overview", labelEn: "Profile", labelRu: "Профиль" },
    { id: "access", labelEn: "Access", labelRu: "Доступ" },
    { id: "billing", labelEn: "Billing", labelRu: "Оплата" },
    ...(isFounder ? [{ id: "founder" as const, labelEn: "Founder", labelRu: "Founder" }] : []),
    { id: "connections", labelEn: "Connections", labelRu: "Связи" },
    { id: "session", labelEn: "Session", labelRu: "Сессия" },
  ];

  return (
    <nav className="ms-profile-center__nav" aria-label={pickLocale(locale, "Account sections", "Разделы аккаунта")}>
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          className={cn("ms-profile-center__nav-btn", section === item.id && "ms-profile-center__nav-btn--active")}
          onClick={() => onSelect(item.id)}
          aria-current={section === item.id ? "page" : undefined}
        >
          {pickLocale(locale, item.labelEn, item.labelRu)}
        </button>
      ))}
    </nav>
  );
}

function InfoRow({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="ms-profile-center__row">
      <p className="ms-profile-center__row-label">{label}</p>
      <p className="ms-profile-center__row-value">{value}</p>
      {hint ? <p className="ms-profile-center__row-hint">{hint}</p> : null}
    </div>
  );
}

function TelegramConnectionBlock() {
  const locale = useUiPrefsStore((s) => s.uiLocale);
  const tgStatus = useTelegramStore((s) => s.status);
  const tgLinkCode = useTelegramStore((s) => s.linkCode);
  const setPending = useTelegramStore((s) => s.setPending);
  const resetTg = useTelegramStore((s) => s.reset);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    const poll = async () => {
      if (tgStatus !== "pending" || !tgLinkCode) return;
      try {
        const res = await fetch(`/api/telegram/link-status?code=${encodeURIComponent(tgLinkCode)}`, { cache: "no-store" });
        const json = (await res.json()) as Record<string, unknown>;
        if (!alive) return;
        if (json.ok && json.status === "linked" && json.chatId) {
          useTelegramStore.getState().setLinked({ chatId: String(json.chatId) });
          setNote(pickLocale(locale, "Telegram connected.", "Telegram подключён."));
        }
      } catch {
        // ignore polling errors
      }
    };
    poll();
    const id = window.setInterval(poll, 4000);
    return () => {
      alive = false;
      window.clearInterval(id);
    };
  }, [tgStatus, tgLinkCode, locale]);

  const startLink = async () => {
    setBusy(true);
    setNote(null);
    try {
      const res = await fetch("/api/telegram/link-code", { method: "POST" });
      const json = (await res.json()) as { ok: boolean; code?: string };
      if (!json.ok || !json.code) throw new Error("link_failed");
      setPending(json.code);
    } catch {
      setNote(
        pickLocale(locale, "Could not start Telegram linking. Try again.", "Не удалось начать подключение Telegram. Попробуйте снова."),
      );
    } finally {
      setBusy(false);
    }
  };

  const botUsername = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME?.trim();
  const deeplink = botUsername && tgLinkCode ? `https://t.me/${botUsername}?start=${tgLinkCode}` : null;

  return (
    <div className="ms-profile-center__panel">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="ms-profile-center__panel-title">
            {pickLocale(locale, "Telegram Connection", "Подключение Telegram")}
          </p>
          <p className="ms-profile-center__panel-sub">
            {pickLocale(
              locale,
              "Link for tactical alerts and bot commands.",
              "Связка для тактических алертов и команд бота.",
            )}
          </p>
        </div>
        <MessageSquareText className="size-4 shrink-0 text-ms-cognition/80" strokeWidth={1.5} aria-hidden />
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <StatusPill accent={tgStatus === "linked" ? "warning" : "neutral"}>
          {tgStatus === "linked"
            ? pickLocale(locale, "Connected", "Подключён")
            : tgStatus === "pending"
              ? pickLocale(locale, "Awaiting link", "Ожидание")
              : pickLocale(locale, "Not connected", "Не подключён")}
        </StatusPill>
      </div>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <Button type="button" variant="outline" size="sm" className="flex-1 gap-2" onClick={() => void startLink()} disabled={busy}>
          <Link2 className="size-3.5" strokeWidth={1.5} />
          {pickLocale(locale, "Connect Telegram", "Подключить Telegram")}
        </Button>
        {tgStatus !== "unlinked" ? (
          <Button type="button" variant="ghost" size="sm" className="flex-1" onClick={resetTg} disabled={busy}>
            {pickLocale(locale, "Reset link", "Сбросить")}
          </Button>
        ) : null}
      </div>

      {tgLinkCode ? (
        <div className="mt-4 space-y-2 rounded-ms-lg border border-ms-border/25 bg-ms-surface/25 p-3">
          <p className="ms-data-label text-ms-faint">{pickLocale(locale, "Link code", "Код связки")}</p>
          <p className="font-mono text-[12px] text-ms-text">{tgLinkCode}</p>
          <p className="text-[11px] leading-relaxed text-ms-muted">
            {pickLocale(locale, "Send /link CODE to the bot, or open the link below.", "Отправьте /link CODE боту или откройте ссылку.")}
          </p>
          {deeplink ? (
            <a
              href={deeplink}
              target="_blank"
              rel="noreferrer"
              className="ms-focus-ring inline-flex items-center gap-2 rounded-ms-md border border-ms-border/40 bg-ms-elevated/20 px-3 py-2 text-[11px] font-medium text-ms-text hover:border-ms-border-mid"
            >
              <ArrowRight className="size-3.5" strokeWidth={1.5} />
              {pickLocale(locale, "Open Telegram", "Открыть Telegram")}
            </a>
          ) : null}
        </div>
      ) : null}

      {note ? <p className="mt-3 text-[11px] text-ms-muted">{note}</p> : null}
    </div>
  );
}

function PaymentHistoryBlock() {
  const locale = useUiPrefsStore((s) => s.uiLocale);
  const signedIn = useAuthStore((s) => s.status === "signed_in");
  const { payments, loading, error } = usePaymentHistory(signedIn);

  return (
    <div className="ms-profile-center__panel">
      <p className="ms-profile-center__panel-title">{pickLocale(locale, "Payment History", "История оплат")}</p>
      <p className="ms-profile-center__panel-sub">
        {pickLocale(locale, "Verified transactions on your account.", "Подтверждённые транзакции на аккаунте.")}
      </p>

      {loading ? (
        <div className="mt-4 space-y-2" aria-busy="true" aria-label={pickLocale(locale, "Loading history", "Загрузка истории")}>
          {[0, 1, 2].map((i) => (
            <div key={i} className="ms-profile-center__payment-row animate-pulse">
              <div className="h-3 w-2/5 rounded bg-ms-elevated/40" />
              <div className="mt-2 h-2 w-1/3 rounded bg-ms-elevated/25" />
            </div>
          ))}
        </div>
      ) : error ? (
        <p className="mt-4 text-[11px] text-ms-muted">
          {pickLocale(locale, "Payment history is unavailable right now.", "История оплат сейчас недоступна.")}
        </p>
      ) : payments.length === 0 ? (
        <p className="mt-4 text-[11px] text-ms-muted">
          {pickLocale(locale, "No payments recorded yet.", "Оплат пока нет.")}
        </p>
      ) : (
        <ul className="mt-4 space-y-2">
          {payments.map((p) => (
            <li key={p.id} className="ms-profile-center__payment-row">
              <div className="flex min-w-0 items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-[12px] font-medium text-ms-text">
                    {productLabelFromId(p.productId, locale)}
                  </p>
                  <p className="mt-0.5 text-[10px] text-ms-faint">
                    {formatAccountDateTime(p.processedAt ?? p.createdAt)} · {providerLabel(p.provider)}
                  </p>
                </div>
                <div className="shrink-0 text-end">
                  <p className="font-mono text-[12px] tabular-nums text-ms-text">
                    ${formatPaymentAmount(p.amount)} {p.currency}
                  </p>
                  <StatusPill accent={p.status === "paid" ? "warning" : "neutral"} className="mt-1 text-[8px]">
                    {paymentStatusLabel(locale, p.status as PaymentStatus)}
                  </StatusPill>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function ProfileCenterModal({ open, onClose, initialSection = "overview" }: ProfileCenterModalProps) {
  const locale = useUiPrefsStore((s) => s.uiLocale);
  const section = useProfileCenterStore((s) => s.section);
  const setSection = useProfileCenterStore((s) => s.setSection);
  const profile = useAccessStore((s) => s.profile);
  const serverConfirmed = useAccessStore((s) => s.serverConfirmed);
  const authStatus = useAuthStore((s) => s.status);
  const authUser = useAuthStore((s) => s.user);
  const openAuth = useAuthModalStore((s) => s.openAuth);
  const openCheckout = useCheckoutModalStore((s) => s.openCheckout);
  const tgStatus = useTelegramStore((s) => s.status);
  const sb = useMemo(() => supabaseBrowser(), []);
  const [mounted, setMounted] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (open) setSection(initialSection);
  }, [open, initialSection, setSection]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const signedIn = authStatus === "signed_in" && Boolean(authUser?.id);
  const isFounder = serverConfirmed && hasFounderAccess(profile);
  const isPremium = serverConfirmed && hasFullPlatformAccess(profile);
  const email = authUser?.email ?? null;
  const telegramUsername = authUser?.user_metadata?.telegram_username
    ? `@${String(authUser.user_metadata.telegram_username)}`
    : null;

  const handleSignOut = async () => {
    if (!sb) return;
    setSigningOut(true);
    try {
      await sb.auth.signOut();
      clearClientSession();
      onClose();
    } finally {
      setSigningOut(false);
    }
  };

  if (!mounted || !open) return null;

  return createPortal(
    <AnimatePresence>
      {open ? (
        <m.div
          className="ms-profile-center__overlay fixed inset-0 z-[110] flex items-end justify-center sm:items-center sm:p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={msTransition.fast}
        >
          <button
            type="button"
            className="absolute inset-0 bg-ms-overlay backdrop-blur-md"
            aria-label={pickLocale(locale, "Close account center", "Закрыть центр аккаунта")}
            onClick={onClose}
          />

          <m.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="ms-profile-center-title"
            initial={msFadeScale.initial}
            animate={msFadeScale.animate}
            exit={msFadeScale.exit}
            transition={msTransition.medium}
            className="ms-profile-center relative z-[1] flex max-h-[min(92dvh,720px)] w-full flex-col overflow-hidden rounded-t-ms-2xl border border-ms-border-strong bg-ms-surface shadow-ms-float sm:max-w-xl sm:rounded-ms-2xl"
          >
            {/* Header */}
            <div className="shrink-0 border-b border-ms-border/25 px-4 py-4 sm:px-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-mono text-[10px] font-medium uppercase tracking-[0.18em] text-ms-faint">
                    {pickLocale(locale, "Account Center", "Центр аккаунта")}
                  </p>
                  <h2 id="ms-profile-center-title" className="mt-1 text-[1.05rem] font-semibold tracking-tight text-ms-text sm:text-[1.15rem]">
                    {signedIn
                      ? pickLocale(locale, "Your access & identity", "Ваш доступ и идентичность")
                      : pickLocale(locale, "Sign in to continue", "Войдите для продолжения")}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="ms-focus-ring flex size-9 shrink-0 items-center justify-center rounded-ms-md border border-ms-border/50 text-ms-muted hover:text-ms-text"
                  aria-label={pickLocale(locale, "Close", "Закрыть")}
                >
                  <X className="size-4" strokeWidth={1.75} />
                </button>
              </div>

              {signedIn ? (
                <SectionNav section={section} onSelect={setSection} isFounder={isFounder} />
              ) : null}
            </div>

            {/* Body */}
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-4 py-4 sm:px-5 sm:py-5">
              {!signedIn ? (
                <div className="space-y-4">
                  <p className="text-[13px] leading-relaxed text-ms-muted">
                    {pickLocale(
                      locale,
                      "Sign in to view your plan, billing history, and connected accounts.",
                      "Войдите, чтобы увидеть тариф, историю оплат и подключённые аккаунты.",
                    )}
                  </p>
                  <Button
                    type="button"
                    variant="cognition"
                    className="w-full"
                    onClick={() => {
                      onClose();
                      openAuth();
                    }}
                  >
                    {pickLocale(locale, "Sign in", "Войти")}
                  </Button>
                  <p className="text-center text-[11px] text-ms-faint">
                    {pickLocale(
                      locale,
                      "Your plan, billing, and connected accounts live here after sign-in.",
                      "Тариф, оплаты и подключённые аккаунты — здесь после входа.",
                    )}
                  </p>
                </div>
              ) : (
                <>
                  {section === "overview" ? (
                    <div className="space-y-4">
                      <div className="ms-profile-center__hero">
                        <div className="ms-profile-center__avatar" aria-hidden>
                          <UserRound className="size-5" strokeWidth={1.4} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[14px] font-semibold text-ms-text">
                            {email ? maskAccountEmail(email) : telegramUsername ?? pickLocale(locale, "MONEYSET Member", "Участник MONEYSET")}
                          </p>
                          <p className="mt-0.5 text-[11px] text-ms-muted">
                            {isFounder
                              ? pickLocale(locale, "Founding member · lifetime access", "Founding member · пожизненный доступ")
                              : isPremium
                                ? pickLocale(locale, "Premium intelligence access", "Premium доступ")
                                : pickLocale(locale, "Free tier · upgrade available", "Бесплатный тариф · доступен апгрейд")}
                          </p>
                        </div>
                        <StatusPill accent={isPremium ? "warning" : "neutral"}>{accessPlanLabel(locale, profile)}</StatusPill>
                      </div>

                      <div className="ms-profile-center__panel">
                        <InfoRow
                          label={pickLocale(locale, "Current plan", "Текущий тариф")}
                          value={accessPlanLabel(locale, profile)}
                          hint={accessPlanDetail(locale, profile)}
                        />
                        <InfoRow
                          label={pickLocale(locale, "Access status", "Статус доступа")}
                          value={
                            serverConfirmed
                              ? subscriptionStatusLabel(locale, profile.subscriptionStatus)
                              : pickLocale(locale, "Verifying…", "Проверка…")
                          }
                        />
                      </div>

                      {!isPremium ? (
                        <Button type="button" variant="cognition" className="w-full" onClick={() => openCheckout("founding_access")}>
                          {pickLocale(locale, "Upgrade to Founding Access", "Founding Access")}
                        </Button>
                      ) : null}
                    </div>
                  ) : null}

                  {section === "access" ? (
                    <div className="space-y-4">
                      <div className="ms-profile-center__panel">
                        <div className="flex items-start gap-3">
                          <ShieldCheck className="mt-0.5 size-4 shrink-0 text-ms-warning/80" strokeWidth={1.5} />
                          <div className="min-w-0">
                            <p className="ms-profile-center__panel-title">
                              {pickLocale(locale, "Access & Billing", "Доступ и оплата")}
                            </p>
                            <p className="ms-profile-center__panel-sub">{accessPlanDetail(locale, profile)}</p>
                          </div>
                        </div>

                        <div className="mt-4 space-y-3 border-t border-ms-border/15 pt-4">
                          <InfoRow
                            label={pickLocale(locale, "Active access", "Активный доступ")}
                            value={accessPlanLabel(locale, profile)}
                          />
                          <InfoRow
                            label={pickLocale(locale, "Subscription status", "Статус подписки")}
                            value={subscriptionStatusLabel(locale, profile.subscriptionStatus)}
                          />
                          {profile.premiumUntil ? (
                            <InfoRow
                              label={pickLocale(locale, "Access until", "Доступ до")}
                              value={formatAccountDate(profile.premiumUntil)}
                            />
                          ) : null}
                          {profile.invitationUntil ? (
                            <InfoRow
                              label={pickLocale(locale, "Invitation until", "Приглашение до")}
                              value={formatAccountDate(profile.invitationUntil)}
                            />
                          ) : null}
                          <InfoRow
                            label={pickLocale(locale, "Payment status", "Статус оплаты")}
                            value={
                              isFounder
                                ? pickLocale(locale, "Lifetime · no renewal", "Пожизненно · без продления")
                                : isPremium
                                  ? pickLocale(locale, "Active entitlement", "Активное право доступа")
                                  : pickLocale(locale, "No active payment", "Нет активной оплаты")
                            }
                          />
                        </div>
                      </div>

                      {!isPremium ? (
                        <Button type="button" variant="outline" className="w-full" onClick={() => openCheckout("founding_access")}>
                          <CreditCard className="size-4" strokeWidth={1.5} />
                          {pickLocale(locale, "Founding Access — $149", "Founding Access — $149")}
                        </Button>
                      ) : null}
                    </div>
                  ) : null}

                  {section === "billing" ? <PaymentHistoryBlock /> : null}

                  {section === "founder" && isFounder ? (
                    <div className="space-y-4">
                      <div className="ms-profile-center__founder-card">
                        <div className="flex items-center gap-2">
                          <Crown className="size-4 text-ms-warning/90" strokeWidth={1.5} />
                          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-ms-warning/85">
                            {pickLocale(locale, "Founder Status", "Статус Founder")}
                          </p>
                        </div>
                        <p className="mt-3 text-[15px] font-semibold tracking-tight text-ms-text">
                          {pickLocale(locale, "Lifetime Access", "Пожизненный доступ")}
                        </p>
                        <p className="mt-1 text-[12px] leading-relaxed text-ms-muted">
                          {pickLocale(
                            locale,
                            "Permanent founding member layer — full institutional intelligence surface.",
                            "Постоянный founding-слой — полная институциональная поверхность.",
                          )}
                        </p>
                      </div>

                      <div className="ms-profile-center__panel">
                        <p className="ms-profile-center__panel-title">
                          {pickLocale(locale, "Included Systems", "Включённые системы")}
                        </p>
                        <ul className="mt-3 space-y-2">
                          {FOUNDER_INCLUDED_SYSTEMS.map((item) => (
                            <li key={item.en} className="flex items-start gap-2 text-[11px] leading-snug text-ms-muted">
                              <span className="mt-1 size-1 shrink-0 rounded-full bg-ms-cognition/70" aria-hidden />
                              {pickLocale(locale, item.en, item.ru)}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="ms-profile-center__panel">
                        <p className="ms-profile-center__panel-title">
                          {pickLocale(locale, "Premium Capabilities", "Premium возможности")}
                        </p>
                        <p className="mt-2 text-[11px] leading-relaxed text-ms-muted">
                          {pickLocale(
                            locale,
                            "Execution map, deep interpretation, replay studio, and full agent consensus are permanently unlocked.",
                            "Карта исполнения, глубокая интерпретация, replay studio и полный консенсус агентов разблокированы навсегда.",
                          )}
                        </p>
                      </div>
                    </div>
                  ) : null}

                  {section === "connections" ? (
                    <div className="space-y-4">
                      <div className="ms-profile-center__panel">
                        <div className="flex items-start gap-3">
                          <Mail className="mt-0.5 size-4 shrink-0 text-ms-muted" strokeWidth={1.5} />
                          <div className="min-w-0">
                            <p className="ms-profile-center__panel-title">
                              {pickLocale(locale, "Email Account", "Email аккаунт")}
                            </p>
                            {email ? (
                              <>
                                <p className="mt-1 font-mono text-[12px] text-ms-text">{maskAccountEmail(email)}</p>
                                <p className="mt-1 text-[11px] text-ms-faint">
                                  {pickLocale(locale, "Primary sign-in method", "Основной способ входа")}
                                </p>
                              </>
                            ) : (
                              <p className="mt-1 text-[11px] text-ms-muted">
                                {pickLocale(locale, "No email linked — Telegram sign-in active.", "Email не привязан — вход через Telegram.")}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>

                      <TelegramConnectionBlock />

                      {telegramUsername ? (
                        <div className="ms-profile-center__panel">
                          <InfoRow
                            label={pickLocale(locale, "Telegram identity", "Telegram идентичность")}
                            value={telegramUsername}
                            hint={
                              tgStatus === "linked"
                                ? pickLocale(locale, "Bot alerts enabled", "Алерты бота включены")
                                : pickLocale(locale, "Sign-in active · link bot for alerts", "Вход активен · подключите бота для алертов")
                            }
                          />
                        </div>
                      ) : null}
                    </div>
                  ) : null}

                  {section === "session" ? (
                    <div className="space-y-4">
                      <div className="ms-profile-center__panel">
                        <div className="flex items-start gap-3">
                          <Smartphone className="mt-0.5 size-4 shrink-0 text-ms-muted" strokeWidth={1.5} />
                          <div>
                            <p className="ms-profile-center__panel-title">
                              {pickLocale(locale, "Active Session", "Активная сессия")}
                            </p>
                            <p className="ms-profile-center__panel-sub">
                              {pickLocale(
                                locale,
                                "You are signed in on this device. Signing out clears local access state immediately.",
                                "Вы вошли на этом устройстве. Выход немедленно очищает локальное состояние доступа.",
                              )}
                            </p>
                          </div>
                        </div>

                        <div className="mt-4 space-y-3 border-t border-ms-border/15 pt-4">
                          <InfoRow
                            label={pickLocale(locale, "Logged-in state", "Состояние входа")}
                            value={pickLocale(locale, "Signed in", "Вход выполнен")}
                          />
                          <InfoRow
                            label={pickLocale(locale, "Connected accounts", "Подключённые аккаунты")}
                            value={
                              email && tgStatus === "linked"
                                ? pickLocale(locale, "Email + Telegram", "Email + Telegram")
                                : email
                                  ? pickLocale(locale, "Email", "Email")
                                  : telegramUsername
                                    ? pickLocale(locale, "Telegram", "Telegram")
                                    : pickLocale(locale, "Session only", "Только сессия")
                            }
                          />
                        </div>
                      </div>

                      <Button
                        type="button"
                        variant="outline"
                        className="w-full gap-2 text-ms-muted"
                        disabled={signingOut}
                        onClick={() => void handleSignOut()}
                      >
                        <LogOut className="size-4" strokeWidth={1.5} />
                        {signingOut
                          ? pickLocale(locale, "Signing out…", "Выход…")
                          : pickLocale(locale, "Sign out on this device", "Выйти на этом устройстве")}
                      </Button>

                      <p className="text-[10px] leading-relaxed text-ms-faint">
                        {pickLocale(
                          locale,
                          "Logout ends your session here. Your entitlement remains tied to your account.",
                          "Выход завершает сессию здесь. Право доступа остаётся привязанным к аккаунту.",
                        )}
                      </p>

                      <Link
                        href="/settings"
                        onClick={onClose}
                        className="ms-focus-ring block rounded-ms-lg border border-ms-border/25 bg-ms-elevated/10 px-3 py-2.5 text-[11px] font-medium text-ms-muted hover:text-ms-text"
                      >
                        {pickLocale(locale, "Open full preferences →", "Открыть все настройки →")}
                      </Link>
                    </div>
                  ) : null}
                </>
              )}
            </div>
          </m.div>
        </m.div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}
