"use client";

import { useAgentCognition } from "@/hooks/use-agent-cognition";
import { pickLocale } from "@/lib/i18n/cognition-dict";
import { cn } from "@/lib/utils";
import { useUiPrefsStore } from "@/store/ui-prefs-store";

function PhysicsBar({ label, value, stressed }: { label: string; value: number; stressed?: boolean }) {
  return (
    <div className="ms-agents-physics__bar">
      <div className="flex items-baseline justify-between gap-2">
        <span className="ms-data-label text-ms-faint">{label}</span>
        <span className="text-[10px] tabular-nums text-ms-muted">{value}</span>
      </div>
      <div className="ms-agents-physics__track" aria-hidden>
        <div
          className={cn("ms-agents-physics__fill", stressed && "ms-agents-physics__fill--stressed")}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

export function AgentConvictionPhysics({ className }: { className?: string }) {
  const locale = useUiPrefsStore((s) => s.uiLocale);
  const { physics } = useAgentCognition();

  return (
    <section className={cn("ms-agents-physics", className)} aria-label={pickLocale(locale, "Conviction physics", "Физика убеждённости")}>
      <header className="mb-4">
        <h3 className="text-[11px] font-semibold tracking-tight text-ms-text">
          {pickLocale(locale, "Read stability", "Устойчивость прочтений")}
        </h3>
        <p className="mt-1 text-[10px] leading-snug text-ms-faint">
          {pickLocale(
            locale,
            "How stable the current consensus is — and how quickly reads can shift.",
            "Насколько устойчив текущий консенсус — и как быстро прочтения могут измениться.",
          )}
        </p>
      </header>
      <div className="space-y-3">
        <PhysicsBar
          label={pickLocale(locale, "Stress accumulation", "Накопление стресса")}
          value={physics.stressAccumulation}
          stressed={physics.stressAccumulation >= 68}
        />
        <PhysicsBar
          label={pickLocale(locale, "Consensus inertia", "Инерция консенсуса")}
          value={physics.consensusInertia}
        />
        <PhysicsBar
          label={pickLocale(locale, "Escalation pressure", "Давление эскалации")}
          value={physics.escalationPressure}
          stressed={physics.escalationPressure >= 62}
        />
        <PhysicsBar
          label={pickLocale(locale, "Confidence decay", "Распад уверенности")}
          value={physics.confidenceDecay}
          stressed={physics.confidenceDecay >= 55}
        />
        <PhysicsBar label={pickLocale(locale, "Reinforcement", "Подкрепление")} value={physics.reinforcement} />
      </div>
    </section>
  );
}
