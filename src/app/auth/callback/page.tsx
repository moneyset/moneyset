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
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="text-[13px] font-medium text-ms-text">
          Sign-in could not be completed
          <span className="mx-2 text-ms-border/50">·</span>
          <span className="text-ms-muted">Вход не удался</span>
        </p>
        <p className="max-w-xs text-[11px] leading-relaxed text-ms-faint">
          The link may have expired or already been used. Please try signing in again.
        </p>
        <Link
          href="/"
          className="mt-2 rounded-ms-md border border-ms-border/30 px-4 py-2 text-[11px] font-medium text-ms-muted transition-colors hover:bg-ms-elevated/20 hover:text-ms-text"
        >
          Back to MONEYSET
        </Link>
      </div>
    );
  }

  return (
    <div className="flex min-h-[40vh] items-center justify-center px-6 text-center">
      <p className="text-[13px] text-ms-muted">
        Completing sign-in
        <span className="mx-2 text-ms-border/40">·</span>
        <span className="text-[12px] text-ms-faint">Завершение входа…</span>
      </p>
    </div>
  );
}
