"use client";

import type { CSSProperties } from "react";

import type { CognitionWorldId } from "@/lib/cognition/cognition-worlds";
import { useCognitionDramaContext } from "@/components/cognition/cognition-drama-context";
import { signatureMomentForWorld } from "@/lib/cognition/cognition-drama-engine";
import { cn } from "@/lib/utils";

/** Legendary cognition moment — screenshot-grade peak experience. */
export function SignatureMomentBanner({ world }: { world?: CognitionWorldId }) {
  const drama = useCognitionDramaContext();
  if (!drama) return null;

  const moment = world ? signatureMomentForWorld(drama, world) : drama.activeMoment;
  if (!moment?.active) return null;

  return (
    <div
      className={cn("ms-signature-moment", moment.visualClass, moment.severity === "legendary" && "ms-signature-moment--legendary")}
      role="status"
      aria-live="polite"
      data-ms-signature={moment.id}
      style={{ "--ms-signature-intensity": moment.intensity } as CSSProperties}
    >
      <div className="ms-signature-moment__shockwave" aria-hidden />
      <div className="ms-signature-moment__beam" aria-hidden />
      <div className="ms-signature-moment__copy">
        <p className="ms-signature-moment__tag">{moment.severity === "legendary" ? "Signature" : "Peak"}</p>
        <h2 className="ms-signature-moment__headline">{moment.headline}</h2>
        <p className="ms-signature-moment__subline">{moment.subline}</p>
      </div>
    </div>
  );
}
