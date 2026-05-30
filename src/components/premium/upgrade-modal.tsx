"use client";

import { Lock } from "lucide-react";

import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { StatusPill } from "@/components/ui/status-pill";
import { accessTierLabel } from "@/lib/access/capabilities";
import { guestProfile } from "@/lib/access/roles";
import { useAccessStore } from "@/store/access-store";
import { useT } from "@/lib/i18n/use-t";
import { useCheckoutModalStore } from "@/store/checkout-modal-store";
import { useSubscriptionStore } from "@/store/subscription-store";
import { useShallow } from "zustand/react/shallow";
import { useUiPrefsStore } from "@/store/ui-prefs-store";
import { useFullPlatformAccess } from "@/hooks/use-capabilities";
import { pickLocale } from "@/lib/i18n/cognition-dict";
import { trialAccessEndsLine } from "@/lib/i18n/trust-surface";
import { MemberSupportPanel } from "@/components/support/member-support-panel";

type UpgradeModalProps = {
  open: boolean;
  onClose: () => void;
};

export function UpgradeModal({ open, onClose }: UpgradeModalProps) {
  const t = useT();
  const locale = useUiPrefsStore((s) => s.uiLocale);
  const profile = useAccessStore((s) => s.profile);
  const trialEndsAtTs = useAccessStore((s) => s.trialEndsAtTs);
  const trialStarted = useAccessStore((s) => s.trialStarted);
  const beginCognitionTrial = useAccessStore((s) => s.beginCognitionTrial);
  const setProfile = useAccessStore((s) => s.setProfile);
  const openCheckout = useCheckoutModalStore((s) => s.openCheckout);
  const fullAccess = useFullPlatformAccess();
  const tierKind = accessTierLabel(profile);
  const sub = useSubscriptionStore(
    useShallow((s) => ({
      setTierActive: s.setTierActive,
      setFree: s.setFree,
    })),
  );

  const trialLive = trialEndsAtTs != null && trialEndsAtTs > Date.now();
  const canStartTrial = tierKind === "free" && !trialStarted && !fullAccess;
  const showDevControls = process.env.NODE_ENV === "development";

  return (
    <Modal
      open={open}
      onClose={onClose}
      variant="premium"
      title={t("upgrade.title")}
      description={t("upgrade.subtitle")}
      footer={
        <>
          <Button
            type="button"
            variant="cognition"
            className="ms-upgrade-modal__cta-primary w-full"
            onClick={() => {
              openCheckout("founding_access");
              onClose();
            }}
          >
            {pickLocale(locale, "Founding Access — $149", "Founding Access — $149")}
          </Button>
          <Button type="button" variant="ghost" className="w-full text-ms-faint" onClick={onClose}>
            {t("upgrade.close")}
          </Button>
          <MemberSupportPanel variant="compact" />
        </>
      }
    >
      <div className="ms-upgrade-modal ms-upgrade-modal--premium">
        {trialLive && trialEndsAtTs ? (
          <p className="rounded-ms-lg border border-ms-border/60 bg-ms-elevated/20 px-3 py-2 font-mono text-[11px] leading-snug text-ms-muted">
            {trialAccessEndsLine(locale, trialEndsAtTs)}
          </p>
        ) : null}

        <div className="ms-upgrade-modal__hero">
          <div className="relative z-[1]">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <p className="ms-data-label text-ms-warning/85">{t("upgrade.foundingColumnTitle")}</p>
              <StatusPill accent={fullAccess ? "warning" : "neutral"}>
                {fullAccess ? t("upgrade.foundingActive") : t("upgrade.foundingInactive")}
              </StatusPill>
            </div>
            <p className="mt-2 text-[13px] leading-relaxed text-ms-text/85">{t("upgrade.foundingLead")}</p>
            <p className="ms-upgrade-modal__price">$149</p>
            <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.16em] text-ms-faint">
              {pickLocale(locale, "Lifetime · one payment", "Пожизненно · один платёж")}
            </p>

            <div className="ms-upgrade-modal__outcome-grid">
            {[
              {
                q: pickLocale(locale, "What do I gain?", "Что я получаю?"),
                a: pickLocale(locale, "Action clarity under live structure", "Ясность действий при живой структуре"),
              },
              {
                q: pickLocale(locale, "What becomes easier?", "Что упрощается?"),
                a: pickLocale(locale, "Reading risk, not reacting to price", "Читать риск, не реагировать на цену"),
              },
              {
                q: pickLocale(locale, "What uncertainty is reduced?", "Какая неопределённость снимается?"),
                a: pickLocale(locale, "When to act, when to wait, when the thesis breaks", "Когда действовать, когда ждать, когда тезис ломается"),
              },
            ].map((item) => (
              <div key={item.q} className="ms-upgrade-modal__outcome-card">
                <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-ms-faint">{item.q}</p>
                <p className="mt-1 text-[11px] leading-snug text-ms-muted">{item.a}</p>
              </div>
            ))}
            </div>

          <ul className="mt-3 space-y-1.5 pl-3 text-[11px] leading-snug text-ms-muted sm:text-[12px]">
            {[
              t("upgrade.foundingBullet1"),
              t("upgrade.foundingBullet2"),
              t("upgrade.foundingBullet3"),
              t("upgrade.foundingBullet4"),
              t("upgrade.foundingBullet5"),
            ].map((bullet) => (
              <li key={bullet} className="flex items-start gap-2">
                <span className="mt-1.5 size-1 shrink-0 rounded-full bg-ms-warning/60" aria-hidden />
                {bullet}
              </li>
            ))}
          </ul>
          </div>
        </div>

        <div className="ms-upgrade-modal__free-tier">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex items-center gap-2">
              <Lock className="size-4 text-ms-muted" strokeWidth={1.5} aria-hidden />
              <p className="ms-data-label text-ms-faint">{t("upgrade.freeColumnTitle")}</p>
            </div>
            <StatusPill accent="neutral">{t("tier.free")}</StatusPill>
          </div>
          <ul className="mt-3 space-y-1.5 text-[11px] leading-snug text-ms-muted sm:text-[12px]">
            <li>{t("upgrade.freeBullet1")}</li>
            <li>{t("upgrade.freeBullet2")}</li>
            <li className="text-ms-faint/70">{t("upgrade.freeBullet3")}</li>
          </ul>
        </div>

        {canStartTrial && showDevControls ? (
          <div className="rounded-ms-lg border border-ms-border/40 bg-ms-elevated/10 p-3">
            <p className="text-[11px] leading-snug text-ms-faint">{t("upgrade.trialHint")}</p>
            <Button
              type="button"
              variant="outline"
              className="mt-2 w-full"
              onClick={() => {
                beginCognitionTrial();
              }}
            >
              {t("upgrade.trialCta")}
            </Button>
          </div>
        ) : null}

        {showDevControls ? (
          <div className="flex flex-col gap-2 border-t border-ms-border/40 pt-3 sm:flex-row">
            <Button
              type="button"
              variant="outline"
              className="flex-1 text-[11px]"
              onClick={() => {
                setProfile({
                  role: "premium",
                  accessTier: "premium",
                  accessLevel: "premium",
                  subscriptionStatus: "active",
                  foundingAccess: false,
                  premiumUntil: null,
                  invitationUntil: null,
                });
                sub.setTierActive("premium", { provider: "nowpayments", periodDays: 30 });
                onClose();
              }}
            >
              {t("upgrade.enableDemo")}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="flex-1 text-[11px]"
              onClick={() => {
                setProfile(guestProfile());
                sub.setFree();
                onClose();
              }}
            >
              {t("upgrade.resetFree")}
            </Button>
          </div>
        ) : null}
      </div>
    </Modal>
  );
}
