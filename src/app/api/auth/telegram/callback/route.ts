import { NextResponse } from "next/server";

import { establishTelegramSession } from "@/lib/auth/telegram-session";
import { verifyTelegramLoginWidget } from "@/lib/auth/telegram-login-widget";
import { logTelegramAuthEvent } from "@/lib/auth/telegram-telemetry";
import { hasExtendedAccess } from "@/lib/access/roles";
import { sanitizeAuthNextPath } from "@/lib/supabase/auth-routing";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { redirectWithSupabaseSession } from "@/lib/supabase/session-redirect";
import { env } from "@/lib/services/shared/env";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * @deprecated Legacy Login Widget callback (HMAC hash verification).
 * Browser login now uses OIDC → /api/auth/telegram/oidc/callback
 * BotFather /setdomain is still required for legacy widget embeds only.
 */
export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const origin = requestUrl.origin;
  const next = sanitizeAuthNextPath(requestUrl.searchParams.get("next"));

  const botToken = env("TELEGRAM_BOT_TOKEN");
  if (!botToken) {
    return NextResponse.redirect(`${origin}/auth?error=${encodeURIComponent("telegram_unconfigured")}`);
  }

  const params: Record<string, string> = {};
  requestUrl.searchParams.forEach((value, key) => {
    params[key] = value;
  });

  logTelegramAuthEvent("telegram_login_started", { source: "widget", channel: "login_widget" });

  const verified = verifyTelegramLoginWidget(params, botToken);
  if (!verified) {
    logTelegramAuthEvent("telegram_login_failed", { source: "widget", reason: "invalid_widget" });
    return NextResponse.redirect(`${origin}/auth?error=${encodeURIComponent("invalid_telegram_login")}`);
  }

  const admin = supabaseAdmin();
  if (!admin) {
    logTelegramAuthEvent("telegram_login_failed", { source: "widget", reason: "admin_unconfigured" });
    return NextResponse.redirect(`${origin}/auth?error=${encodeURIComponent("auth_unconfigured")}`);
  }

  const result = await establishTelegramSession(admin, verified.id, verified.username ?? null);
  if (!result.ok || !result.session) {
    logTelegramAuthEvent("telegram_login_failed", {
      source: "widget",
      reason: (result.error ?? "session_failed").slice(0, 120),
    });
    return NextResponse.redirect(
      `${origin}/auth?error=${encodeURIComponent(result.error ?? "telegram_session_failed")}`,
    );
  }

  logTelegramAuthEvent("telegram_login_completed", {
    source: "widget",
    telegram_id: verified.id,
    is_new: Boolean(result.isNewUser),
    is_returning: Boolean(result.isReturning),
    premium: Boolean(result.profile && hasExtendedAccess(result.profile)),
  });

  if (result.isReturning) {
    logTelegramAuthEvent("telegram_account_restored", {
      source: "widget",
      telegram_id: verified.id,
      premium: Boolean(result.profile && hasExtendedAccess(result.profile)),
    });
  } else if (result.isNewUser) {
    logTelegramAuthEvent("telegram_account_linked", { source: "widget", telegram_id: verified.id });
  }

  return redirectWithSupabaseSession(
    result.session,
    `${origin}${next}`,
    `${origin}/auth?error=${encodeURIComponent("telegram_session_failed")}`,
  );
}
