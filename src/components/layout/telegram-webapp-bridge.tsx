"use client";

import { useEffect } from "react";

type TgInset = Partial<{ top: number; bottom: number; left: number; right: number }>;

type TelegramWebAppCompat = {
  ready: () => void;
  expand: () => void;
  disableVerticalSwipes?: () => void;
  enableClosingConfirmation?: () => void;
  setHeaderColor?: (color: string) => void;
  setBackgroundColor?: (color: string) => void;
  safeAreaInset?: TgInset;
  contentSafeAreaInset?: TgInset;
  onEvent?: (event: string, handler: () => void) => void;
  offEvent?: (event: string, handler: () => void) => void;
};

declare global {
  interface Window {
    Telegram?: { WebApp?: TelegramWebAppCompat };
  }
}

function applyInset(varName: string, api?: number) {
  if (typeof api === "number" && Number.isFinite(api) && api > 0) {
    document.documentElement.style.setProperty(varName, `${api}px`);
  } else {
    document.documentElement.style.removeProperty(varName);
  }
}

function applyTelegramSafeAreas(tg: TelegramWebAppCompat) {
  const s = tg.safeAreaInset ?? {};
  const c = tg.contentSafeAreaInset ?? {};
  applyInset("--ms-tg-safe-top", s.top ?? c.top);
  applyInset("--ms-tg-safe-bottom", s.bottom ?? c.bottom);
  applyInset("--ms-tg-safe-left", s.left ?? c.left);
  applyInset("--ms-tg-safe-right", s.right ?? c.right);
}

/** Telegram Mini App — fullscreen, safe-area injection, swipe stability. */
export function TelegramWebAppBridge() {
  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    const root = document.documentElement;

    if (!tg) {
      delete root.dataset.msTelegramWebApp;
      return;
    }

    try {
      tg.ready();
      tg.expand?.();
      tg.disableVerticalSwipes?.();
      tg.setHeaderColor?.("#000000");
      tg.setBackgroundColor?.("#000000");
    } catch {
      /* ignore TG API errors outside Mini App */
    }

    root.dataset.msTelegramWebApp = "1";
    applyTelegramSafeAreas(tg);

    const onSafeArea = () => applyTelegramSafeAreas(tg);
    tg.onEvent?.("viewportChanged", onSafeArea);
    tg.onEvent?.("safeAreaChanged", onSafeArea);

    return () => {
      tg.offEvent?.("viewportChanged", onSafeArea);
      tg.offEvent?.("safeAreaChanged", onSafeArea);
      delete root.dataset.msTelegramWebApp;
      document.documentElement.style.removeProperty("--ms-tg-safe-top");
      document.documentElement.style.removeProperty("--ms-tg-safe-bottom");
      document.documentElement.style.removeProperty("--ms-tg-safe-left");
      document.documentElement.style.removeProperty("--ms-tg-safe-right");
    };
  }, []);

  return null;
}
