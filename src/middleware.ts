import { NextResponse, type NextRequest } from "next/server";

import { updateSupabaseSession } from "@/lib/supabase/middleware";

const PROTECTED_API_PREFIXES = ["/api/billing/create", "/api/billing/status", "/api/billing/history"];

export async function middleware(req: NextRequest) {
  const response = await updateSupabaseSession(req);

  const path = req.nextUrl.pathname;
  const needsAuth = PROTECTED_API_PREFIXES.some((p) => path.startsWith(p));
  if (!needsAuth) return response;

  if (process.env.NODE_ENV !== "production") return response;

  const auth = req.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) {
    return NextResponse.json(
      { ok: false, error: "Authentication required" },
      { status: 401 },
    );
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
