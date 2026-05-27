import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Resolve the authenticated user ID from an incoming server-side Request.
 *
 * Production: only a valid Supabase Bearer JWT is accepted.
 * Development: additionally accepts the `x-ms-user-id` header for local testing
 *              without a full auth flow.
 */
export async function resolveRequestUserId(
  req: Request,
  admin?: SupabaseClient | null,
): Promise<string | null> {
  const auth = req.headers.get("authorization");
  const token = auth?.startsWith("Bearer ") ? auth.slice(7).trim() : null;
  if (token && admin) {
    const { data, error } = await admin.auth.getUser(token);
    if (!error && data.user?.id) return data.user.id;
  }

  // Development convenience only — never in production.
  if (process.env.NODE_ENV !== "production") {
    const headerId = req.headers.get("x-ms-user-id")?.trim();
    if (headerId) return headerId;
  }

  return null;
}

/**
 * Build auth headers for client → server API calls.
 *
 * In production, only the Bearer token is sent.
 * The `x-ms-user-id` header is omitted — the server ignores it in production,
 * and sending it would unnecessarily leak the user UUID in request headers.
 */
export function authHeadersForUser(userId: string | null, accessToken?: string | null): HeadersInit {
  const headers: Record<string, string> = {};
  if (accessToken) {
    headers["Authorization"] = `Bearer ${accessToken}`;
  } else if (userId && process.env.NODE_ENV !== "production") {
    // Development fallback only
    headers["x-ms-user-id"] = userId;
  }
  return headers;
}
