"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Unified map focus engine — enforces a single active element across all
 * interactive map surfaces (Execution terrain, Chart Lab, Liquidity Lab).
 *
 * Rules:
 * - Only one item can be "open" (expanded/focused) at a time.
 * - Tapping the open item closes it.
 * - Tapping outside the container closes the open item.
 * - Keyboard Escape closes the open item.
 */
export function useMapFocus<T extends string = string>() {
  const [activeId, setActiveId] = useState<T | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const toggle = useCallback((id: T) => {
    setActiveId((prev) => (prev === id ? null : id));
  }, []);

  const clear = useCallback(() => setActiveId(null), []);

  const isActive = useCallback((id: T) => activeId === id, [activeId]);

  // Close on outside tap
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handlePointerDown = (e: PointerEvent) => {
      if (!activeId) return;
      // If the click target is inside the container, let component logic handle it
      if (container.contains(e.target as Node)) return;
      setActiveId(null);
    };

    document.addEventListener("pointerdown", handlePointerDown, { passive: true });
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [activeId]);

  // Close on Escape
  useEffect(() => {
    if (!activeId) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setActiveId(null);
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [activeId]);

  return { activeId, toggle, clear, isActive, containerRef };
}

/**
 * A lighter version for components that don't need a ref — just the ID logic.
 */
export function useMapTooltipId<T extends string = string>() {
  const [activeId, setActiveId] = useState<T | null>(null);

  const toggle = useCallback((id: T) => {
    setActiveId((prev) => (prev === id ? null : id));
  }, []);

  const clear = useCallback(() => setActiveId(null), []);

  return { activeId, toggle, clear };
}
