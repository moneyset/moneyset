"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import { useTelegramAuth } from "@/hooks/use-telegram-auth";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/auth-store";
import { useEntryStore } from "@/store/entry-store";
import { useAccessStore } from "@/store/access-store";
import { useExtendedCognitionAccess } from "@/hooks/use-extended-cognition-access";
import { useUiPrefsStore } from "@/store/ui-prefs-store";
import {
  authPageLead,
  authPageTierEvaluation,
  authPageTierFree,
  authPageTierPaid,
  authPageTitle,
  authPageWorkspaceCta,
  authSessionActionsCopy,
  entryOnboardingCopy,
} from "@/lib/i18n/trust-surface";

export function AuthPage() {
  const locale = useUiPrefsStore((s) => s.uiLocale);
  const entryCopy = entryOnboardingCopy(locale);
  const actions = authSessionActionsCopy(locale);
  const completeEntry = useEntryStore((s) => s.completeEntry);
  const setGuest = useAuthStore((s) => s.setGuest);
  const { signInWithTelegram, busy, error } = useTelegramAuth();
  const paidPremium = useAccessStore((s) => s.tier === "premium");
  const extended = useExtendedCognitionAccess();

  const continueGuest = () => {
    setGuest();
    completeEntry("guest");
  };

  return (
    <div className="relative flex min-h-0 flex-1 flex-col justify-center bg-ms-canvas px-5 py-12 sm:px-8 sm:py-16">
      <div className="mx-auto w-full max-w-md border border-ms-border/60 bg-ms-surface/40 px-5 py-8 sm:px-7 sm:py-9">
        <p className="ms-data-label text-ms-faint">MONEYSET</p>
        <h1 className="ms-headline mt-2 text-balance text-ms-text">{authPageTitle(locale)}</h1>
        <p className="mt-1 text-[12px] text-ms-muted">{entryCopy.subheadline}</p>
        <p className="mt-3 text-[12px] leading-relaxed text-ms-muted sm:text-[13px]">{authPageLead(locale)}</p>

        <div className="mt-8 flex flex-col gap-2 sm:flex-row sm:items-stretch">
          <Button
            type="button"
            variant="cognition"
            className="sm:flex-1"
            disabled={busy}
            onClick={() => void signInWithTelegram()}
          >
            {actions.telegramCta}
          </Button>
          <Button type="button" variant="outline" className="sm:flex-1" disabled={busy} onClick={continueGuest}>
            {actions.guestCta}
          </Button>
        </div>

        {error ? <p className="mt-3 text-[11px] text-ms-warning/90">{error}</p> : null}

        <Link
          href="/"
          className={cn(
            "ms-focus-ring mt-4 inline-flex w-full items-center justify-center rounded-ms-md border border-ms-border-mid/70 bg-ms-elevated/25 px-4 py-2.5",
            "text-center font-mono text-[10px] uppercase tracking-[0.16em] text-ms-text transition-[border-color,background-color] duration-200 hover:border-ms-border-strong hover:bg-ms-elevated/35",
          )}
        >
          {authPageWorkspaceCta(locale)}
        </Link>

        <p className="mt-8 border-t border-ms-border/40 pt-5 text-[11px] leading-relaxed text-ms-faint sm:text-[12px]">
          {paidPremium ? authPageTierPaid(locale) : extended ? authPageTierEvaluation(locale) : authPageTierFree(locale)}
        </p>
        <p className="mt-3 text-[10px] leading-relaxed text-ms-faint">{actions.foundingNote}</p>
      </div>
    </div>
  );
}
