"use client";

import { Lock } from "lucide-react";

import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { StatusPill } from "@/components/ui/status-pill";
import { accessTierLabel } from "@/lib/access/capabilities";
import { useAccessStore } from "@/store/access-store";
import { useT } from "@/lib/i18n/use-t";
import { useCheckoutModalStore } from "@/store/checkout-modal-store";
import { useSubscriptionStore } from "@/store/subscription-store";
import { useShallow } from "zustand/react/shallow";
import { useUiPrefsStore } from "@/store/ui-prefs-store";
import { useFullPlatformAccess } from "@/hooks/use-capabilities";
import { pickLocale } from "@/lib/i18n/cognition-dict";
import { trialAccessEndsLine } from "@/lib/i18n/trust-surface";

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
  const setTier = useAccessStore((s) => s.setTier);
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
    <Modal open={open} onClose={onClose} title={t("upgrade.title")} description={t("upgrade.subtitle")}>
      <div className="space-y-4">
        {trialLive && trialEndsAtTs ? (
          <p className="rounded-ms-lg border border-ms-border/60 bg-ms-elevated/20 px-3 py-2 font-mono text-[11px] leading-snug text-ms-muted">
            {trialAccessEndsLine(locale, trialEndsAtTs)}
          </p>
        ) : null}

        <div className="rounded-ms-xl border border-ms-border bg-ms-elevated/18 p-4">
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
            <li>{t("upgrade.freeBullet3")}</li>
          </ul>
        </div>

        <div className="rounded-ms-xl border border-ms-border-mid/80 bg-ms-surface/30 p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <p className="ms-data-label text-ms-warning/85">{t("upgrade.foundingColumnTitle")}</p>
            <StatusPill accent={fullAccess ? "warning" : "neutral"}>
              {fullAccess ? t("upgrade.foundingActive") : t("upgrade.foundingInactive")}
            </StatusPill>
          </div>
          <p className="mt-2 text-[12px] leading-relaxed text-ms-muted">{t("upgrade.foundingLead")}</p>
          <ul className="mt-3 space-y-1.5 text-[11px] leading-snug text-ms-muted sm:text-[12px]">
            <li>{t("upgrade.foundingBullet1")}</li>
            <li>{t("upgrade.foundingBullet2")}</li>
            <li>{t("upgrade.foundingBullet3")}</li>
            <li>{t("upgrade.foundingBullet4")}</li>
            <li>{t("upgrade.foundingBullet5")}</li>
          </ul>

          <div className="mt-4 flex flex-col gap-2">
            <Button
              type="button"
              variant="cognition"
              className="w-full"
              onClick={() => {
                openCheckout("founding_access");
                onClose();
              }}
            >
              {pickLocale(locale, "Founding · $79", "Founding · $79")}
            </Button>
            <Button type="button" variant="ghost" className="w-full" onClick={onClose}>
              {t("upgrade.close")}
            </Button>
          </div>

          {canStartTrial && showDevControls ? (
            <div className="mt-4 border-t border-ms-border/40 pt-4">
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
            <div className="mt-4 flex flex-col gap-2 border-t border-ms-border/40 pt-4 sm:flex-row">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setTier("premium");
                  sub.setTierActive("premium", { provider: "nowpayments", periodDays: 30 });
                  onClose();
                }}
              >
                {t("upgrade.enableDemo")}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setTier("free");
                  sub.setFree();
                  onClose();
                }}
              >
                {t("upgrade.resetFree")}
              </Button>
            </div>
          ) : null}
        </div>
      </div>
    </Modal>
  );
}
