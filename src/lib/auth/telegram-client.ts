/** True when running inside Telegram Mini App (WebApp initData present). */
export function isTelegramMiniApp(): boolean {
  if (typeof window === "undefined") return false;
  const initData = (window.Telegram?.WebApp as { initData?: string } | undefined)?.initData;
  return typeof initData === "string" && initData.length > 0;
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
