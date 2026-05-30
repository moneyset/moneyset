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

/** OIDC Authorization Code callback — register in BotFather → Web Login. */
export function telegramOidcCallbackUrl(origin?: string): string {
  const base = origin ?? (typeof window !== "undefined" ? window.location.origin : publicSiteUrl());
  return `${base.replace(/\/$/, "")}/api/auth/telegram/oidc/callback`;
}

/** Start OIDC login (server redirect + PKCE). */
export function telegramOidcStartUrl(nextPath = "/"): string {
  const next = nextPath.startsWith("/") ? nextPath : `/${nextPath}`;
  return `/api/auth/telegram/oidc/start?next=${encodeURIComponent(next)}`;
}

/** @deprecated Legacy Login Widget callback — use telegramOidcCallbackUrl instead. */
export function telegramLoginCallbackUrl(nextPath = "/"): string {
  const next = nextPath.startsWith("/") ? nextPath : `/${nextPath}`;
  if (typeof window !== "undefined") {
    return `${window.location.origin}/api/auth/telegram/callback?next=${encodeURIComponent(next)}`;
  }
  const origin = publicSiteUrl();
  return `${origin}/api/auth/telegram/callback?next=${encodeURIComponent(next)}`;
}
