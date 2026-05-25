"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { supabaseBrowser } from "@/lib/supabase/browser";

/** Exchange OAuth / magic-link codes and return to the workspace. */
export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const sb = supabaseBrowser();
    if (!sb) {
      router.replace("/");
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");

    void (async () => {
      if (code) {
        await sb.auth.exchangeCodeForSession(code).catch(() => null);
      }
      router.replace("/");
    })();
  }, [router]);

  return (
    <div className="flex min-h-[40vh] items-center justify-center px-6 text-center text-[13px] text-ms-muted">
      Completing sign-in…
    </div>
  );
}
