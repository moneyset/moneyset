"use client";

import { cn } from "@/lib/utils";

type AnimatedSeparatorProps = {
  className?: string;
  variant?: "default" | "cognition" | "danger";
};

const variantClass: Record<NonNullable<AnimatedSeparatorProps["variant"]>, string> = {
  default: "bg-ms-border-mid/70",
  cognition: "bg-ms-border-mid/70",
  danger: "bg-ms-border-mid/70",
};

export function AnimatedSeparator({ className, variant = "default" }: AnimatedSeparatorProps) {
  return (
    <div className={cn("h-px w-full", variantClass[variant], className)} aria-hidden />
  );
}
