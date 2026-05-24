"use client";

import type { CSSProperties } from "react";

import { useLiquidityTheater } from "@/hooks/use-liquidity-theater";
import type { LiquidityPhenomenonKind } from "@/lib/intelligence/liquidity-physics-phenomena";
import { cn } from "@/lib/utils";

const KIND_CLASS: Record<LiquidityPhenomenonKind, string> = {
  gravity_well: "ms-liq-phenomenon--gravity-well",
  pressure_fracture: "ms-liq-phenomenon--fracture",
  cascade_pathway: "ms-liq-phenomenon--cascade",
  leverage_deformation: "ms-liq-phenomenon--leverage",
  instability_pocket: "ms-liq-phenomenon--instability",
  vol_expansion_wave: "ms-liq-phenomenon--vol-wave",
  sponsorship_collapse: "ms-liq-phenomenon--sponsor-collapse",
  migration_corridor: "ms-liq-phenomenon--migration",
};

/** Living pressure universe — physics phenomena over terrain. */
export function LiquidityPhysicsLayer() {
  const bundle = useLiquidityTheater();
  const phenomena = bundle.phenomena;

  return (
    <div className="ms-liq-physics-layer pointer-events-none absolute inset-0 z-[1]" aria-hidden>
      {phenomena.map((p) => (
        <div
          key={p.id}
          className={cn("ms-liq-phenomenon", KIND_CLASS[p.kind], p.pulsing && "ms-liq-phenomenon--pulse")}
          style={
            {
              left: `${p.x}%`,
              top: `${p.y}%`,
              width: `${p.w}%`,
              height: `${p.h}%`,
              "--ms-phenomenon-intensity": p.intensity / 100,
            } as CSSProperties
          }
        >
          <span className="ms-liq-phenomenon__core" />
          <span className="ms-liq-phenomenon__label">{p.label}</span>
        </div>
      ))}
    </div>
  );
}
