"use client";

import { cn } from "@/lib/utils";

type ZoneTone = "stress" | "support" | "neutral";

type MapZoneDetailCardProps = {
  label: string;
  kindLabel?: string;
  read: string;
  /** Secondary read line — e.g. executionNote for maps cells */
  note?: string;
  tone?: ZoneTone;
  onClose: () => void;
};

/**
 * Unified zone detail card — shown below any map canvas when a cell is tapped.
 *
 * Design constraints:
 *   - NEVER overlays the canvas — rendered as a block AFTER the canvas
 *   - Single instance only (caller controls visibility via activeId)
 *   - Tap × or tap the same cell again to close
 *   - Readable one-handed on 375px screens
 */
export function MapZoneDetailCard({
  label,
  kindLabel,
  read,
  note,
  tone = "neutral",
  onClose,
}: MapZoneDetailCardProps) {
  return (
    <div
      className={cn(
        "ms-map-zone-card",
        tone === "stress"  && "ms-map-zone-card--stress",
        tone === "support" && "ms-map-zone-card--support",
      )}
      role="region"
      aria-label={label}
    >
      <div className="ms-map-zone-card__header">
        <div className="min-w-0 flex-1">
          {kindLabel ? (
            <p className="ms-map-zone-card__kind">{kindLabel}</p>
          ) : null}
          <p className="ms-map-zone-card__label">{label}</p>
        </div>
        <button
          type="button"
          className="ms-map-zone-card__close ms-focus-ring"
          onClick={onClose}
          aria-label="Close zone detail"
        >
          ×
        </button>
      </div>
      <p className="ms-map-zone-card__read">{read}</p>
      {note ? (
        <p className="ms-map-zone-card__note">{note}</p>
      ) : null}
    </div>
  );
}
