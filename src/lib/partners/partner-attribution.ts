import type { SupabaseClient } from "@supabase/supabase-js";

import { billingProduct, type BillingProductId } from "@/lib/billing/catalog";
import { normalizePartnerCode } from "@/lib/partners/partner-codes";

export async function partnerCodeExists(admin: SupabaseClient, code: string): Promise<boolean> {
  const { data } = await admin
    .from("founding_partners")
    .select("code")
    .eq("code", code)
    .eq("disabled", false)
    .maybeSingle();
  return Boolean(data?.code);
}

export async function recordPartnerVisit(admin: SupabaseClient, code: string): Promise<void> {
  const partnerCode = normalizePartnerCode(code);
  if (!partnerCode) return;
  if (!(await partnerCodeExists(admin, partnerCode))) return;

  await admin.from("partner_referrals").insert({
    partner_code: partnerCode,
    user_id: null,
    purchase_amount: null,
    purchase_date: null,
  });
}

export async function attachPartnerSignup(
  admin: SupabaseClient,
  userId: string,
  partnerCodeRaw: string | null | undefined,
): Promise<void> {
  const partnerCode = normalizePartnerCode(partnerCodeRaw);
  if (!partnerCode) return;
  if (!(await partnerCodeExists(admin, partnerCode))) return;

  const { data: profile } = await admin
    .from("profiles")
    .select("partner_code")
    .eq("id", userId)
    .maybeSingle();

  if (profile?.partner_code) return;

  const { data: existing } = await admin
    .from("partner_referrals")
    .select("id")
    .eq("partner_code", partnerCode)
    .eq("user_id", userId)
    .is("purchase_amount", null)
    .limit(1)
    .maybeSingle();

  if (existing?.id) return;

  await admin.from("profiles").update({ partner_code: partnerCode, updated_at: new Date().toISOString() }).eq("id", userId);
  await admin.from("partner_referrals").insert({
    partner_code: partnerCode,
    user_id: userId,
    purchase_amount: null,
    purchase_date: null,
  });
}

export async function recordPartnerPurchase(
  admin: SupabaseClient,
  userId: string,
  productId: BillingProductId,
  paidAmount: number,
): Promise<void> {
  const product = billingProduct(productId);
  if (!product || product.kind !== "founding") return;

  const { data: profile } = await admin
    .from("profiles")
    .select("partner_code")
    .eq("id", userId)
    .maybeSingle();

  const partnerCode = normalizePartnerCode(profile?.partner_code ?? null);
  if (!partnerCode) return;

  const { data: existing } = await admin
    .from("partner_referrals")
    .select("id")
    .eq("partner_code", partnerCode)
    .eq("user_id", userId)
    .not("purchase_amount", "is", null)
    .limit(1)
    .maybeSingle();

  if (existing?.id) return;

  const now = new Date().toISOString();
  await admin.from("partner_referrals").insert({
    partner_code: partnerCode,
    user_id: userId,
    purchase_amount: paidAmount,
    purchase_date: now,
  });
}

export type PartnerDashboardRow = Readonly<{
  code: string;
  label: string | null;
  commissionRate: number;
  visits: number;
  signups: number;
  purchases: number;
  revenue: number;
  commission: number;
}>;

export async function loadPartnerDashboard(admin: SupabaseClient): Promise<PartnerDashboardRow[]> {
  const { data: partners } = await admin
    .from("founding_partners")
    .select("code, label, commission_rate")
    .order("created_at", { ascending: false });

  if (!partners?.length) return [];

  const { data: referrals } = await admin
    .from("partner_referrals")
    .select("partner_code, user_id, purchase_amount");

  const byCode = new Map<
    string,
    { visits: number; signups: number; purchases: number; revenue: number }
  >();

  for (const row of referrals ?? []) {
    const code = row.partner_code as string;
    const bucket = byCode.get(code) ?? { visits: 0, signups: 0, purchases: 0, revenue: 0 };
    if (row.purchase_amount != null) {
      bucket.purchases += 1;
      bucket.revenue += Number(row.purchase_amount) || 0;
    } else if (row.user_id) {
      bucket.signups += 1;
    } else {
      bucket.visits += 1;
    }
    byCode.set(code, bucket);
  }

  return partners.map((p) => {
    const stats = byCode.get(p.code) ?? { visits: 0, signups: 0, purchases: 0, revenue: 0 };
    const rate = Number(p.commission_rate) || 0.5;
    return {
      code: p.code,
      label: p.label,
      commissionRate: rate,
      visits: stats.visits,
      signups: stats.signups,
      purchases: stats.purchases,
      revenue: stats.revenue,
      commission: stats.revenue * rate,
    };
  });
}
