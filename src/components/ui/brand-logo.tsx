import Link from "next/link";

import { cn } from "@/lib/utils";

type BrandLogoProps = {
  className?: string;
  href?: string;
  size?: "sm" | "md" | "lg";
};

const sizes = {
  sm: "text-[9px] tracking-[0.22em] pl-[0.22em] sm:text-[10px]",
  md: "text-[10px] tracking-[0.26em] pl-[0.26em] sm:text-[11px]",
  lg: "text-[11px] tracking-[0.28em] pl-[0.28em] sm:text-xs sm:tracking-[0.28em]",
};

/** MONEYSET wordmark — institutional tracking, all-caps presence. */
export function BrandLogo({ className, href = "/", size = "md" }: BrandLogoProps) {
  const inner = (
    <span
      className={cn(
        "inline-block font-semibold uppercase text-ms-muted transition-colors hover:text-ms-text",
        sizes[size],
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
