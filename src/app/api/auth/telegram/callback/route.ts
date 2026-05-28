import { NextResponse } from "next/server";

import { establishTelegramSession } from "@/lib/auth/telegram-session";
import { verifyTelegramLoginWidget } from "@/lib/auth/telegram-login-widget";
import { sanitizeAuthNextPath } from "@/lib/supabase/auth-routing";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { supabaseServer } from "@/lib/supabase/server";
import { env } from "@/lib/services/shared/env";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Telegram Login Widget callback (GET redirect).
 * BotFather /setdomain → moneyset.pro
 * Widget data-auth-url → https://moneyset.pro/api/auth/telegram/callback
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

  const verified = verifyTelegramLoginWidget(params, botToken);
  if (!verified) {
    return NextResponse.redirect(`${origin}/auth?error=${encodeURIComponent("invalid_telegram_login")}`);
  }

  const admin = supabaseAdmin();
  if (!admin) {
    return NextResponse.redirect(`${origin}/auth?error=${encodeURIComponent("auth_unconfigured")}`);
  }

  const result = await establishTelegramSession(admin, verified.id, verified.username ?? null);
  if (!result.ok || !result.session) {
    return NextResponse.redirect(
      `${origin}/auth?error=${encodeURIComponent(result.error ?? "telegram_session_failed")}`,
    );
  }

  const supabase = await supabaseServer();
  if (supabase) {
    await supabase.auth.setSession({
      access_token: result.session.access_token,
      refresh_token: result.session.refresh_token,
    });
  }

  return NextResponse.redirect(`${origin}${next}`);
}
