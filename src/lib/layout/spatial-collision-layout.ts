/**
 * Percentage-space collision layout for absolute-positioned field annotations.
 * Resolves overlapping boxes without changing visual density — only nudges coordinates.
 */

export type SpatialRect = Readonly<{
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  /** Higher priority boxes move less when resolving collisions. */
  priority?: number;
}>;

export type SpatialLayoutBounds = Readonly<{
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}>;

const DEFAULT_BOUNDS: SpatialLayoutBounds = { minX: 0, minY: 0, maxX: 100, maxY: 100 };

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n));
}

function clampRect<T extends SpatialRect>(rect: T, bounds: SpatialLayoutBounds): T {
  const w = clamp(rect.w, 4, bounds.maxX - bounds.minX);
  const h = clamp(rect.h, 4, bounds.maxY - bounds.minY);
  const x = clamp(rect.x, bounds.minX, bounds.maxX - w);
  const y = clamp(rect.y, bounds.minY, bounds.maxY - h);
  return { ...rect, x, y, w, h };
}

export function rectsOverlap(a: SpatialRect, b: SpatialRect, gap: number): boolean {
  return (
    a.x < b.x + b.w + gap &&
    a.x + a.w + gap > b.x &&
    a.y < b.y + b.h + gap &&
    a.y + a.h + gap > b.y
  );
}

type Separation = Readonly<{ dx: number; dy: number }>;

function separationVector(a: SpatialRect, b: SpatialRect, gap: number): Separation {
  const overlapX = Math.min(a.x + a.w + gap - b.x, b.x + b.w + gap - a.x);
  const overlapY = Math.min(a.y + a.h + gap - b.y, b.y + b.h + gap - a.y);
  if (overlapX <= 0 || overlapY <= 0) return { dx: 0, dy: 0 };

  if (overlapY <= overlapX) {
    const pushDown = b.y + b.h + gap - a.y;
    const pushUp = a.y + a.h + gap - b.y;
    if (pushDown > 0 && pushDown <= pushUp) return { dx: 0, dy: pushDown };
    if (pushUp > 0) return { dx: 0, dy: -pushUp };
  }

  const pushRight = b.x + b.w + gap - a.x;
  const pushLeft = a.x + a.w + gap - b.x;
  if (pushRight > 0 && pushRight <= pushLeft) return { dx: pushRight, dy: 0 };
  if (pushLeft > 0) return { dx: -pushLeft, dy: 0 };

  return { dx: 0, dy: overlapY > 0 ? overlapY * 0.5 : 0 };
}

/**
 * Resolve rectangle collisions in percentage space. Returns new positions in input order.
 */
export function resolveSpatialLayout<T extends SpatialRect>(
  items: readonly T[],
  options?: Readonly<{
    gap?: number;
    bounds?: SpatialLayoutBounds;
    maxIterations?: number;
  }>,
): T[] {
  if (items.length === 0) return [];

  const gap = options?.gap ?? 2.5;
  const bounds = options?.bounds ?? DEFAULT_BOUNDS;
  const maxIterations = options?.maxIterations ?? 48;

  const order = [...items].sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));
  const placed = new Map<string, T>();

  for (const item of order) {
    let current = clampRect(item, bounds);

    for (let pass = 0; pass < maxIterations; pass++) {
      let moved = false;
      for (const other of placed.values()) {
        if (!rectsOverlap(current, other, gap)) continue;

        const { dx, dy } = separationVector(current, other, gap);
        const next = clampRect(
          {
            ...current,
            x: current.x + dx,
            y: current.y + dy,
          },
          bounds,
        );

        if (next.x !== current.x || next.y !== current.y) {
          current = next;
          moved = true;
        }
      }
      if (!moved) break;
    }

    placed.set(item.id, current);
  }

  return items.map((item) => placed.get(item.id) ?? clampRect(item, bounds));
}

/** Apply resolved layout back to items that carry x/y/w/h. */
export function applySpatialLayout<T extends SpatialRect>(
  items: readonly T[],
  resolved: readonly SpatialRect[],
): T[] {
  const byId = new Map(resolved.map((r) => [r.id, r] as const));
  return items.map((item) => {
    const next = byId.get(item.id);
    if (!next) return item;
    return { ...item, x: next.x, y: next.y, w: next.w, h: next.h };
  });
}

export function layoutSpatialItems<T extends SpatialRect>(
  items: readonly T[],
  options?: Parameters<typeof resolveSpatialLayout>[1],
): T[] {
  return applySpatialLayout(items, resolveSpatialLayout(items, options));
}

/** Vertical stack for same-column bands (execution terrain). */
export function layoutVerticalStack<T extends { y: number; h: number }>(
  items: readonly T[],
  options?: Readonly<{ gap?: number; minH?: number; maxBottom?: number; startY?: number }>,
): T[] {
  const gap = options?.gap ?? 2;
  const minH = options?.minH ?? 9;
  const maxBottom = options?.maxBottom ?? 96;
  const startY = options?.startY ?? 2;

  const sorted = [...items].sort((a, b) => a.y - b.y);
  const rawTotal =
    sorted.reduce((sum, item) => sum + Math.max(item.h, minH), 0) + Math.max(0, sorted.length - 1) * gap;
  const available = maxBottom - startY;
  const scale = rawTotal > available && rawTotal > 0 ? available / rawTotal : 1;

  let cursor = startY;
  return sorted.map((item) => {
    const h = Math.max(minH, item.h * scale);
    const y = Math.min(cursor, maxBottom - h);
    cursor = y + h + gap;
    return { ...item, y, h };
  });
}

/** Annotation slots on the right rail — percentage top positions. */
export function layoutAnnotationSlots(
  count: number,
  options?: Readonly<{ startY?: number; slotH?: number; gap?: number; maxY?: number }>,
): number[] {
  const startY = options?.startY ?? 6;
  const slotH = options?.slotH ?? 10.5;
  const gap = options?.gap ?? 1.5;
  const maxY = options?.maxY ?? 92;
  const tops: number[] = [];
  let cursor = startY;
  for (let i = 0; i < count; i++) {
    tops.push(Math.min(cursor, maxY - slotH));
    cursor += slotH + gap;
  }
  return tops;
}
