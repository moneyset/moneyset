import Link from "next/link";

import { cn } from "@/lib/utils";

type BrandLogoProps = {
  className?: string;
  href?: string;
  size?: "sm" | "md" | "lg";
};

const sizes = {
  sm: "text-[9px] tracking-[0.24em] pl-[0.24em] sm:text-[9.5px]",
  md: "text-[9.5px] tracking-[0.28em] pl-[0.28em] sm:text-[10px]",
  lg: "text-[10px] tracking-[0.3em] pl-[0.3em] sm:text-[11px] sm:tracking-[0.3em]",
};

/** MONEYSET wordmark — institutional tracking, all-caps presence. */
export function BrandLogo({ className, href = "/", size = "md" }: BrandLogoProps) {
  const inner = (
    <span
      className={cn(
        "inline-block font-medium uppercase text-ms-muted/80 transition-colors hover:text-ms-muted",
        sizes[size],
        "ms-brand-logo",
        className,
      )}
    >
      MONEYSET
    </span>
  );

  if (!href) return inner;

  return (
    <Link href={href} className="ms-focus-ring rounded-sm outline-offset-2">
      {inner}
    </Link>
  );
}
