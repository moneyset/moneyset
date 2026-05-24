"use client";

import { useEffect, useState } from "react";

const DESKTOP_MQ = "(min-width: 1024px)";

export function useDesktopViewport(): boolean {
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia(DESKTOP_MQ);
    const update = () => setIsDesktop(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  return isDesktop;
}
