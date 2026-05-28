import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { envFirst } from "@/lib/services/shared/env";

let admin: SupabaseClient | null = null;

/** Service-role client — server routes / webhooks only. */
export function supabaseAdmin(): SupabaseClient | null {
  if (admin) return admin;
  const url = envFirst("NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_URL")?.trim();
  const key = envFirst("SUPABASE_SERVICE_ROLE_KEY", "SUPABASE_SERVICE_KEY")?.trim();
  if (!url || !key) return null;
  admin = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  return admin;
}
