import { NextResponse } from "next/server";

import {
  buildTelegramOidcAuthorizationUrl,
  createTelegramOidcPkce,
  getTelegramOidcConfig,
} from "@/lib/auth/telegram-oidc";
import { applyTelegramOidcCookies } from "@/lib/auth/telegram-oidc-cookies";
import { signTelegramOidcState } from "@/lib/auth/telegram-oidc-state";
import { logTelegramAuthEvent } from "@/lib/auth/telegram-telemetry";
import { sanitizeAuthNextPath } from "@/lib/supabase/auth-routing";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** Begin Telegram OIDC login (Authorization Code + PKCE). */
export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const origin = requestUrl.origin;
  const next = sanitizeAuthNextPath(requestUrl.searchParams.get("next"));
  const userAgent = request.headers.get("user-agent") ?? undefined;

  const config = getTelegramOidcConfig(origin);
  if (!config) {
    return NextResponse.redirect(`${origin}/auth?error=${encodeURIComponent("telegram_oidc_unconfigured")}`);
  }

  const pkce = createTelegramOidcPkce();
  const signedState = signTelegramOidcState({
    state: pkce.state,
    codeVerifier: pkce.codeVerifier,
    nextPath: next,
  });

  const oauthState = signedState ?? pkce.state;
  const cookieBundle = {
    state: oauthState,
    codeVerifier: pkce.codeVerifier,
    nextPath: next,
  };

  logTelegramAuthEvent("telegram_login_started", {
    source: "oidc",
    channel: "oidc",
    signed_state: Boolean(signedState),
    telegram_webview: Boolean(userAgent && /Telegram/i.test(userAgent)),
  });

  const authUrl = buildTelegramOidcAuthorizationUrl(config, pkce, oauthState);
  const response = NextResponse.redirect(authUrl);
  applyTelegramOidcCookies(response, cookieBundle, userAgent);
  return response;
}
