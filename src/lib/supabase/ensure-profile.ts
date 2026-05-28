import type { SupabaseClient } from "@supabase/supabase-js";

/** Ensure a profile row exists for an authenticated user (service role only). */
export async function ensureProfileRow(
  admin: SupabaseClient,
  userId: string,
  email?: string | null,
): Promise<{ ok: boolean; error?: string }> {
  const { data: existing, error: readErr } = await admin
    .from("profiles")
    .select("id")
    .eq("id", userId)
    .maybeSingle();

  if (readErr) return { ok: false, error: readErr.message };
  if (existing) return { ok: true };

  const { error: insertErr } = await admin.from("profiles").upsert(
    {
      id: userId,
      email: email ?? null,
      role: "guest",
      access_tier: "free",
      access_level: "free",
      subscription_status: "inactive",
      founding_access: false,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" },
  );

  if (insertErr) return { ok: false, error: insertErr.message };
  return { ok: true };
}
