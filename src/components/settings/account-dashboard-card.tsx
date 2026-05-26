"use client";

import { useMemo, useState } from "react";
import { LogOut, UserRound, CreditCard, ShieldCheck, Mail } from "lucide-react";

import { CognitionPanel } from "@/components/ui/panel";
import { Button } from "@/components/ui/button";
import { StatusPill } from "@/components/ui/status-pill";
import { supabaseBrowser } from "@/lib/supabase/browser";
import { guestProfile } from "@/lib/access/roles";
import { pickLocale } from "@/lib/i18n/cognition-dict";
import { useAccessStore } from "@/store/access-store";
import { useAuthStore } from "@/store/auth-store";
import { useSubscriptionStore } from "@/store/subscription-store";
import { useUiPrefsStore } from "@/store/ui-prefs-store";
import { useEntryStore } from "@/store/entry-store";
import { useTelegramStore } from "@/store/telegram-store";
import { useUpgradeModalStore } from "@/store/upgrade-modal-store";
import { useShallow } from "zustand/react/shallow";
import { cn } from "@/lib/utils";

function formatDate(ts: number | null | string): string {
  if (!ts) return "—";
  const d = new Date(typeof ts === "string" ? ts : ts);
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!local || !domain) return email;
  const masked = local.length > 3 ? `${local.slice(0, 2)}${"•".repeat(local.length - 2)}` : local;
  return `${masked}@${domain}`;
}

export function AccountDashboardCard() {
  const locale = useUiPrefsStore((s) => s.uiLocale);
  const profile = useAccessStore((s) => s.profile);
  const openUpgrade = useUpgradeModalStore((s) => s.openUpgrade);
  const auth = useAuthStore(useShallow((s) => ({ status: s.status, user: s.user })));
  const sub = useSubscriptionStore(
    useShallow((s) => ({
      tier: s.tier,
      status: s.status,
      provider: s.provider,
      currentPeriodEndTs: s.currentPeriodEndTs,
      lastInvoiceId: s.lastInvoiceId,
      updatedAtTs: s.updatedAtTs,
    })),
  );
  const telegramStatus = useTelegramStore((s) => s.status);
  const [signingOut, setSigningOut] = useState(false);
  const sb = useMemo(() => supabaseBrowser(), []);

  const signedIn = auth.status === "signed_in" && Boolean(auth.user?.id);
  const email = auth.user?.email ?? null;

  const isFounder = profile.foundingAccess || profile.accessLevel === "founding";
  const isPremium = isFounder || profile.accessTier === "premium";

  // Access level label
  const accessLabel = isFounder
    ? pickLocale(locale, "Founding Access", "Founding Access")
    : profile.accessLevel === "invitation"
      ? pickLocale(locale, "Invitation Access", "Приглашение")
      : profile.accessLevel === "admin"
        ? pickLocale(locale, "Admin", "Админ")
        : profile.accessTier === "premium"
          ? pickLocale(locale, "Premium", "Премиум")
          : pickLocale(locale, "Free Access", "Бесплатный доступ");

  // Plan status line
  const planLine = isFounder
    ? pickLocale(locale, "Lifetime access · no expiry", "Пожизненный доступ · без срока")
    : profile.premiumUntil
      ? pickLocale(locale, `Active until ${formatDate(profile.premiumUntil)}`, `Активен до ${formatDate(profile.premiumUntil)}`)
      : isPremium
        ? pickLocale(locale, "Active", "Активен")
        : pickLocale(locale, "Free tier — execution map and invalidation locked", "Бесплатный доступ — карта исполнения закрыта");

  const handleSignOut = async () => {
    if (!sb) return;
    setSigningOut(true);
    try {
      await sb.auth.signOut();
      useAccessStore.getState().setProfile(guestProfile());
      useAccessStore.setState({ trialEndsAtTs: null, trialStarted: false });
      useSubscriptionStore.getState().setFree();
      useEntryStore.setState({ entryMode: "guest" });
    } finally {
      setSigningOut(false);
    }
  };

  return (
    <CognitionPanel
      id="account-dashboard"
      eyebrow={pickLocale(locale, "Account", "Аккаунт")}
      accent="warning"
      title={pickLocale(locale, "Profile & access", "Профиль и доступ")}
      className="col-span-full"
    >
      <div className="mt-2 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* Identity */}
        <div className="ms-account-cell">
          <div className="ms-account-cell__icon">
            <UserRound className="size-4" strokeWidth={1.4} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="ms-data-label text-ms-faint">{pickLocale(locale, "Account", "Аккаунт")}</p>
            {signedIn && email ? (
              <>
                <p className="mt-1 truncate font-mono text-[12px] text-ms-text">{maskEmail(email)}</p>
                <p className="mt-0.5 text-[11px] text-ms-faint">
                  {telegramStatus === "linked"
                    ? pickLocale(locale, "Email + Telegram linked", "Email + Telegram подключён")
                    : pickLocale(locale, "Email session", "Email сессия")}
                </p>
              </>
            ) : auth.user?.user_metadata?.telegram_id ? (
              <>
                <p className="mt-1 text-[12px] text-ms-text">
                  {auth.user.user_metadata.telegram_username
                    ? `@${String(auth.user.user_metadata.telegram_username)}`
                    : pickLocale(locale, "Telegram account", "Telegram аккаунт")}
                </p>
                <p className="mt-0.5 text-[11px] text-ms-faint">
                  {pickLocale(locale, "Telegram session", "Telegram сессия")}
                </p>
              </>
            ) : signedIn ? (
              <p className="mt-1 text-[12px] text-ms-muted">{pickLocale(locale, "Signed in", "Вошли в систему")}</p>
            ) : (
              <p className="mt-1 text-[12px] text-ms-muted">{pickLocale(locale, "Guest session", "Гостевой режим")}</p>
            )}
          </div>
        </div>

        {/* Plan */}
        <div className="ms-account-cell">
          <div className={cn("ms-account-cell__icon", isPremium && "text-ms-warning/80")}>
            <ShieldCheck className="size-4" strokeWidth={1.4} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="ms-data-label text-ms-faint">{pickLocale(locale, "Plan", "Тариф")}</p>
              <StatusPill accent={isPremium ? "warning" : "neutral"} className="text-[9px]">
                {accessLabel}
              </StatusPill>
            </div>
            <p className="mt-1 text-[12px] leading-snug text-ms-muted">{planLine}</p>
            {!isPremium && (
              <button
                type="button"
                onClick={openUpgrade}
                className="mt-2 text-[11px] font-medium text-ms-cognition/80 hover:text-ms-cognition transition-colors"
              >
                {pickLocale(locale, "Upgrade to Founding Access →", "Founding Access →")}
              </button>
            )}
          </div>
        </div>

        {/* Payment */}
        <div className="ms-account-cell">
          <div className="ms-account-cell__icon">
            <CreditCard className="size-4" strokeWidth={1.4} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="ms-data-label text-ms-faint">{pickLocale(locale, "Payment", "Оплата")}</p>
            {sub.provider ? (
              <>
                <p className="mt-1 text-[12px] text-ms-muted capitalize">{sub.provider}</p>
                {sub.lastInvoiceId ? (
                  <p className="mt-0.5 font-mono text-[10px] text-ms-faint/70">
                    {sub.lastInvoiceId.length > 20 ? `${sub.lastInvoiceId.slice(0, 20)}…` : sub.lastInvoiceId}
                  </p>
                ) : null}
                {sub.updatedAtTs ? (
                  <p className="mt-0.5 text-[11px] text-ms-faint">
                    {formatDate(sub.updatedAtTs)}
                  </p>
                ) : null}
              </>
            ) : (
              <p className="mt-1 text-[12px] text-ms-muted">
                {pickLocale(locale, "No payment on file", "Нет данных об оплате")}
              </p>
            )}
            <button
              type="button"
              onClick={openUpgrade}
              className="mt-2 text-[11px] text-ms-faint/70 hover:text-ms-muted transition-colors"
            >
              {isPremium
                ? pickLocale(locale, "Manage access →", "Управление доступом →")
                : pickLocale(locale, "Founding Access — $149 →", "Founding Access — $149 →")}
            </button>
          </div>
        </div>
      </div>

      {/* Sign out / account actions */}
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-ms-border/20 pt-4">
        <div className="flex items-center gap-2">
          <Mail className="size-3.5 text-ms-faint/60" strokeWidth={1.4} aria-hidden />
          <p className="text-[11px] text-ms-faint">
            {signedIn
              ? pickLocale(locale, "Session active on this device", "Сессия активна на этом устройстве")
              : pickLocale(locale, "Guest mode — sign in for sync", "Гостевой режим — войдите для синхронизации")}
          </p>
        </div>
        {signedIn ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-2 text-[11px] text-ms-muted"
            disabled={signingOut}
            onClick={() => void handleSignOut()}
          >
            <LogOut className="size-3.5" strokeWidth={1.5} />
            {signingOut
              ? pickLocale(locale, "Signing out…", "Выход…")
              : pickLocale(locale, "Sign out", "Выйти")}
          </Button>
        ) : null}
      </div>
    </CognitionPanel>
  );
}
