"use client";

/** Ambient market breathing layer — topology drift, pressure shading, vol glow. */
export function MarketBreathOverlay() {
  return (
    <div className="ms-shell-atmosphere ms-market-breath-overlay pointer-events-none absolute inset-0 z-[1] overflow-hidden" aria-hidden>
      <div className="ms-market-breath-overlay__drift" />
      <div className="ms-market-breath-overlay__pressure" />
      <div className="ms-market-breath-overlay__vol-glow" />
    </div>
  );
}
