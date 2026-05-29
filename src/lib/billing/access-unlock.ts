import type { SupabaseClient } from "@supabase/supabase-js";

import { billingProduct, type BillingProductId } from "@/lib/billing/catalog";
import { ensureProfileRow } from "@/lib/supabase/ensure-profile";

export type ProfileUnlockPatch = Readonly<Record<string, unknown>>;

export function profilePatchForProduct(productId: BillingProductId): ProfileUnlockPatch {
  const product = billingProduct(productId);
  if (!product) return {};

  const now = new Date().toISOString();

  if (product.kind === "founding") {
    return {
      role: "premium",
      access_tier: "premium",
      access_level: "founding",
      subscription_status: "founding",
      founding_access: true,
      premium_until: null,
      updated_at: now,
    };
  }

  const days = product.subscriptionDays ?? 30;
  const premiumUntil = new Date(Date.now() + days * 24 * 60 * 60_000).toISOString();
  return {
    role: "premium",
    access_tier: "premium",
    access_level: "premium",
    subscription_status: "active",
    founding_access: false,
    premium_until: premiumUntil,
    updated_at: now,
  };
}

export async function unlockProfileForProduct(
  admin: SupabaseClient,
  userId: string,
  productId: BillingProductId,
  orderId?: string,
): Promise<{ ok: boolean; error?: string }> {
  if (orderId) {
    const { data: existing } = await admin
      .from("profiles")
      .select("last_payment_order_id")
      .eq("id", userId)
      .maybeSingle();
    if (existing?.last_payment_order_id === orderId) return { ok: true };
  }

  const ensured = await ensureProfileRow(admin, userId);
  if (!ensured.ok) return { ok: false, error: ensured.error };

  let patch = profilePatchForProduct(productId);

  if (productId === "premium_monthly") {
    const product = billingProduct(productId);
    const days = product?.subscriptionDays ?? 30;
    const { data: row } = await admin
      .from("profiles")
      .select("premium_until")
      .eq("id", userId)
      .maybeSingle();
    const existingUntil = row?.premium_until ? new Date(row.premium_until).getTime() : 0;
    const baseMs = Math.max(Date.now(), existingUntil);
    patch = {
      ...patch,
      premium_until: new Date(baseMs + days * 24 * 60 * 60_000).toISOString(),
    };
  }

  patch = {
    ...patch,
    ...(orderId ? { last_payment_order_id: orderId } : {}),
  };
  const { error } = await admin.from("profiles").update(patch).eq("id", userId);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
