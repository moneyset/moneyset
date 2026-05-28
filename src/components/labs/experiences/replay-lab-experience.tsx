"use client";

import { useState } from "react";

import { CognitionMachineShell } from "@/components/cognition/cognition-machine-shell";
import { ReplayTimelineNav } from "@/components/replay/replay-timeline-nav";
import { getLabIdentity } from "@/lib/cognition/lab-identities";
import { pickLocale } from "@/lib/i18n/cognition-dict";
import { getLabModule, labCopy } from "@/lib/labs/labs-modules";
import { useReplayCinema } from "@/hooks/use-replay-cinema";
import { useUiPrefsStore } from "@/store/ui-prefs-store";

export function ReplayLabExperience() {
  const locale = useUiPrefsStore((s) => s.uiLocale);
  const mobileReduced = useUiPrefsStore((s) => s.replayMobileDetail === "reduced");
  const identity = getLabIdentity("replay");
  const mod = getLabModule("replay");
  const bundle = useReplayCinema();
  const [frameIndex, setFrameIndex] = useState(() => Math.max(0, bundle.frameCount - 1));
  const frame = bundle.frames[frameIndex] ?? bundle.frames[0];
  const layer = bundle.layers.structural;

  return (
    <CognitionMachineShell
      identity={identity}
      locale={locale}
      title={labCopy(locale, mod.title)}
      purpose={labCopy(locale, mod.purpose)}
    >
      <section className="ms-replay-timeline">
        <ReplayTimelineNav
          slots={bundle.timeline}
          activeFrameIndex={frameIndex}
          onSelect={setFrameIndex}
          compact={mobileReduced}
        />

        {frame ? (
          <article className="mt-4 rounded-ms-xl border border-ms-border/20 bg-ms-elevated/10 p-4">
            <p className="font-mono text-[10px] text-ms-faint">{frame.clock}</p>
            <p className="mt-1 text-[13px] font-semibold text-ms-text">{frame.headline}</p>
            <p className="mt-2 text-[11px] leading-relaxed text-ms-muted">{frame.structuralRead}</p>
            <p className="mt-2 border-l-2 border-ms-cognition/25 pl-2 text-[10px] text-ms-cognition/85">
              {frame.executionDrift}
            </p>
          </article>
        ) : null}

        <ol className="ms-replay-timeline__track mt-5">
          {layer.moments.slice(0, mobileReduced ? 3 : 6).map((m) => (
            <li key={m.clock} className="ms-replay-timeline__moment">
              <span className="ms-replay-timeline__clock">{m.clock}</span>
              <div className="min-w-0 flex-1">
                <p className="text-[12px] font-medium leading-snug text-ms-text">{m.headline}</p>
                <p className="mt-1 text-[10px] leading-snug text-ms-muted">{m.structuralRead}</p>
                {!mobileReduced ? (
                  <p className="mt-1.5 text-[10px] leading-snug text-ms-cognition/85">{m.adaptation}</p>
                ) : null}
              </div>
            </li>
          ))}
        </ol>
        <p className="mt-4 text-[10px] italic leading-snug text-ms-faint">{layer.closingQuestion}</p>
        <p className="mt-3 text-[10px] text-ms-faint">
          <a href="/replay" className="text-ms-cognition/85 hover:underline">
            {pickLocale(locale, "Open full Replay Studio →", "Открыть Replay Studio →")}
          </a>
        </p>
      </section>
    </CognitionMachineShell>
  );
}
