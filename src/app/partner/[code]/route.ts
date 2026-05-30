import { NextResponse } from "next/server";

import {
  normalizePartnerCode,
  PARTNER_REF_COOKIE,
  PARTNER_REF_MAX_AGE_SEC,
} from "@/lib/partners/partner-codes";
import { partnerCodeExists, recordPartnerVisit } from "@/lib/partners/partner-attribution";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** Capture partner referral and redirect to homepage. */
export async function GET(
  request: Request,
  context: { params: Promise<{ code: string }> },
) {
  const { code: raw } = await context.params;
  const code = normalizePartnerCode(raw);
  const origin = new URL(request.url).origin;
  const response = NextResponse.redirect(new URL("/", origin));

  if (!code) return response;

  const admin = supabaseAdmin();
  if (!admin) return response;

  if (!(await partnerCodeExists(admin, code))) return response;

  response.cookies.set(PARTNER_REF_COOKIE, code, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: PARTNER_REF_MAX_AGE_SEC,
  });

  try {
    await recordPartnerVisit(admin, code);
  } catch (e) {
    console.error("[partner/visit] failed:", e instanceof Error ? e.message : e);
  }

  return response;
}
