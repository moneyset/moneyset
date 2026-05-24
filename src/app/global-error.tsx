"use client";

import { useEffect } from "react";

import { Button } from "@/components/ui/button";

export default function GlobalError({ error }: { error: Error & { digest?: string } }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body className="bg-ms-canvas text-ms-text">
        <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center gap-4 px-6 py-14">
          <div className="rounded-ms-xl border border-ms-border bg-ms-surface/40 p-6 shadow-ms-xs">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-ms-faint">System</p>
            <h1 className="mt-2 text-balance font-mono text-[14px] font-semibold uppercase tracking-[0.14em] text-ms-text">
              Critical render failure
            </h1>
            <p className="mt-3 text-[13px] leading-relaxed text-ms-muted">
              A global error prevented the app shell from mounting. Reload will restart the session.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <Button type="button" variant="cognition" onClick={() => window.location.reload()}>
                Reload
              </Button>
            </div>
          </div>
        </main>
      </body>
    </html>
  );
}

