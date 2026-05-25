import type { Session } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

import { telegramAuthEmail, telegramAuthPassword } from "@/lib/auth/telegram-credentials";
import { verifyTelegramWebAppInitData } from "@/lib/auth/telegram-verify";
import { roleFromProfile } from "@/lib/access/roles";
import { isFounderTelegramId } from "@/lib/access/founder";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { env } from "@/lib/services/shared/env";

export const dynamic = "force-dynamic";

type Body = Readonly<{ initData?: string }>;

export async function POST(req: Request) {
  const botToken = env("TELEGRAM_BOT_TOKEN");
  if (!botToken) {
    return NextResponse.json({ ok: false, error: "Telegram bot not configured" }, { status: 503 });
  }

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid body" }, { status: 400 });
  }

  const initData = body.initData?.trim();
  if (!initData) {
    return NextResponse.json({ ok: false, error: "Missing initData" }, { status: 400 });
  }

  const verified = verifyTelegramWebAppInitData(initData, botToken);
  if (!verified) {
    return NextResponse.json({ ok: false, error: "Invalid Telegram session" }, { status: 401 });
  }

  const admin = supabaseAdmin();
  if (!admin) {
    return NextResponse.json({ ok: false, error: "Supabase admin not configured" }, { status: 503 });
  }

  const tgId = verified.user.id;
  const email = telegramAuthEmail(tgId);
  const password = telegramAuthPassword(tgId);

  let session: Session | null = null;
  let userId: string | null = null;

  const signIn = await admin.auth.signInWithPassword({ email, password });
  if (signIn.data.session) {
    session = signIn.data.session;
    userId = signIn.data.user?.id ?? null;
  } else {
    const created = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        telegram_id: tgId,
        telegram_username: verified.user.username ?? null,
        auth_provider: "telegram",
      },
    });
    if (created.error && !created.error.message.toLowerCase().includes("already")) {
      return NextResponse.json({ ok: false, error: created.error.message }, { status: 502 });
    }
    userId = created.data.user?.id ?? null;
    const retry = await admin.auth.signInWithPassword({ email, password });
    session = retry.data.session;
    userId = userId ?? retry.data.user?.id ?? null;
  }

  if (!session || !userId) {
    return NextResponse.json({ ok: false, error: "Could not establish session" }, { status: 502 });
  }

  const isFounder = isFounderTelegramId(tgId);

  await admin.from("profiles").upsert(
    {
      id: userId,
      telegram_user_id: tgId,
      updated_at: new Date().toISOString(),
      // Permanent founder accounts — access never expires
      ...(isFounder
        ? {
            access_level: "founding",
            founding_access: true,
            premium_until: null,
          }
        : {}),
    },
    { onConflict: "id" },
  );

  const { data: profileRow } = await admin.from("profiles").select("*").eq("id", userId).maybeSingle();
  const profile = roleFromProfile(profileRow ?? {});

  return NextResponse.json({
    ok: true,
    access_token: session.access_token,
    refresh_token: session.refresh_token,
    expires_at: session.expires_at,
    user: { id: userId, telegram_id: tgId, username: verified.user.username ?? null },
    profile,
  });
}
