import { NextResponse } from "next/server";

import { establishTelegramSession } from "@/lib/auth/telegram-session";
import {
  exchangeTelegramOidcCode,
  getTelegramOidcConfig,
  verifyTelegramOidcState,
} from "@/lib/auth/telegram-oidc";
import {
  clearTelegramOidcCookies,
  readTelegramOidcCookies,
} from "@/lib/auth/telegram-oidc-cookies";
import { unsignTelegramOidcState } from "@/lib/auth/telegram-oidc-state";
import { logTelegramAuthEvent } from "@/lib/auth/telegram-telemetry";
import { readPartnerRefCookie } from "@/lib/partners/partner-codes";
import { hasExtendedAccess } from "@/lib/access/roles";
import { sanitizeAuthNextPath } from "@/lib/supabase/auth-routing";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { redirectWithSupabaseSession } from "@/lib/supabase/session-redirect";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 30;

/**
 * Telegram OIDC callback — register this exact Redirect URI in BotFather → Web Login:
 * https://moneyset.pro/api/auth/telegram/oidc/callback
 */
export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const origin = requestUrl.origin;
  const code = requestUrl.searchParams.get("code");
  const state = requestUrl.searchParams.get("state");
  const oauthError = requestUrl.searchParams.get("error");
  const userAgent = request.headers.get("user-agent") ?? undefined;
  const cookies = await readTelegramOidcCookies();
  const signed = unsignTelegramOidcState(state);

  logTelegramAuthEvent("telegram_login_started", {
    source: "oidc",
    channel: "oidc_callback",
    has_code: Boolean(code),
    has_state: Boolean(state),
    signed_state: Boolean(signed),
    has_cookies: Boolean(cookies),
    telegram_webview: Boolean(userAgent && /Telegram/i.test(userAgent)),
    oauth_error: oauthError ? oauthError.slice(0, 80) : null,
  });

  if (oauthError) {
    logTelegramAuthEvent("telegram_login_failed", { source: "oidc", reason: oauthError.slice(0, 120) });
    await clearTelegramOidcCookies();
    return NextResponse.redirect(`${origin}/auth?error=${encodeURIComponent("telegram_oidc_denied")}`);
  }

  const config = getTelegramOidcConfig(origin);
  if (!config) {
    return NextResponse.redirect(`${origin}/auth?error=${encodeURIComponent("telegram_oidc_unconfigured")}`);
  }

  const cookieOk = Boolean(cookies && verifyTelegramOidcState(cookies.state, state));
  const signedOk = Boolean(signed);
  const codeVerifier = signed?.codeVerifier ?? cookies?.codeVerifier;
  const next = sanitizeAuthNextPath(signed?.nextPath ?? cookies?.nextPath);

  if ((!cookieOk && !signedOk) || !codeVerifier || !code) {
    logTelegramAuthEvent("telegram_login_failed", {
      source: "oidc",
      reason: "invalid_state",
      cookie_ok: cookieOk,
      signed_ok: signedOk,
    });
    await clearTelegramOidcCookies();
    return NextResponse.redirect(`${origin}/auth?error=${encodeURIComponent("invalid_telegram_oidc")}`);
  }

  try {
    const user = await exchangeTelegramOidcCode(config, code, codeVerifier);
    await clearTelegramOidcCookies();

    const admin = supabaseAdmin();
    if (!admin) {
      logTelegramAuthEvent("telegram_login_failed", { source: "oidc", reason: "admin_unconfigured" });
      return NextResponse.redirect(`${origin}/auth?error=${encodeURIComponent("auth_unconfigured")}`);
    }

    const partnerCode = await readPartnerRefCookie();
    const result = await establishTelegramSession(admin, user.telegramId, user.username, partnerCode);
    if (!result.ok || !result.session) {
      logTelegramAuthEvent("telegram_login_failed", {
        source: "oidc",
        reason: (result.error ?? "session_failed").slice(0, 120),
      });
      return NextResponse.redirect(
        `${origin}/auth?error=${encodeURIComponent(result.error ?? "telegram_session_failed")}`,
      );
    }

    logTelegramAuthEvent("telegram_login_completed", {
      source: "oidc",
      telegram_id: user.telegramId,
      is_new: Boolean(result.isNewUser),
      is_returning: Boolean(result.isReturning),
      premium: Boolean(result.profile && hasExtendedAccess(result.profile)),
    });

    return redirectWithSupabaseSession(
      result.session,
      `${origin}${next}`,
      `${origin}/auth?error=${encodeURIComponent("telegram_session_failed")}`,
    );
  } catch (e) {
    await clearTelegramOidcCookies();
    logTelegramAuthEvent("telegram_login_failed", {
      source: "oidc",
      reason: (e instanceof Error ? e.message : "oidc_failed").slice(0, 120),
    });
    return NextResponse.redirect(`${origin}/auth?error=${encodeURIComponent("invalid_telegram_oidc")}`);
  }
}
