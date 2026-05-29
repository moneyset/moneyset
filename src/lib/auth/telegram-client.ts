import { telegramMiniAppUrl } from "@/lib/auth/telegram-links";

/** True when Telegram WebApp initData is present (verified auth context). */
export function isTelegramMiniApp(): boolean {
  if (typeof window === "undefined") return false;
  const initData = (window.Telegram?.WebApp as { initData?: string } | undefined)?.initData;
  return typeof initData === "string" && initData.length > 0;
}

export function readTelegramInitData(): string | null {
  if (typeof window === "undefined") return null;
  const initData = (window.Telegram?.WebApp as { initData?: string } | undefined)?.initData;
  return typeof initData === "string" && initData.length > 0 ? initData : null;
}

/** Open URL outside the in-app webview when Telegram API is available. */
export function openInExternalBrowser(url: string): void {
  const tg = window.Telegram?.WebApp as { openLink?: (url: string) => void } | undefined;
  if (tg?.openLink) {
    tg.openLink(url);
    return;
  }
  window.open(url, "_blank", "noopener,noreferrer");
}

/** Open the configured Telegram Mini App (direct link, not bot chat). */
export function openTelegramMiniApp(): void {
  const url = telegramMiniAppUrl();
  if (isTelegramMiniApp()) return;
  openInExternalBrowser(url);
}
