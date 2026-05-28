"use client";

import { useMemo, useState } from "react";
import { LogOut, UserRound, CreditCard, ShieldCheck, Mail, ExternalLink } from "lucide-react";

import { CognitionPanel } from "@/components/ui/panel";
import { Button } from "@/components/ui/button";
import { StatusPill } from "@/components/ui/status-pill";
import { supabaseBrowser } from "@/lib/supabase/browser";
import {
  accessPlanDetail,
  accessPlanLabel,
  formatAccountDate,
  maskAccountEmail,
  providerLabel,
  subscriptionStatusLabel,
} from "@/lib/account/account-display";
import { hasFounderAccess } from "@/lib/access/founder";
import { hasFullPlatformAccess } from "@/lib/access/capabilities";
import { clearClientSession } from "@/lib/auth/sign-out";
import { pickLocale } from "@/lib/i18n/cognition-dict";
import { useAccessStore } from "@/store/access-store";
import { useAuthStore } from "@/store/auth-store";
import { useSubscriptionStore } from "@/store/subscription-store";
import { useUiPrefsStore } from "@/store/ui-prefs-store";
import { useTelegramStore } from "@/store/telegram-store";
import { useUpgradeModalStore } from "@/store/upgrade-modal-store";
import { useProfileCenterStore } from "@/store/profile-center-store";
import { useShallow } from "zustand/react/shallow";
import { cn } from "@/lib/utils";

export function AccountDashboardCard() {
  const locale = useUiPrefsStore((s) => s.uiLocale);
  const profile = useAccessStore((s) => s.profile);
  const serverConfirmed = useAccessStore((s) => s.serverConfirmed);
  const openUpgrade = useUpgradeModalStore((s) => s.openUpgrade);
  const openProfileCenter = useProfileCenterStore((s) => s.openProfileCenter);
  const auth = useAuthStore(useShallow((s) => ({ status: s.status, user: s.user })));
  const sub = useSubscriptionStore(
    useShallow((s) => ({
      provider: s.provider,
      updatedAtTs: s.updatedAtTs,
    })),
  );
  const telegramStatus = useTelegramStore((s) => s.status);
  const [signingOut, setSigningOut] = useState(false);
  const sb = useMemo(() => supabaseBrowser(), []);

  const signedIn = auth.status === "signed_in" && Boolean(auth.user?.id);
  const email = auth.user?.email ?? null;

  const isFounder = serverConfirmed && hasFounderAccess(profile);
  const isPremium = serverConfirmed && hasFullPlatformAccess(profile);
  const accessLabel = accessPlanLabel(locale, profile);
  const planLine = accessPlanDetail(locale, profile);

  const handleSignOut = async () => {
    if (!sb) return;
    setSigningOut(true);
    try {
      await sb.auth.signOut();
      clearClientSession();
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
            <p className="ms-data-label text-ms-faint">{pickLocale(locale, "Profile", "Профиль")}</p>
            {signedIn && email ? (
              <>
                <p className="mt-1 truncate text-[12px] text-ms-text">{maskAccountEmail(email)}</p>
                <p className="mt-0.5 text-[11px] text-ms-faint">
                  {telegramStatus === "linked"
                    ? pickLocale(locale, "Email + Telegram linked", "Email + Telegram подключён")
                    : pickLocale(locale, "Email session", "Email сессия")}
                </p>
              </>
            ) : auth.user?.user_metadata?.telegram_username ? (
              <>
                <p className="mt-1 text-[12px] text-ms-text">
                  @{String(auth.user.user_metadata.telegram_username)}
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
              <p className="ms-data-label text-ms-faint">{pickLocale(locale, "Access", "Доступ")}</p>
              <StatusPill accent={isPremium ? "warning" : "neutral"} className="text-[9px]">
                {accessLabel}
              </StatusPill>
            </div>
            <p className="mt-1 text-[12px] leading-snug text-ms-muted">{planLine}</p>
            {serverConfirmed ? (
              <p className="mt-1 text-[10px] text-ms-faint">
                {pickLocale(locale, "Status", "Статус")}: {subscriptionStatusLabel(locale, profile.subscriptionStatus)}
              </p>
            ) : null}
            {!isPremium ? (
              <button
                type="button"
                onClick={openUpgrade}
                className="mt-2 text-[11px] font-medium text-ms-cognition/80 hover:text-ms-cognition transition-colors"
              >
                {pickLocale(locale, "Upgrade to Founding Access →", "Founding Access →")}
              </button>
            ) : isFounder ? (
              <button
                type="button"
                onClick={() => openProfileCenter("founder")}
                className="mt-2 text-[11px] font-medium text-ms-warning/80 hover:text-ms-warning transition-colors"
              >
                {pickLocale(locale, "View founder status →", "Статус Founder →")}
              </button>
            ) : null}
          </div>
        </div>

        {/* Billing summary */}
        <div className="ms-account-cell">
          <div className="ms-account-cell__icon">
            <CreditCard className="size-4" strokeWidth={1.4} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="ms-data-label text-ms-faint">{pickLocale(locale, "Billing", "Оплата")}</p>
            {sub.provider ? (
              <>
                <p className="mt-1 text-[12px] text-ms-muted">{providerLabel(sub.provider)}</p>
                {sub.updatedAtTs ? (
                  <p className="mt-0.5 text-[11px] text-ms-faint">
                    {pickLocale(locale, "Last activity", "Последняя активность")}: {formatAccountDate(sub.updatedAtTs)}
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
              onClick={() => openProfileCenter("billing")}
              className="mt-2 inline-flex items-center gap-1 text-[11px] text-ms-cognition/80 hover:text-ms-cognition transition-colors"
            >
              {pickLocale(locale, "View payment history →", "История оплат →")}
              <ExternalLink className="size-3" strokeWidth={1.5} />
            </button>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-ms-border/20 pt-4">
        <div className="flex items-center gap-2">
          <Mail className="size-3.5 text-ms-faint/60" strokeWidth={1.4} aria-hidden />
          <p className="text-[11px] text-ms-faint">
            {signedIn
              ? pickLocale(locale, "Session active on this device", "Сессия активна на этом устройстве")
              : pickLocale(locale, "Guest mode — sign in for sync", "Гостевой режим — войдите для синхронизации")}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {signedIn ? (
            <>
              <Button
                type="button"
                variant="cognition"
                size="sm"
                className="gap-2 text-[11px]"
                onClick={() => openProfileCenter("overview")}
              >
                {pickLocale(locale, "Account center", "Центр аккаунта")}
              </Button>
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
            </>
          ) : null}
        </div>
      </div>
    </CognitionPanel>
  );
}
