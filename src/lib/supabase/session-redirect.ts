import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type { Session } from "@supabase/supabase-js";

/**
 * Set Supabase auth cookies on the redirect response itself.
 * Required in App Router route handlers — cookieStore.set alone is dropped on redirect.
 */
export async function redirectWithSupabaseSession(
  session: Pick<Session, "access_token" | "refresh_token">,
  redirectTo: string,
  errorRedirect = "/auth?error=telegram_session_failed",
): Promise<NextResponse> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!url || !key) {
    return NextResponse.redirect(errorRedirect);
  }

  const cookieStore = await cookies();
  const response = NextResponse.redirect(redirectTo);

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  const { error } = await supabase.auth.setSession({
    access_token: session.access_token,
    refresh_token: session.refresh_token,
  });

  if (error) {
    return NextResponse.redirect(errorRedirect);
  }

  return response;
}
