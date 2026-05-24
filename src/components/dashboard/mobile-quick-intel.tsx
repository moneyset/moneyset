"use client";

import { Binary, ShieldAlert } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";
import { useAttentionPlane } from "@/components/cognition/attention-priority-context";
import { attentionAnchorScrollHref } from "@/lib/cognition/coherence-copy";
import { useCognitionSimulationStore } from "@/store/cognition-simulation-store";
import {
  consensusLabel,
  dangerBandLabel,
  mainRiskDisplay,
  phaseLabel,
  pickLocale,
  scenarioTitle,
} from "@/lib/i18n/cognition-dict";
import { useUiPrefsStore } from "@/store/ui-prefs-store";
import { useT } from "@/lib/i18n/use-t";

type TileProps = {
  title: string;
  value: string;
  subtitle?: string;
  href: string;
  compact: boolean;
  emphasized?: boolean;
};

function Tile({ title, value, subtitle, href, compact, emphasized }: TileProps) {
  return (
    <Link
      href={href}
      className={cn(
        "ms-focus-ring group relative flex flex-col justify-center rounded-ms-lg border border-ms-border/60 bg-ms-surface/20",
        "touch-manipulation transition-[border-color,background-color] duration-150 ease-out",
        "hover:border-ms-border-mid hover:bg-ms-surface/30",
        emphasized && "border-ms-border-mid/70",
        compact ? "min-h-[4.25rem] px-3 py-2.5" : "min-h-[4.75rem] px-3.5 py-3",
      )}
    >
      <p className="ms-data-label min-w-0 text-pretty text-[10px] text-ms-faint">{title}</p>
      <p className="mt-1.5 text-pretty text-[12.5px] font-semibold leading-snug tracking-tight text-ms-text">{value}</p>
      {subtitle ? (
        <p className="mt-1 line-clamp-2 text-pretty text-[10px] leading-snug text-ms-muted">{subtitle}</p>
      ) : null}
    </Link>
  );
}

/** Mobile-only: compressed scan — path, risk, stress, alignment (no duplicate hero posture tile). */
export function MobileQuickIntel({ className }: { className?: string }) {
  const t = useT();
  const locale = useUiPrefsStore((s) => s.uiLocale);
  const compact = useUiPrefsStore((s) => s.cognitionMode === "compressed");
  const plane = useAttentionPlane();
  const leadHref = attentionAnchorScrollHref(plane.anchor);
  const pathname = usePathname();
  const derived = useCognitionSimulationStore((s) => s.derived);
  const topScenario = useCognitionSimulationStore((s) => s.topScenario);
  const mainRisk = useCognitionSimulationStore((s) => s.mainRisk);
  const mr = mainRiskDisplay(locale, mainRisk.riskKey, mainRisk.dangerScore);

  const dangerSub = pickLocale(locale, "Band", "Полоса");
  const consensusSub = derived.consensus.includes("divergence")
    ? pickLocale(locale, "Split wide", "Разнос широкий")
    : derived.consensus.includes("weakening")
      ? pickLocale(locale, "Alignment weak", "Сборка слабеет")
      : pickLocale(locale, "Alignment stable", "Сборка ровная");

  const tileShell = (emphasized: boolean) =>
    cn(
      "ms-focus-ring group flex flex-col justify-center rounded-ms-lg border border-ms-border/60 bg-ms-surface/20",
      "touch-manipulation transition-[border-color,background-color] duration-150 ease-out",
      "hover:border-ms-border-mid hover:bg-ms-surface/30",
      emphasized && "border-ms-border-mid/70",
      compact ? "min-h-[4.25rem] px-3 py-2.5" : "min-h-[4.75rem] px-3.5 py-3",
    );

  const routeOrAnchorActive = (href: string) => {
    if (href.startsWith("/#")) return leadHref === href;
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const navCls = (href: string) =>
    cn(
      "text-ms-muted transition-colors hover:text-ms-text",
      routeOrAnchorActive(href) && "text-ms-text/95 underline decoration-ms-border-mid/70 underline-offset-[5px]",
    );

  return (
    <section
      className={cn("md:hidden", className)}
      aria-label="Quick intelligence"
      lang={locale === "ru" ? "ru" : "en"}
    >
      <nav
        className={cn(
          "flex flex-wrap items-center gap-x-4 gap-y-1 border-b border-ms-border/25 pb-3 text-[11px] font-medium tracking-tight text-ms-faint",
        )}
        aria-label="Section anchors"
      >
        <span className="text-ms-muted/90">{phaseLabel(locale, derived.phase)}</span>
        <span className="text-ms-border-mid" aria-hidden>
          ·
        </span>
        <Link href="/#cognition-overview" className={navCls("/#cognition-overview")}>
          {pickLocale(locale, "State", "Срез")}
        </Link>
        <Link href="/#regime-layer" className={navCls("/#regime-layer")}>
          {pickLocale(locale, "Regime", "Режим")}
        </Link>
        <Link href="/#posture-layer" className={navCls("/#posture-layer")}>
          {pickLocale(locale, "Posture", "Позиция")}
        </Link>
        <Link href="/#cognition-core" className={navCls("/#cognition-core")}>
          {pickLocale(locale, "Risk", "Риск")}
        </Link>
        <Link href="/#scenario-layer" className={navCls("/#scenario-layer")}>
          {pickLocale(locale, "Paths", "Пути")}
        </Link>
        <Link href="/#execution-posture" className={navCls("/#execution-posture")}>
          {pickLocale(locale, "Execution", "Исполнение")}
        </Link>
        <Link href="/#operational-feed" className={navCls("/#operational-feed")}>
          {pickLocale(locale, "Transitions", "Переходы")}
        </Link>
        <Link href="/agents" className={navCls("/agents")}>
          {pickLocale(locale, "Lattice", "Сетка")}
        </Link>
        <Link href="/macro" className={navCls("/macro")}>
          {pickLocale(locale, "Macro", "Макро")}
        </Link>
        <Link href="/sentiment" className={navCls("/sentiment")}>
          {pickLocale(locale, "Sentiment", "Настр.")}
        </Link>
      </nav>

      <p className="ms-caption mt-3 text-[10px] text-ms-faint">{t("quick.title")}</p>

      <div className={cn("mt-2", compact ? "space-y-2" : "space-y-2.5")}>
        <div className={cn("grid grid-cols-2", compact ? "gap-2" : "gap-2.5")}>
          <Link href="/#scenario-layer" className={tileShell(leadHref === "/#scenario-layer")}>
            <p className="ms-data-label text-[10px] text-ms-faint">{t("quick.topScenario")}</p>
            <p className="mt-1.5 line-clamp-2 text-pretty text-[12.5px] font-semibold leading-snug text-ms-text">
              {scenarioTitle(locale, topScenario.scenarioId)}
            </p>
            <p className="mt-1 flex items-center justify-between gap-2 text-[10px] text-ms-muted">
              <span>{pickLocale(locale, "Primary path", "Базовый путь")}</span>
              <Binary className="size-3.5 shrink-0 text-ms-consensus/70" strokeWidth={1.5} aria-hidden />
            </p>
          </Link>
          <Link href="/#cognition-core" className={tileShell(leadHref === "/#cognition-core")}>
            <p className="ms-data-label text-[10px] text-ms-faint">{t("quick.mainRisk")}</p>
            <p className="mt-1.5 line-clamp-2 text-pretty text-[12.5px] font-semibold leading-snug text-ms-text">{mr.headline}</p>
            <p className="mt-1 line-clamp-2 text-pretty text-[10px] leading-snug text-ms-muted">{mr.summary}</p>
            <ShieldAlert className="mt-1.5 size-3.5 self-end text-ms-danger/65" strokeWidth={1.5} aria-hidden />
          </Link>
        </div>
        <div className={cn("grid grid-cols-2", compact ? "gap-2" : "gap-2.5")}>
          <Tile
            title={t("quick.danger")}
            value={dangerBandLabel(locale, derived.dangerBand)}
            subtitle={dangerSub}
            href="/#cognition-core"
            compact={compact}
            emphasized={leadHref === "/#cognition-core"}
          />
          <Tile
            title={t("quick.consensus")}
            value={consensusLabel(locale, derived.consensus)}
            subtitle={consensusSub}
            href="/#cognition-core"
            compact={compact}
            emphasized={leadHref === "/#cognition-core"}
          />
        </div>
      </div>
    </section>
  );
}
