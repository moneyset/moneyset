import { NextResponse } from "next/server";

import { verifyTelegramWebAppInitData } from "@/lib/auth/telegram-verify";
import { establishTelegramSession } from "@/lib/auth/telegram-session";
import { logTelegramAuthEvent } from "@/lib/auth/telegram-telemetry";
import { readPartnerRefCookie } from "@/lib/partners/partner-codes";
import { hasExtendedAccess } from "@/lib/access/roles";
import { applyRateLimit } from "@/lib/ops/api-guard-helpers";
import { logOpsEvent } from "@/lib/ops/operational-events";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { env, sanitizeApiError } from "@/lib/services/shared/env";

export const dynamic = "force-dynamic";

type Body = Readonly<{ initData?: string; source?: string }>;

/** Telegram Mini App initData sign-in (POST JSON). */
export async function POST(req: Request) {
  const limited = applyRateLimit({ req, route: "auth/telegram", limit: 20, windowMs: 60_000 });
  if (limited) return limited;

  const botToken = env("TELEGRAM_BOT_TOKEN");
  if (!botToken) {
    return NextResponse.json(
      { ok: false, error: sanitizeApiError("Telegram bot not configured") },
      { status: 503 },
    );
  }

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid body" }, { status: 400 });
  }

  const initData = body.initData?.trim();
  const source = body.source?.trim() || "manual";
  if (!initData) {
    return NextResponse.json({ ok: false, error: "Missing initData" }, { status: 400 });
  }

  logTelegramAuthEvent("telegram_login_started", { source, channel: "mini_app" });

  const verified = verifyTelegramWebAppInitData(initData, botToken);
  if (!verified) {
    logOpsEvent("auth_failure", { route: "telegram", reason: "invalid_init" });
    logTelegramAuthEvent("telegram_login_failed", { source, reason: "invalid_init" });
    return NextResponse.json(
      { ok: false, error: sanitizeApiError("Invalid Telegram session") },
      { status: 401 },
    );
  }

  const admin = supabaseAdmin();
  if (!admin) {
    logTelegramAuthEvent("telegram_login_failed", { source, reason: "admin_unconfigured" });
    return NextResponse.json({ ok: false, error: "Supabase admin not configured" }, { status: 503 });
  }

  const partnerCode = await readPartnerRefCookie();
  const result = await establishTelegramSession(
    admin,
    verified.user.id,
    verified.user.username ?? null,
    partnerCode,
  );
  if (!result.ok || !result.session || !result.userId) {
    logTelegramAuthEvent("telegram_login_failed", {
      source,
      reason: (result.error ?? "session_failed").slice(0, 120),
    });
    return NextResponse.json(
      { ok: false, error: result.error ?? "Could not establish session" },
      { status: 502 },
    );
  }

  logTelegramAuthEvent("telegram_login_completed", {
    source,
    telegram_id: verified.user.id,
    is_new: Boolean(result.isNewUser),
    is_returning: Boolean(result.isReturning),
    premium: Boolean(result.profile && hasExtendedAccess(result.profile)),
  });

  if (result.isReturning) {
    logTelegramAuthEvent("telegram_account_restored", {
      source,
      telegram_id: verified.user.id,
      premium: Boolean(result.profile && hasExtendedAccess(result.profile)),
    });
  } else if (result.isNewUser) {
    logTelegramAuthEvent("telegram_account_linked", {
      source,
      telegram_id: verified.user.id,
    });
  }

  return NextResponse.json({
    ok: true,
    access_token: result.session.access_token,
    refresh_token: result.session.refresh_token,
    expires_at: result.session.expires_at,
    user: { id: result.userId, telegram_id: verified.user.id, username: verified.user.username ?? null },
    profile: result.profile,
    isNewUser: result.isNewUser,
    isReturning: result.isReturning,
  });
}
