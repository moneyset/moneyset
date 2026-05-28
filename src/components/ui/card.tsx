import type { ReactNode } from "react";

import { IntelCard, type IntelCardVariant } from "@/components/ui/intel-card";

type CardProps = {
  children: ReactNode;
  className?: string;
  variant?: IntelCardVariant | "ghost";
};

/** @deprecated Prefer IntelCard — alias for backward compatibility. */
export function Card({ children, className, variant = "raised" }: CardProps) {
  return (
    <IntelCard variant={variant} className={className}>
      {children}
    </IntelCard>
  );
}
