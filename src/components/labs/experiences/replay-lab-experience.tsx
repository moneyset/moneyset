"use client";

import { useMemo } from "react";
import { useShallow } from "zustand/react/shallow";

import { CognitionMachineShell } from "@/components/cognition/cognition-machine-shell";
import { CognitionPrimaryState } from "@/components/cognition/cognition-primary-state";
import { getLabIdentity } from "@/lib/cognition/lab-identities";
import { pickLocale } from "@/lib/i18n/cognition-dict";
import { deriveReplayStudioBundle } from "@/lib/intelligence/replay-studio-view";
import { getLabModule, labCopy } from "@/lib/labs/labs-modules";
import { useCognitionSimulationStore } from "@/store/cognition-simulation-store";
import { useUiPrefsStore } from "@/store/ui-prefs-store";

export function ReplayLabExperience() {
  const locale = useUiPrefsStore((s) => s.uiLocale);
  const identity = getLabIdentity("replay");
  const mod = getLabModule("replay");
  const { history, agentHistory, topScenario } = useCognitionSimulationStore(
    useShallow((s) => ({ history: s.history, agentHistory: s.agentHistory, topScenario: s.topScenario })),
  );

  const bundle = useMemo(
    () => deriveReplayStudioBundle(locale, history, agentHistory, topScenario.scenarioId),
    [locale, history, agentHistory, topScenario.scenarioId],
  );
  const layer = bundle.structural;
  const primary = layer.moments[0];

  return (
    <CognitionMachineShell
      identity={identity}
      locale={locale}
      title={labCopy(locale, mod.title)}
      purpose={labCopy(locale, mod.purpose)}
    >
      <section className="ms-replay-timeline">
        <CognitionPrimaryState
          label={pickLocale(locale, "Structural replay", "Структурный реплей")}
          state={primary?.headline ?? layer.title}
          subline={layer.synopsis}
        />
        <ol className="ms-replay-timeline__track">
          {layer.moments.slice(0, 6).map((m) => (
            <li key={m.clock} className="ms-replay-timeline__moment">
              <span className="ms-replay-timeline__clock">{m.clock}</span>
              <div className="min-w-0 flex-1">
                <p className="text-[12px] font-medium leading-snug text-ms-text">{m.headline}</p>
                <p className="mt-1 text-[10px] leading-snug text-ms-muted">{m.structuralRead}</p>
                <p className="mt-1.5 text-[10px] leading-snug text-ms-cognition/85">{m.adaptation}</p>
              </div>
            </li>
          ))}
        </ol>
        <p className="text-[10px] italic leading-snug text-ms-faint">{layer.closingQuestion}</p>
      </section>
    </CognitionMachineShell>
  );
}
