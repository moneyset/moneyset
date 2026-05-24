import Link from "next/link";

import { cn } from "@/lib/utils";

type BrandLogoProps = {
  className?: string;
  href?: string;
  size?: "sm" | "md" | "lg";
};

const sizes = {
  sm: "text-[10px] tracking-[0.06em] sm:text-[11px] sm:tracking-[0.07em]",
  md: "text-[11px] tracking-[0.07em] sm:text-xs sm:tracking-[0.08em]",
  lg: "text-xs tracking-[0.09em] sm:text-sm sm:tracking-[0.1em]",
};

/** MONEYSET wordmark — compact tracking, sans. */
export function BrandLogo({ className, href = "/", size = "md" }: BrandLogoProps) {
  const inner = (
    <span
      className={cn(
        "inline-block font-semibold text-ms-muted transition-colors hover:text-ms-text",
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
