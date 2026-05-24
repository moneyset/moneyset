import { NextResponse, type NextRequest } from "next/server";

const PROTECTED_API_PREFIXES = ["/api/billing/create", "/api/billing/status"];

/**
 * Light API guard — billing routes expect auth header in production.
 * App routes stay open; guest mode is client-side.
 */
export function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const needsAuth = PROTECTED_API_PREFIXES.some((p) => path.startsWith(p));
  if (!needsAuth) return NextResponse.next();

  if (process.env.NODE_ENV === "development") return NextResponse.next();

  const hasUser =
    req.headers.get("x-ms-user-id")?.trim() ||
    req.headers.get("authorization")?.startsWith("Bearer ");
  if (!hasUser) {
    return NextResponse.json({ ok: false, error: "Authentication required" }, { status: 401 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/billing/:path*"],
};
