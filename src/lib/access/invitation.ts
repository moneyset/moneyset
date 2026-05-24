import type { SupabaseClient } from "@supabase/supabase-js";

export const DEFAULT_INVITATION_DAYS = 7;

export type InvitationCodeRow = Readonly<{
  code: string;
  label: string | null;
  duration_days: number;
  code_expires_at: string | null;
  max_uses: number;
  use_count: number;
  disabled: boolean;
}>;

export function normalizeInviteCode(raw: string): string {
  return raw.trim().toUpperCase().replace(/\s+/g, "-");
}

export function invitationUntilFromDays(days: number): string {
  return new Date(Date.now() + days * 24 * 60 * 60_000).toISOString();
}

export async function redeemInvitationCode(
  admin: SupabaseClient,
  userId: string,
  rawCode: string,
): Promise<{ ok: true; invitationUntil: string } | { ok: false; error: string }> {
  const code = normalizeInviteCode(rawCode);
  if (!code || code.length < 4) return { ok: false, error: "Invalid invitation code" };

  const { data: row, error: fetchErr } = await admin
    .from("invitation_codes")
    .select("*")
    .eq("code", code)
    .maybeSingle();

  if (fetchErr) return { ok: false, error: fetchErr.message };
  if (!row) return { ok: false, error: "Invitation code not found" };

  const invite = row as InvitationCodeRow;
  if (invite.disabled) return { ok: false, error: "Invitation code is disabled" };
  if (invite.code_expires_at && new Date(invite.code_expires_at).getTime() < Date.now()) {
    return { ok: false, error: "Invitation code has expired" };
  }
  if (invite.use_count >= invite.max_uses) return { ok: false, error: "Invitation code fully used" };

  const { data: existing } = await admin
    .from("invitation_redemptions")
    .select("id")
    .eq("code", code)
    .eq("user_id", userId)
    .maybeSingle();
  if (existing) return { ok: false, error: "You have already used this invitation" };

  const days = invite.duration_days > 0 ? invite.duration_days : DEFAULT_INVITATION_DAYS;
  const invitationUntil = invitationUntilFromDays(days);

  const { error: profileErr } = await admin
    .from("profiles")
    .update({
      access_level: "invitation",
      access_tier: "premium",
      role: "premium",
      subscription_status: "trial",
      founding_access: false,
      invitation_until: invitationUntil,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);

  if (profileErr) return { ok: false, error: profileErr.message };

  const { error: redemptionErr } = await admin.from("invitation_redemptions").insert({
    code,
    user_id: userId,
    invitation_until: invitationUntil,
  });
  if (redemptionErr) return { ok: false, error: redemptionErr.message };

  await admin
    .from("invitation_codes")
    .update({ use_count: invite.use_count + 1 })
    .eq("code", code);

  return { ok: true, invitationUntil };
}

export async function expireInvitationIfNeeded(admin: SupabaseClient, userId: string): Promise<void> {
  const { data } = await admin.from("profiles").select("access_level, invitation_until").eq("id", userId).maybeSingle();
  if (!data || data.access_level !== "invitation" || !data.invitation_until) return;
  if (new Date(data.invitation_until).getTime() > Date.now()) return;
  await admin
    .from("profiles")
    .update({
      access_level: "free",
      access_tier: "free",
      role: "guest",
      subscription_status: "expired",
      invitation_until: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);
}
