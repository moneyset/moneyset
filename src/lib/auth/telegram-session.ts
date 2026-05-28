import type { Session, SupabaseClient } from "@supabase/supabase-js";

import { roleFromProfile } from "@/lib/access/roles";
import type { ProfileAccess } from "@/lib/access/roles";
import { isFounderTelegramId } from "@/lib/access/founder";
import { telegramAuthEmail, telegramAuthPassword } from "@/lib/auth/telegram-credentials";

export type TelegramSessionResult = Readonly<{
  ok: boolean;
  session?: Session;
  userId?: string;
  profile?: ProfileAccess;
  error?: string;
}>;

/** Create or sign in Supabase user for a verified Telegram identity. */
export async function establishTelegramSession(
  admin: SupabaseClient,
  tgId: number,
  username?: string | null,
): Promise<TelegramSessionResult> {
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
        telegram_username: username ?? null,
        auth_provider: "telegram",
      },
    });
    if (created.error && !created.error.message.toLowerCase().includes("already")) {
      return { ok: false, error: created.error.message };
    }
    userId = created.data.user?.id ?? null;
    const retry = await admin.auth.signInWithPassword({ email, password });
    session = retry.data.session;
    userId = userId ?? retry.data.user?.id ?? null;
  }

  if (!session || !userId) {
    return { ok: false, error: "Could not establish session" };
  }

  const isFounder = isFounderTelegramId(tgId);

  await admin.from("profiles").upsert(
    {
      id: userId,
      telegram_user_id: tgId,
      updated_at: new Date().toISOString(),
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

  return { ok: true, session, userId, profile };
}
