"use client";

import { useEffect, useState } from "react";

const MOBILE_MQ = "(max-width: 767.98px)";

export function useMobileViewport(): boolean {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia(MOBILE_MQ);
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  return isMobile;
}
