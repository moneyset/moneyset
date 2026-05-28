"use client";

import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export type IntelCardVariant = "raised" | "inset" | "signature" | "feed" | "ghost";
export type IntelCardTone = "neutral" | "stress" | "support";

type IntelCardProps = {
  children: ReactNode;
  className?: string;
  variant?: IntelCardVariant;
  tone?: IntelCardTone;
  as?: "div" | "article" | "section";
};

const variantClass: Record<IntelCardVariant, string> = {
  raised: "ms-intel-card ms-intel-card--raised",
  inset: "ms-intel-card ms-intel-card--inset",
  signature: "ms-intel-card ms-intel-card--signature",
  feed: "ms-intel-card ms-intel-card--feed",
  ghost: "ms-intel-card ms-intel-card--ghost",
};

const toneClass: Record<IntelCardTone, string> = {
  neutral: "",
  stress: "ms-intel-card--stress",
  support: "ms-intel-card--support",
};

/** Unified intelligence surface card — one OS feel across modules. */
export function IntelCard({
  children,
  className,
  variant = "raised",
  tone = "neutral",
  as: Tag = "div",
}: IntelCardProps) {
  return <Tag className={cn(variantClass[variant], toneClass[tone], className)}>{children}</Tag>;
}
