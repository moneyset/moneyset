import type { SupabaseClient } from "@supabase/supabase-js";

/** Resolve authenticated user id — Bearer JWT in production; dev may use x-ms-user-id. */
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

  if (process.env.NODE_ENV !== "production") {
    const headerId = req.headers.get("x-ms-user-id")?.trim();
    if (headerId) return headerId;
  }

  return null;
}

export function authHeadersForUser(userId: string | null, accessToken?: string | null): HeadersInit {
  const headers: Record<string, string> = {};
  if (userId) headers["x-ms-user-id"] = userId;
  if (accessToken) headers["Authorization"] = `Bearer ${accessToken}`;
  return headers;
}
