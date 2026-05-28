"use client";

import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export type IntelDetailTone = "neutral" | "stress" | "support";

export type IntelDetailRow = Readonly<{
  label: string;
  value: string;
  emphasis?: boolean;
}>;

type IntelDetailCardProps = {
  title: string;
  kindLabel?: string;
  body?: string;
  note?: string;
  rows?: readonly IntelDetailRow[];
  tone?: IntelDetailTone;
  onClose: () => void;
  closeLabel?: string;
  id?: string;
  ariaLabel?: string;
  className?: string;
  children?: ReactNode;
};

/**
 * Unified expandable detail card — maps, market index, journal overlays.
 * Renders below canvas/content, never floating over primary visuals.
 */
export function IntelDetailCard({
  title,
  kindLabel,
  body,
  note,
  rows,
  tone = "neutral",
  onClose,
  closeLabel = "Close",
  id,
  ariaLabel,
  className,
  children,
}: IntelDetailCardProps) {
  return (
    <article
      id={id}
      className={cn(
        "ms-intel-detail",
        tone === "stress" && "ms-intel-detail--stress",
        tone === "support" && "ms-intel-detail--support",
        className,
      )}
      role="region"
      aria-label={ariaLabel ?? title}
    >
      <div className="ms-intel-detail__header">
        <div className="min-w-0 flex-1">
          {kindLabel ? <p className="ms-intel-detail__kind">{kindLabel}</p> : null}
          <p className="ms-intel-detail__title">{title}</p>
        </div>
        <button type="button" className="ms-intel-detail__close ms-focus-ring" onClick={onClose} aria-label={closeLabel}>
          ×
        </button>
      </div>

      {body ? <p className="ms-intel-detail__body">{body}</p> : null}
      {note ? <p className="ms-intel-detail__note">{note}</p> : null}

      {rows && rows.length > 0 ? (
        <dl className="ms-intel-detail__grid">
          {rows.map((row) => (
            <div
              key={row.label}
              className={cn("ms-intel-detail__row", row.emphasis && "ms-intel-detail__row--emphasis")}
            >
              <dt>{row.label}</dt>
              <dd>{row.value}</dd>
            </div>
          ))}
        </dl>
      ) : null}

      {children}
    </article>
  );
}
