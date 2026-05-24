"use client";

import { useEffect } from "react";

import { Button } from "@/components/ui/button";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="mx-auto flex min-h-[60vh] max-w-2xl flex-col justify-center gap-4 px-6 py-14">
      <div className="rounded-ms-xl border border-ms-border bg-ms-surface/40 p-6 shadow-ms-xs">
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-ms-faint">System</p>
        <h1 className="mt-2 text-balance font-mono text-[14px] font-semibold uppercase tracking-[0.14em] text-ms-text">
          Something interrupted the workspace
        </h1>
        <p className="mt-3 text-[13px] leading-relaxed text-ms-muted">
          The interface hit an unexpected state. Reset will re-run the segment without losing your local data.
        </p>
        {process.env.NODE_ENV !== "production" ? (
          <div className="mt-4 rounded-ms-lg border border-ms-border bg-ms-elevated/25 px-4 py-3">
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-ms-faint">Dev diagnostic</p>
            <p className="mt-2 font-mono text-[11px] leading-relaxed text-ms-text">{error.message || "(no message)"}</p>
            {error.digest ? (
              <p className="mt-1 font-mono text-[10px] tracking-[0.12em] text-ms-faint">digest {error.digest}</p>
            ) : null}
            {error.stack ? (
              <pre className="mt-3 max-h-48 overflow-auto rounded-ms-md border border-ms-border bg-ms-canvas/40 p-3 text-[11px] leading-relaxed text-ms-faint">
                {error.stack}
              </pre>
            ) : null}
          </div>
        ) : null}
        <div className="mt-5 flex flex-wrap gap-2">
          <Button type="button" variant="cognition" onClick={reset}>
            Reset
          </Button>
          <Button type="button" variant="ghost" onClick={() => window.location.reload()}>
            Reload
          </Button>
        </div>
      </div>
    </main>
  );
}

