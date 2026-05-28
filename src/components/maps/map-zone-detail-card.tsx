"use client";

import { IntelDetailCard } from "@/components/ui/intel-detail-card";

type ZoneTone = "stress" | "support" | "neutral";

type MapZoneDetailCardProps = {
  label: string;
  kindLabel?: string;
  read: string;
  note?: string;
  tone?: ZoneTone;
  onClose: () => void;
};

/**
 * Unified zone detail card — shown below any map canvas when a cell is tapped.
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
    <IntelDetailCard
      className="ms-map-zone-card"
      title={label}
      kindLabel={kindLabel}
      body={read}
      note={note}
      tone={tone}
      onClose={onClose}
      closeLabel="Close zone detail"
    />
  );
}
