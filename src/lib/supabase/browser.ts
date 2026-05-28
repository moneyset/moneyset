import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

export { authCallbackUrl } from "@/lib/supabase/auth-routing";

let cached: SupabaseClient | null = null;

export function supabaseBrowser(): SupabaseClient | null {
  if (cached) return cached;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!url || !key) return null;
  cached = createBrowserClient(url, key);
  return cached;
}
