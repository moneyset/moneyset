"use client";

import type { ErrorInfo, ReactNode } from "react";
import { Component } from "react";

import { pickLocale } from "@/lib/i18n/cognition-dict";
import { useUiPrefsStore } from "@/store/ui-prefs-store";

type Props = { children: ReactNode };

type State = { error: Error | null };

/** Isolates surface render failures so shell chrome, nav, and feeds keep working. */
export class CognitionSurfaceErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(_error: Error, _info: ErrorInfo) {}

  render() {
    if (this.state.error) {
      return <CognitionSurfaceFallback error={this.state.error} onReset={() => this.setState({ error: null })} />;
    }
    return this.props.children;
  }
}

function CognitionSurfaceFallback({ error, onReset }: { error: Error; onReset: () => void }) {
  const locale = useUiPrefsStore((s) => s.uiLocale);
  return (
    <div
      role="alert"
      className="mx-auto max-w-lg rounded-ms-xl border border-ms-border/30 bg-ms-elevated/20 px-4 py-6 sm:px-5"
    >
      <p className="text-[11px] font-semibold text-ms-text">
        {pickLocale(locale, "Surface recovery", "Восстановление поверхности")}
      </p>
      <p className="mt-2 text-[11px] leading-relaxed text-ms-muted">
        {pickLocale(
          locale,
          "This workspace hit a render error. The rest of the app stays active — reset to retry.",
          "Ошибка рендера в этой поверхности. Остальное приложение активно — сброс для повтора.",
        )}
      </p>
      <p className="mt-3 font-mono text-[10px] leading-snug text-ms-faint break-all">{error.message}</p>
      <button
        type="button"
        onClick={onReset}
        className="ms-focus-ring mt-4 rounded-ms-md border border-ms-border/35 bg-ms-surface/25 px-3 py-2 text-[11px] font-medium text-ms-text transition-colors hover:bg-ms-surface/40"
      >
        {pickLocale(locale, "Reset surface", "Сбросить поверхность")}
      </button>
    </div>
  );
}
