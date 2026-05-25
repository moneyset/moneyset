"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { supabaseBrowser } from "@/lib/supabase/browser";

type State = "loading" | "error";

/** Exchange OAuth / magic-link codes and return to the workspace. */
export default function AuthCallbackPage() {
  const router = useRouter();
  const [state, setState] = useState<State>("loading");

  useEffect(() => {
    const sb = supabaseBrowser();
    if (!sb) {
      router.replace("/");
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    const errorParam = params.get("error");

    if (errorParam) {
      setState("error");
      return;
    }

    void (async () => {
      if (code) {
        const { error } = await sb.auth.exchangeCodeForSession(code);
        if (error) {
          setState("error");
          return;
        }
      }
      router.replace("/");
    })();
  }, [router]);

  if (state === "error") {
    return (
      <div className="flex min-h-[60dvh] flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="font-mono text-[9px] font-medium uppercase tracking-[0.22em] text-ms-faint">
          MONEYSET
        </p>
        <p className="text-[13px] font-medium text-ms-text">Sign-in could not be completed</p>
        <p className="max-w-xs text-[11px] leading-relaxed text-ms-muted">
          The link may have expired or already been used. Please try signing in again.
        </p>
        <Link
          href="/"
          className="mt-2 rounded-ms-sm border border-ms-border/30 px-5 py-2.5 font-mono text-[9px] font-medium uppercase tracking-[0.18em] text-ms-muted transition-colors hover:border-ms-border/55 hover:bg-ms-elevated/20 hover:text-ms-text"
        >
          Back to MONEYSET
        </Link>
      </div>
    );
  }

  return (
    <div className="flex min-h-[60dvh] flex-col items-center justify-center gap-3 px-6 text-center">
      <p className="font-mono text-[9px] font-medium uppercase tracking-[0.22em] text-ms-faint">
        MONEYSET
      </p>
      <p className="text-[13px] text-ms-muted">Completing sign-in…</p>
      <p className="text-[11px] text-ms-faint">Завершение входа…</p>
    </div>
  );
}
