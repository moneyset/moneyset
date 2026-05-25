import type { SupabaseClient } from "@supabase/supabase-js";

/** Downgrade expired monthly premium profiles (mirrors invitation expiry). */
export async function expirePremiumIfNeeded(admin: SupabaseClient, userId: string): Promise<void> {
  const { data } = await admin
    .from("profiles")
    .select("access_level, founding_access, premium_until, subscription_status, last_payment_order_id")
    .eq("id", userId)
    .maybeSingle();

  if (!data || data.founding_access || data.access_level === "founding" || data.access_level === "admin") return;
  if (!data.premium_until) return;
  if (new Date(data.premium_until).getTime() > Date.now()) return;

  await admin
    .from("profiles")
    .update({
      access_level: "free",
      access_tier: "free",
      role: "guest",
      subscription_status: "expired",
      premium_until: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);
}
