export default function CognitionLoading() {
  return (
    <div
      className="flex min-h-[40vh] items-center justify-center"
      aria-label="Loading"
      role="status"
    >
      <div className="flex flex-col items-center gap-3">
        <div className="size-1.5 animate-pulse rounded-full bg-ms-cognition/60" />
        <p className="font-mono text-[9px] font-medium uppercase tracking-[0.22em] text-ms-faint">
          Loading
        </p>
      </div>
    </div>
  );
}
