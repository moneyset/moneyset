import type { Session, SupabaseClient } from "@supabase/supabase-js";

import { attachPartnerSignup } from "@/lib/partners/partner-attribution";
import { normalizePartnerCode } from "@/lib/partners/partner-codes";
import type { ProfileAccess } from "@/lib/access/roles";
import { roleFromProfile } from "@/lib/access/roles";
import { isFounderTelegramId } from "@/lib/access/founder";
import { telegramAuthEmail, telegramAuthPassword } from "@/lib/auth/telegram-credentials";
import { ensureProfileRow } from "@/lib/supabase/ensure-profile";

export type TelegramSessionResult = Readonly<{
  ok: boolean;
  session?: Session;
  userId?: string;
  profile?: ProfileAccess;
  isNewUser?: boolean;
  isReturning?: boolean;
  error?: string;
}>;

/** Create or sign in Supabase user for a verified Telegram identity. */
export async function establishTelegramSession(
  admin: SupabaseClient,
  tgId: number,
  username?: string | null,
  partnerCodeRaw?: string | null,
): Promise<TelegramSessionResult> {
  const email = telegramAuthEmail(tgId);
  const password = telegramAuthPassword(tgId);

  let session: Session | null = null;
  let userId: string | null = null;
  let isNewUser = false;
  let isReturning = false;

  const signIn = await admin.auth.signInWithPassword({ email, password });
  if (signIn.data.session) {
    session = signIn.data.session;
    userId = signIn.data.user?.id ?? null;
    isReturning = true;
  } else {
    const created = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        telegram_id: tgId,
        telegram_username: username ?? null,
        auth_provider: "telegram",
      },
    });
    if (created.error && !created.error.message.toLowerCase().includes("already")) {
      return { ok: false, error: created.error.message };
    }
    isNewUser = !created.error;
    userId = created.data.user?.id ?? null;
    const retry = await admin.auth.signInWithPassword({ email, password });
    session = retry.data.session;
    userId = userId ?? retry.data.user?.id ?? null;
  }

  if (!session || !userId) {
    return { ok: false, error: "Could not establish session" };
  }

  await admin.auth.admin.updateUserById(userId, {
    user_metadata: {
      telegram_id: tgId,
      telegram_username: username ?? null,
      auth_provider: "telegram",
    },
  });

  const isFounder = isFounderTelegramId(tgId);
  const ensured = await ensureProfileRow(admin, userId, email);
  if (!ensured.ok) {
    return { ok: false, error: ensured.error ?? "profile_sync_failed" };
  }

  await admin.from("profiles").upsert(
    {
      id: userId,
      email,
      telegram_user_id: tgId,
      updated_at: new Date().toISOString(),
      ...(isFounder
        ? {
            role: "premium",
            access_tier: "premium",
            access_level: "founding",
            subscription_status: "founding",
            founding_access: true,
            premium_until: null,
          }
        : {}),
    },
    { onConflict: "id" },
  );

  const { data: profileRow } = await admin.from("profiles").select("*").eq("id", userId).maybeSingle();
  const profile = roleFromProfile(profileRow ?? {});

  if (isNewUser) {
    try {
      await attachPartnerSignup(admin, userId, normalizePartnerCode(partnerCodeRaw));
    } catch (e) {
      console.error("[telegram-session] partner signup attribution failed:", e instanceof Error ? e.message : e);
    }
  }

  return { ok: true, session, userId, profile, isNewUser, isReturning };
}
