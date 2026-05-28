"use client";

import type { ReplayTimelineSlot } from "@/lib/intelligence/replay-timeline-engine";
import { pickLocale } from "@/lib/i18n/cognition-dict";
import { cn } from "@/lib/utils";
import { useUiPrefsStore } from "@/store/ui-prefs-store";

type ReplayTimelineNavProps = {
  slots: readonly ReplayTimelineSlot[];
  activeFrameIndex: number;
  onSelect: (frameIndex: number) => void;
  compact?: boolean;
};

export function ReplayTimelineNav({ slots, activeFrameIndex, onSelect, compact }: ReplayTimelineNavProps) {
  const locale = useUiPrefsStore((s) => s.uiLocale);

  if (slots.length === 0) return null;

  return (
    <nav
      className="ms-replay-timeline-nav"
      aria-label={pickLocale(locale, "Structural timeline", "Структурный таймлайн")}
    >
      <p className="ms-replay-timeline-nav__label">
        {pickLocale(locale, "Evolution window", "Окно эволюции")}
      </p>
      <ol className="ms-replay-timeline-nav__track">
        {slots.map((slot, i) => {
          const active = slot.frameIndex === activeFrameIndex;
          const isLast = i === slots.length - 1;
          return (
            <li key={slot.offset} className="ms-replay-timeline-nav__item">
              <button
                type="button"
                className={cn(
                  "ms-replay-timeline-nav__slot",
                  active && "ms-replay-timeline-nav__slot--active",
                  isLast && "ms-replay-timeline-nav__slot--now",
                )}
                onClick={() => onSelect(slot.frameIndex)}
                aria-current={active ? "step" : undefined}
              >
                <span className="ms-replay-timeline-nav__offset">{slot.offset}</span>
                <span className="ms-replay-timeline-nav__time">{slot.timestamp}</span>
                {!compact ? (
                  <span className="ms-replay-timeline-nav__change">{slot.stateChange}</span>
                ) : null}
              </button>
              {i < slots.length - 1 ? (
                <span className="ms-replay-timeline-nav__connector" aria-hidden />
              ) : null}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
