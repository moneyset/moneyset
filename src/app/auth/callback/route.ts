import { NextResponse } from "next/server";

import { attachPartnerSignup } from "@/lib/partners/partner-attribution";
import { readPartnerRefCookie } from "@/lib/partners/partner-codes";
import { sanitizeAuthNextPath } from "@/lib/supabase/auth-routing";
import { supabaseServer } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Supabase OAuth / magic-link callback (App Router).
 * Exchanges ?code= for a session cookie, then redirects into the workspace.
 */
export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const origin = requestUrl.origin;
  const code = requestUrl.searchParams.get("code");
  const next = sanitizeAuthNextPath(requestUrl.searchParams.get("next"));
  const oauthError =
    requestUrl.searchParams.get("error_description") ?? requestUrl.searchParams.get("error");

  if (oauthError) {
    return NextResponse.redirect(`${origin}/auth?error=${encodeURIComponent(oauthError)}`);
  }

  if (!code) {
    return NextResponse.redirect(`${origin}/auth?error=${encodeURIComponent("missing_code")}`);
  }

  const supabase = await supabaseServer();
  if (!supabase) {
    return NextResponse.redirect(`${origin}/auth?error=${encodeURIComponent("auth_unconfigured")}`);
  }

  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(`${origin}/auth?error=${encodeURIComponent(error.message)}`);
  }

  const admin = (await import("@/lib/supabase/admin")).supabaseAdmin();
  const { data: userData } = await supabase.auth.getUser();
  const partnerCode = await readPartnerRefCookie();
  if (admin && userData.user?.id && partnerCode) {
    const createdAt = userData.user.created_at ? Date.parse(userData.user.created_at) : 0;
    const isRecentSignup = createdAt > 0 && Date.now() - createdAt < 5 * 60_000;
    if (isRecentSignup) {
      try {
        await attachPartnerSignup(admin, userData.user.id, partnerCode);
      } catch (e) {
        console.error("[auth/callback] partner signup attribution failed:", e instanceof Error ? e.message : e);
      }
    }
  }

  return NextResponse.redirect(`${origin}${next}`);
}
