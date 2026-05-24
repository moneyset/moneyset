"use client";

import Link from "next/link";

import { pickLocale } from "@/lib/i18n/cognition-dict";
import { cn } from "@/lib/utils";
import { useUiPrefsStore } from "@/store/ui-prefs-store";

export type CognitionNavLink = Readonly<{
  href: string;
  labelEn: string;
  labelRu: string;
}>;

/** Visual nav — links only, no explanatory footer copy. */
export function CognitionNavRail({ links, className }: { links: readonly CognitionNavLink[]; className?: string }) {
  const locale = useUiPrefsStore((s) => s.uiLocale);
  return (
    <nav className={cn("ms-cognition-nav-rail", className)} aria-label={pickLocale(locale, "Related surfaces", "Связанные поверхности")}>
      {links.map((l) => (
        <Link key={l.href} href={l.href} className="ms-cognition-nav-rail__link">
          {pickLocale(locale, l.labelEn, l.labelRu)}
        </Link>
      ))}
    </nav>
  );
}
