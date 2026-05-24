"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState, type CSSProperties, ReactNode } from "react";

import {
  getCognitionWorld,
  worldFrameClass,
  type CognitionWorldId,
} from "@/lib/cognition/cognition-worlds";
import { cn } from "@/lib/utils";

export type CognitionWorldFrameProps = {
  world: CognitionWorldId;
  children: ReactNode;
  className?: string;
  /** Cinematic entry on mount */
  reveal?: boolean;
};

export function CognitionWorldFrame({
  world,
  children,
  className,
  reveal = true,
}: CognitionWorldFrameProps) {
  const profile = getCognitionWorld(world);
  const pathname = usePathname();
  const [entering, setEntering] = useState(reveal);

  useEffect(() => {
    if (!reveal) return;
    setEntering(true);
    const id = window.setTimeout(() => setEntering(false), 920);
    return () => window.clearTimeout(id);
  }, [pathname, reveal, world]);

  return (
    <div
      data-ms-world={world}
      data-ms-world-rhythm={profile.rhythm}
      className={cn(
        worldFrameClass(world),
        "ms-visual-cognition-surface ms-category-world-surface",
        profile.atmosphereClass,
        profile.density === "sparse" && "ms-cognition-world--sparse",
        profile.density === "dense" && "ms-cognition-world--dense",
        reveal && "ms-cognition-world--reveal",
        entering && `ms-world-entry ms-world-entry--${world}`,
        className,
      )}
      style={
        {
          "--ms-world-accent": `var(${profile.accentVar})`,
          "--ms-world-accent-dim": `var(${profile.accentDimVar})`,
          "--ms-world-hero-scale": profile.heroScale,
          "--ms-world-label-scale": profile.labelScale,
          "--ms-world-meta-scale": profile.metaScale,
        } as CSSProperties
      }
    >
      <div className="ms-cognition-world__depth" aria-hidden />
      <div className="ms-cognition-world__fog" aria-hidden />
      <div className="ms-cognition-world__content">{children}</div>
    </div>
  );
}
