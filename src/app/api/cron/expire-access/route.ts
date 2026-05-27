import { NextResponse } from "next/server";

import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/**
 * Scheduled expiry job — the ONLY authorised path for expiry-driven DB mutations.
 *
 * Call this from a Vercel Cron Job, GitHub Actions cron, or external scheduler
 * at a regular interval (recommended: every 15 minutes).
 *
 * Authentication: requires `Authorization: Bearer <CRON_SECRET>` header.
 * CRON_SECRET must be set in Vercel Environment Variables.
 *
 * What it does:
 *  1. Downgrade expired premium_monthly subscriptions (premium_until in the past)
 *  2. Downgrade expired invitation windows (invitation_until in the past)
 *
 * What it does NOT do:
 *  - Touch founding_access profiles (founding access never expires)
 *  - Touch admin profiles
 *  - Modify payments table
 *  - Activate or upgrade any entitlement
 *
 * Why this is safe to run repeatedly:
 *  - Both queries are idempotent: a profile already at "free" matches no rows
 *  - The WHERE clauses are strictly additive guards
 */
export async function POST(req: Request) {
  // Authenticate the caller with CRON_SECRET
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) {
    return NextResponse.json(
      { ok: false, error: "CRON_SECRET is not configured on this server." },
      { status: 503 },
    );
  }

  const auth = req.headers.get("authorization");
  const token = auth?.startsWith("Bearer ") ? auth.slice(7).trim() : null;
  if (!token || token !== secret) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const admin = supabaseAdmin();
  if (!admin) {
    return NextResponse.json({ ok: false, error: "Database unavailable" }, { status: 503 });
  }

  const now = new Date().toISOString();
  const results: Record<string, unknown> = {};

  // ── 1. Expire premium_monthly subscriptions ──────────────────────────────
  // Conditions:
  //   - access_level is "premium" (not founding, not admin, not invitation)
  //   - founding_access is false or null (never expire founders)
  //   - premium_until is set and in the past
  const { data: expiredPremium, error: premiumErr } = await admin
    .from("profiles")
    .update({
      access_level: "free",
      access_tier: "free",
      role: "guest",
      subscription_status: "expired",
      premium_until: null,
      updated_at: now,
    })
    .eq("access_level", "premium")
    .eq("founding_access", false)
    .lt("premium_until", now)
    .not("premium_until", "is", null)
    .select("id");

  if (premiumErr) {
    console.error("[cron/expire-access] premium expiry error:", premiumErr.message);
    results.premiumExpiry = { ok: false, error: premiumErr.message };
  } else {
    results.premiumExpiry = { ok: true, expired: expiredPremium?.length ?? 0 };
  }

  // ── 2. Expire invitation windows ─────────────────────────────────────────
  // Conditions:
  //   - access_level is "invitation"
  //   - invitation_until is set and in the past
  const { data: expiredInvite, error: inviteErr } = await admin
    .from("profiles")
    .update({
      access_level: "free",
      access_tier: "free",
      role: "guest",
      subscription_status: "expired",
      invitation_until: null,
      updated_at: now,
    })
    .eq("access_level", "invitation")
    .lt("invitation_until", now)
    .not("invitation_until", "is", null)
    .select("id");

  if (inviteErr) {
    console.error("[cron/expire-access] invitation expiry error:", inviteErr.message);
    results.invitationExpiry = { ok: false, error: inviteErr.message };
  } else {
    results.invitationExpiry = { ok: true, expired: expiredInvite?.length ?? 0 };
  }

  return NextResponse.json({
    ok: true,
    ran_at: now,
    results,
  });
}
