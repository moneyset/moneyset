"use client";

import { useEffect, useState } from "react";

/** Android-first phone widths (360–430px) and similar narrow viewports. */
export const NARROW_MOBILE_MQ = "(max-width: 430px)";

export function useNarrowMobileViewport(): boolean {
  const [narrow, setNarrow] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia(NARROW_MOBILE_MQ);
    const update = () => setNarrow(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  return narrow;
}
