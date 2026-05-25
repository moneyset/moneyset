import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-[70vh] flex-col items-center justify-center gap-6 px-6 text-center">
      <div className="space-y-2">
        <p className="font-mono text-[10px] font-medium uppercase tracking-[0.22em] text-ms-faint">
          MONEYSET
        </p>
        <p className="text-[32px] font-semibold tracking-tight text-ms-text">404</p>
        <p className="text-[13px] text-ms-muted">
          This page does not exist
          <span className="mx-2 text-ms-border/40">·</span>
          <span className="text-[12px] text-ms-faint">Страница не найдена</span>
        </p>
      </div>
      <Link
        href="/"
        className="rounded-ms-md border border-ms-border/30 px-5 py-2.5 text-[12px] font-medium text-ms-muted transition-colors hover:bg-ms-elevated/20 hover:text-ms-text"
      >
        Return to platform
      </Link>
    </main>
  );
}
