"use client";

import type { ReactNode } from "react";

import { pickLocale } from "@/lib/i18n/cognition-dict";
import { cn } from "@/lib/utils";
import { useUiPrefsStore } from "@/store/ui-prefs-store";

export type CognitionDensityPanelProps = {
  instant?: ReactNode;
  tactical?: ReactNode;
  deepLabel?: string;
  deep?: ReactNode;
  telemetry?: ReactNode;
  className?: string;
};

export function CognitionDensityPanel({
  instant,
  tactical,
  deepLabel,
  deep,
  telemetry,
  className,
}: CognitionDensityPanelProps) {
  const locale = useUiPrefsStore((s) => s.uiLocale);
  const deepTitle = deepLabel ?? pickLocale(locale, "Interpretation", "Интерпретация");
  const teleTitle = pickLocale(locale, "Telemetry", "Телеметрия");

  return (
    <div className={cn("ms-cognition-density", className)}>
      {instant ? <div className="ms-cognition-density__instant">{instant}</div> : null}
      {tactical ? <div className="ms-cognition-density__tactical">{tactical}</div> : null}
      {deep ? (
        <details className="ms-cognition-density__deep group">
          <summary className="ms-focus-ring ms-cognition-density__summary">{deepTitle}</summary>
          <div className="ms-cognition-density__deep-body">{deep}</div>
        </details>
      ) : null}
      {telemetry ? (
        <details className="ms-cognition-density__telemetry group">
          <summary className="ms-focus-ring ms-cognition-density__summary ms-cognition-density__summary--faint">
            {teleTitle}
          </summary>
          <div className="ms-cognition-density__telemetry-body">{telemetry}</div>
        </details>
      ) : null}
    </div>
  );
}
