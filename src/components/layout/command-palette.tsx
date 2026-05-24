"use client";

import { AnimatePresence, m } from "framer-motion";
import {
  Activity,
  Archive,
  Binary,
  BookOpen,
  Crown,
  Globe2,
  History,
  LayoutGrid,
  Link2,
  Radar,
  Radio,
  ScanLine,
  ScrollText,
  Settings,
  Waypoints,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { msFadeScale, msTransition } from "@/lib/theme";
import { cn } from "@/lib/utils";
import { useCommandPaletteStore } from "@/store/command-palette-store";

type Cmd = Readonly<{
  id: string;
  label: string;
  hint: string;
  href: string;
  icon: typeof LayoutGrid;
}>;

const ITEMS: Cmd[] = [
  { id: "home", label: "Core", hint: "Operational command", href: "/", icon: LayoutGrid },
  { id: "execution", label: "Execution", hint: "Zones · ladder · posture", href: "/execution", icon: Crown },
  { id: "scenarios", label: "Scenarios", hint: "Path deck", href: "/scenarios", icon: Binary },
  { id: "ops", label: "Ops", hint: "Operational timeline", href: "/ops", icon: ScrollText },
  { id: "agents", label: "Agents", hint: "Consensus · debate · arbitration", href: "/agents", icon: Radio },
  { id: "macro", label: "Macro intelligence", hint: "Regime · catalysts · execution read", href: "/macro", icon: Globe2 },
  {
    id: "cross-asset",
    label: "Cross-asset intelligence",
    hint: "Intermarket transmission · liquidity migration",
    href: "/cross-asset",
    icon: Link2,
  },
  {
    id: "risk-radar",
    label: "Risk Radar",
    hint: "Hidden fragility · leverage · sponsorship decay",
    href: "/risk-radar",
    icon: Radar,
  },
  {
    id: "sentiment",
    label: "Sentiment intelligence",
    hint: "Narrative tension · fragility · cross-market",
    href: "/sentiment",
    icon: Waypoints,
  },
  { id: "maps", label: "Maps", hint: "Topology · liquidity · participation fields", href: "/maps", icon: ScanLine },
  { id: "labs", label: "Labs", hint: "Level 3 · analysis modules", href: "/labs", icon: Activity },
  { id: "replay", label: "Replay Studio", hint: "Structure · execution · conviction evolution", href: "/replay", icon: History },
  { id: "memory", label: "Strategy memory", hint: "Archetypes · analogs · audit archive", href: "/memory", icon: Archive },
  { id: "journal", label: "Journal", hint: "Notes", href: "/journal", icon: BookOpen },
  { id: "settings", label: "Settings", hint: "Prefs", href: "/settings", icon: Settings },
];

export function CommandPalette() {
  const open = useCommandPaletteStore((s) => s.open);
  const setOpen = useCommandPaletteStore((s) => s.setOpen);
  const titleId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const pathname = usePathname();
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();
    if (!qq) return ITEMS;
    return ITEMS.filter(
      (c) =>
        c.label.toLowerCase().includes(qq) ||
        c.hint.toLowerCase().includes(qq) ||
        c.href.toLowerCase().includes(qq),
    );
  }, [q]);

  useEffect(() => {
    setActive(0);
  }, [q, open]);

  useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(() => inputRef.current?.focus(), 30);
    return () => window.clearTimeout(t);
  }, [open]);

  useEffect(() => {
    if (!open) {
      setQ("");
    }
  }, [open]);

  const close = useCallback(() => setOpen(false), [setOpen]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const isK = e.key === "k" || e.key === "K" || e.key === "л" || e.key === "Л";
      const mod = e.metaKey || e.ctrlKey;
      if (mod && isK) {
        e.preventDefault();
        useCommandPaletteStore.getState().toggle();
        return;
      }
      if (!open) return;
      if (e.key === "Escape") {
        e.preventDefault();
        close();
        return;
      }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActive((i) => Math.min(filtered.length - 1, i + 1));
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setActive((i) => Math.max(0, i - 1));
        return;
      }
      if (e.key === "Enter" && filtered.length > 0) {
        e.preventDefault();
        const href = filtered[Math.min(active, filtered.length - 1)]!.href;
        window.location.href = href;
        close();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active, close, filtered, open]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open ? (
        <m.div
          className="fixed inset-0 z-[130] flex items-start justify-center p-4 pt-[12vh] sm:pt-[15vh]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={msTransition.fast}
          role="presentation"
        >
          <button
            type="button"
            className="absolute inset-0 bg-ms-overlay backdrop-blur-md"
            aria-label="Close command palette"
            onClick={close}
          />
          <m.div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            initial={msFadeScale.initial}
            animate={msFadeScale.animate}
            exit={msFadeScale.exit}
            transition={msTransition.medium}
            className={cn(
              "relative z-[1] w-full max-w-lg overflow-hidden rounded-ms-2xl border border-ms-border-strong",
              "bg-ms-surface shadow-ms-float",
            )}
          >
            <div className="border-b border-ms-border px-4 py-3 sm:px-5">
              <p id={titleId} className="ms-eyebrow text-ms-muted">
                Go to
              </p>
              <input
                ref={inputRef}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Filter…"
                className={cn(
                  "mt-2 w-full rounded-ms-lg border border-ms-border bg-ms-elevated/30 px-3 py-2",
                  "text-[13px] text-ms-text placeholder:text-ms-faint",
                  "outline-none focus:border-ms-border-mid",
                )}
                autoComplete="off"
                spellCheck={false}
              />
              <p className="mt-2 text-[11px] leading-snug text-ms-faint">
                Ctrl+K · Enter opens · Esc closes
              </p>
            </div>
            <ul className="max-h-[min(50vh,22rem)] overflow-y-auto overscroll-contain p-2" role="listbox">
              {filtered.length === 0 ? (
                <li className="px-3 py-8 text-center text-[13px] text-ms-muted">No matches.</li>
              ) : (
                filtered.map((c, idx) => {
                  const Icon = c.icon;
                  const sel = idx === active;
                  const external = !c.href.startsWith("/#");
                  const isRouteActive =
                    (c.href === "/" && pathname === "/") ||
                    (c.href.startsWith("/") && !c.href.includes("#") && pathname === c.href);
                  return (
                    <li key={c.id} role="presentation">
                      <Link
                        href={c.href}
                        scroll={!external && c.href !== "/"}
                        onClick={() => close()}
                        onMouseEnter={() => setActive(idx)}
                        className={cn(
                          "ms-focus-ring flex w-full items-center gap-3 rounded-ms-lg px-3 py-2.5 text-left transition-colors",
                          sel ? "bg-ms-cognition-dim/30 text-ms-text" : "hover:bg-ms-elevated/40 text-ms-muted",
                        )}
                      >
                        <Icon className="size-4 shrink-0 text-ms-cognition/90" strokeWidth={1.5} aria-hidden />
                        <span className="min-w-0 flex-1">
                          <span className="block text-[13px] font-medium tracking-tight text-ms-text">{c.label}</span>
                          <span className="mt-0.5 block text-[11px] leading-snug text-ms-faint">{c.hint}</span>
                        </span>
                        {isRouteActive ? (
                          <span className="ms-log-meta shrink-0 text-ms-cognition/80">here</span>
                        ) : null}
                      </Link>
                    </li>
                  );
                })
              )}
            </ul>
          </m.div>
        </m.div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}
