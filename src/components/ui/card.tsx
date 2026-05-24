import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type CardProps = {
  children: ReactNode;
  className?: string;
  variant?: "raised" | "inset" | "ghost";
};

const variants: Record<NonNullable<CardProps["variant"]>, string> = {
  raised: "ms-surface-panel border-ms-border p-5 sm:p-6",
  inset: "ms-surface-inset p-4 sm:p-5",
  ghost: "rounded-ms-lg border border-transparent p-4 sm:p-5",
};

export function Card({ children, className, variant = "raised" }: CardProps) {
  return <div className={cn(variants[variant], className)}>{children}</div>;
}
