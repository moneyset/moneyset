"use client";

import { useEffect, useMemo, useState } from "react";
import { Menu, Settings, UserRound } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useShallow } from "zustand/react/shallow";

import { BrandLogo } from "@/components/ui/brand-logo";
import { useShellStore } from "@/store/shell-store";
import { cn } from "@/lib/utils";
import { useAuthModalStore } from "@/store/auth-modal-store";
import { useUpgradeModalStore } from "@/store/upgrade-modal-store";
import { useAuthStore } from "@/store/auth-store";
import { useMarketStore } from "@/store/market-store";
import { useUiPrefsStore } from "@/store/ui-prefs-store";
import { feedLatencyLabel, marketFeedStatusLabel, tapeAwaitingLine } from "@/lib/i18n/trust-surface";
import { phaseLabel, pickLocale } from "@/lib/i18n/cognition-dict";
import { workspaceTitleFromPath } from "@/lib/workspace/workspace-route-meta";
import { executionSessionDeskStrip } from "@/lib/cognition/session-visual";
import { useCognitionSimulationStore } from "@/store/cognition-simulation-store";

function instrumentLabel(symbol: string): string {
  const s = symbol.trim().toUpperCase();
  return s.replace(/USDT$/i, "").replace(/PERP$/i, "").replace(/USD$/i, "") || s;
}

function LiveStateDot({ connection }: { connection: "live" | "connecting" | "stale" | "disconnected" }) {
  const tone =
    connection === "live"
      ? "bg-ms-flow/50"
      : connection === "connecting"
        ? "bg-ms-faint/45"
        : connection === "stale"
          ? "bg-ms-warning/45"
          : "bg-ms-border-mid";
  return <span className={cn("size-1.5 shrink-0 rounded-full", tone)} aria-hidden />;
}

function volToneShort(locale: ReturnType<typeof useUiPrefsStore.getState>["uiLocale"], tone: "compressing" | "neutral" | "expanding"): string {
  if (tone === "expanding") return pickLocale(locale, "Vol expanding", "Вол расширяется");
  if (tone === "compressing") return pickLocale(locale, "Vol compressing", "Вол сжимается");
  return pickLocale(locale, "Vol steady", "Вол ровно");
}

export function IntelligenceBar() {
  const pathname = usePathname();
  const toggleMobileNav = useShellStore((s) => s.toggleMobileNav);
  const locale = useUiPrefsStore((s) => s.uiLocale);
  const openAuth = useAuthModalStore((s) => s.openAuth);
  const openUpgrade = useUpgradeModalStore((s) => s.openUpgrade);
  useAuthStore((s) => s.status);

  const market = useMarketStore(
    useShallow((s) => ({
      symbol: s.symbol,
      price: s.price,
      connection: s.connection,
      lastWsTs: s.lastWsTs,
    })),
  );

  const { derived, latent } = useCognitionSimulationStore(
    useShallow((s) => ({
      derived: s.derived,
      latent: s.latent,
    })),
  );

  const workspaceTitle = workspaceTitleFromPath(pathname, locale);
  const prefsLabel = pickLocale(locale, "Preferences", "Настройки");

  const [feedLatencySec, setFeedLatencySec] = useState<number | null>(null);
  useEffect(() => {
    if (market.connection !== "live" || !market.lastWsTs) {
      setFeedLatencySec(null);
      return;
    }
    const tick = () => {
      setFeedLatencySec(Math.max(0, Math.floor((Date.now() - market.lastWsTs!) / 1000)));
    };
    tick();
    const id = window.setInterval(tick, 3000);
    return () => window.clearInterval(id);
  }, [market.connection, market.lastWsTs]);

  const latency =
    market.connection === "live" && feedLatencySec !== null && market.lastWsTs
      ? feedLatencyLabel(locale, feedLatencySec)
      : "";

  const inst = instrumentLabel(market.symbol);

  const liveStateLine = useMemo(() => {
    const session = executionSessionDeskStrip(locale);
    const phase = phaseLabel(locale, derived.phase);
    const vol = volToneShort(locale, derived.volTone);
    const macro =
      latent.macroLiquidityBackdrop >= 68
        ? pickLocale(locale, "macro sensitivity ↑", "макро ↑")
        : null;
    return [session, phase, vol, macro].filter(Boolean).join(" · ");
  }, [locale, derived.phase, derived.volTone, latent.macroLiquidityBackdrop]);

  const feedStatus = marketFeedStatusLabel(locale, market.connection);
  const linkOk = market.connection === "live";

  return (
    <header
      className={cn(
        "ms-intel-command relative z-20 shrink-0 border-b border-ms-border/30 bg-ms-elevated/92 backdrop-blur-sm md:flex md:min-h-[var(--ms-intel-bar-height)] md:backdrop-blur-md",
      )}
    >
      {/* Mobile / tablet compact bar — CSS grid avoids title vs controls overlap */}
      <div className="grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-2 gap-y-1 py-2.5 md:hidden">
        <div className="flex min-w-0 items-center gap-2">
          <button
            type="button"
            className="ms-focus-ring flex size-9 min-h-9 min-w-9 shrink-0 touch-manipulation items-center justify-center rounded-ms-md border border-ms-border/70 bg-ms-surface/45 text-ms-text transition-colors hover:border-ms-border-mid"
            onClick={toggleMobileNav}
            aria-label={pickLocale(locale, "Open navigation", "Открыть навигацию")}
          >
            <Menu className="size-4" strokeWidth={1.65} />
          </button>
          <BrandLogo size="md" />
        </div>

        <p className="min-w-0 truncate text-center text-[10px] leading-snug text-ms-muted tabular-nums" title={liveStateLine}>
          {liveStateLine}
        </p>

        <div className={cn("ms-intel-command-right-cluster flex shrink-0 items-center justify-end gap-1.5")}>
          {market.price ? (
            <span className="max-w-[5.5rem] truncate font-mono text-[11.5px] font-medium tabular-nums tracking-[-0.01em] text-ms-text/90 sm:max-w-[6.25rem]">
              {market.price.toFixed(0)}
            </span>
          ) : null}
          <Link
            href="/settings"
            title={prefsLabel}
            aria-label={prefsLabel}
            className="ms-focus-ring inline-flex size-9 min-h-10 min-w-10 shrink-0 touch-manipulation items-center justify-center rounded-ms-md border border-ms-border/55 bg-ms-surface/30 text-ms-muted transition-colors hover:border-ms-border-mid hover:text-ms-text"
          >
            <Settings className="size-3.5" strokeWidth={1.5} />
          </Link>

          <button
            type="button"
            onClick={openUpgrade}
            className="ms-focus-ring inline-flex shrink-0 touch-manipulation items-center rounded-ms-md border border-ms-cognition/35 bg-ms-cognition/10 px-1.5 py-1 text-[10px] font-semibold tracking-wide text-ms-cognition transition-colors hover:border-ms-cognition/50 hover:bg-ms-cognition/15 min-[380px]:px-2.5 sm:py-1.5"
          >
            {pickLocale(locale, "Founding", "Founding")}
          </button>

          <button
            type="button"
            className="ms-focus-ring flex size-9 min-h-10 min-w-10 shrink-0 touch-manipulation items-center justify-center rounded-ms-md border border-ms-border/55 bg-ms-surface/35 text-ms-muted transition-colors hover:border-ms-border-mid hover:text-ms-text"
            aria-label={pickLocale(locale, "Account", "Аккаунт")}
            onClick={openAuth}
          >
            <UserRound className="size-4" strokeWidth={1.5} />
          </button>
        </div>

        <div className="col-span-3 min-w-0 border-t border-ms-border/20 pt-1.5">
          <p className="truncate text-[12.5px] font-medium leading-tight tracking-[-0.01em] text-ms-text/88">{workspaceTitle}</p>
        </div>
      </div>

      {/* Desktop row */}
      <div className="hidden min-h-[var(--ms-intel-bar-height)] gap-5 px-6 py-0 md:flex md:items-center">
        <div className="flex min-w-0 flex-1 items-center gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <BrandLogo size="md" />
            <span className="h-3.5 w-px shrink-0 bg-ms-border/40" aria-hidden />
            <div className="min-w-0">
              <p className="truncate text-[13px] font-medium leading-tight tracking-[-0.01em] text-ms-text/90">{workspaceTitle}</p>
            </div>
          </div>
        </div>

        <div className="hidden min-w-0 max-w-[min(42vw,32rem)] flex-1 md:flex lg:max-w-[min(42vw,32rem)] xl:justify-center">
          <div
            className="flex w-full min-w-0 items-center gap-2 rounded-ms-md border border-ms-border/18 bg-ms-surface/20 px-3 py-1.5"
            title={liveStateLine}
          >
            <LiveStateDot connection={market.connection} />
            <p className="min-w-0 flex-1 truncate text-[10.5px] leading-snug text-ms-muted">
              <span className={cn("font-semibold tracking-[0.01em]", linkOk ? "text-ms-text/85" : "text-ms-muted")}>{feedStatus}</span>
              <span className="mx-1.5 text-ms-border/40">·</span>
              <span className="text-ms-text/75">{liveStateLine}</span>
            </p>
          </div>
        </div>

        <div className={cn("ms-intel-command-right-cluster flex shrink-0 items-center gap-2.5 md:justify-end")}>
          {market.price ? (
            <div className="flex items-center gap-1.5">
              <span className="font-mono text-[10px] text-ms-faint/70 tracking-[0.04em]">{inst}</span>
              <span className="font-mono text-[13px] font-medium tabular-nums tracking-[-0.01em] text-ms-text/92">
                {market.price.toFixed(0)}
              </span>
            </div>
          ) : (
            <span className="hidden max-w-[14rem] truncate text-[10.5px] text-ms-faint xl:inline">{tapeAwaitingLine(locale)}</span>
          )}
          {latency ? <span className="hidden tabular-nums text-[9.5px] tracking-[0.02em] text-ms-faint/60 lg:inline">{latency}</span> : null}

          <Link
            href="/settings"
            title={prefsLabel}
            aria-label={prefsLabel}
            className="ms-focus-ring inline-flex size-8 shrink-0 items-center justify-center rounded-ms-md border border-ms-border/40 bg-ms-surface/25 text-ms-faint transition-colors hover:border-ms-border/60 hover:text-ms-muted"
          >
            <Settings className="size-3.5" strokeWidth={1.4} />
          </Link>

          <button
            type="button"
            onClick={openUpgrade}
            className="ms-focus-ring inline-flex shrink-0 touch-manipulation items-center rounded-ms-md border border-ms-cognition/28 bg-ms-cognition/8 px-3 py-1.5 text-[9.5px] font-semibold tracking-[0.08em] text-ms-cognition/85 transition-colors hover:border-ms-cognition/44 hover:bg-ms-cognition/12 hover:text-ms-cognition"
          >
            {pickLocale(locale, "Founding Access", "Founding Access")}
          </button>

          <button
            type="button"
            className="ms-focus-ring flex size-8 shrink-0 touch-manipulation items-center justify-center rounded-ms-md border border-ms-border/40 bg-ms-surface/25 text-ms-faint transition-colors hover:border-ms-border/60 hover:text-ms-muted"
            aria-label={pickLocale(locale, "Account", "Аккаунт")}
            onClick={openAuth}
          >
            <UserRound className="size-3.5" strokeWidth={1.4} />
          </button>
        </div>
      </div>
    </header>
  );
}
