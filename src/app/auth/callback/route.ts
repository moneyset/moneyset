import { NextResponse } from "next/server";

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

  return NextResponse.redirect(`${origin}${next}`);
}
