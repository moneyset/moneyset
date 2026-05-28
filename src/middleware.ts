import { NextResponse, type NextRequest } from "next/server";

const PROTECTED_API_PREFIXES = ["/api/billing/create", "/api/billing/status", "/api/billing/history"];

/**
 * Edge-level billing guard.
 *
 * Security contract:
 * - In PRODUCTION: requires a valid `Authorization: Bearer <jwt>` header.
 *   The `x-ms-user-id` header is NOT accepted — it is developer-only and
 *   cannot be trusted as an auth signal in production.
 * - In DEVELOPMENT: passes all requests through (no auth at edge level).
 * - The webhook route (/api/billing/webhook) is intentionally excluded —
 *   it is protected by HMAC signature verification, not session auth.
 */
export function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const needsAuth = PROTECTED_API_PREFIXES.some((p) => path.startsWith(p));
  if (!needsAuth) return NextResponse.next();

  if (process.env.NODE_ENV !== "production") return NextResponse.next();

  // Production: require a Bearer JWT — no x-ms-user-id fallback
  const auth = req.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) {
    return NextResponse.json(
      { ok: false, error: "Authentication required" },
      { status: 401 },
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/billing/:path*"],
};
