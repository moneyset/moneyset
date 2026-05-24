import type { MsSemanticAccent } from "@/lib/theme";
import { cn } from "@/lib/utils";

const accentMap: Record<MsSemanticAccent, string> = {
  cognition: "border-transparent bg-ms-cognition-dim/50 text-ms-cognition",
  flow: "border-transparent bg-ms-flow-dim/50 text-ms-flow",
  sentiment: "border-transparent bg-ms-sentiment-dim/50 text-ms-sentiment",
  danger: "border-transparent bg-ms-danger-dim/45 text-ms-danger",
  warning: "border-transparent bg-ms-warning-dim/45 text-ms-warning",
  consensus: "border-transparent bg-ms-consensus-dim/50 text-ms-consensus",
  neutral: "border-transparent bg-ms-elevated/70 text-ms-muted",
};

type StatusPillProps = {
  children: React.ReactNode;
  accent?: MsSemanticAccent;
  className?: string;
};

export function StatusPill({ children, accent = "neutral", className }: StatusPillProps) {
  return (
    <span
      className={cn(
        "inline-flex max-w-full items-center rounded-ms-pill border px-2.5 py-0.5 text-[11px] font-medium leading-tight tracking-tight",
        accentMap[accent],
        className,
      )}
    >
      {children}
    </span>
  );
}
