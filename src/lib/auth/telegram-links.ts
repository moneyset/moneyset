import { publicSiteUrl } from "@/lib/services/shared/env";

/** Bot username without @ */
export function telegramBotUsername(): string | null {
  const raw = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME?.trim();
  return raw ? raw.replace(/^@/, "") : null;
}

/** Mini App short name in BotFather (Menu Button / Direct Link). */
export function telegramMiniAppShortName(): string {
  return process.env.NEXT_PUBLIC_TELEGRAM_MINI_APP_NAME?.trim() || "moneyset";
}

/** Direct deep link that opens the Mini App (not just bot chat). */
export function telegramMiniAppUrl(): string {
  const bot = telegramBotUsername();
  const app = telegramMiniAppShortName();
  if (bot && app) return `https://t.me/${bot}/${app}`;
  if (bot) return `https://t.me/${bot}?startapp=${encodeURIComponent(app)}`;
  return "https://t.me";
}

/** Login Widget callback URL for browser one-click auth. */
export function telegramLoginCallbackUrl(nextPath = "/"): string {
  const origin = publicSiteUrl();
  const next = nextPath.startsWith("/") ? nextPath : `/${nextPath}`;
  return `${origin}/api/auth/telegram/callback?next=${encodeURIComponent(next)}`;
}
