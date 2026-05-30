"use client";

import type { ErrorInfo, ReactNode } from "react";
import { Component } from "react";

type Props = {
  children: ReactNode;
  label: string;
  /** When this value changes, retry rendering after a prior failure. */
  resetKey?: string | number | boolean;
};

type State = { error: Error | null };

/** Prevents auth/checkout/profile modal crashes from tearing down the root layout. */
export class ClientModalErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidUpdate(prevProps: Props) {
    if (this.state.error && prevProps.resetKey !== this.props.resetKey) {
      this.setState({ error: null });
    }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(`[MONEYSET] ${this.props.label} render failure`, error.message, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="rounded-ms-xl border border-ms-border/40 bg-ms-surface/60 px-4 py-5 text-center">
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ms-faint">MONEYSET</p>
          <p className="mt-2 text-[13px] leading-relaxed text-ms-muted">
            Something interrupted this panel. Close and open it again.
          </p>
        </div>
      );
    }
    return this.props.children;
  }
}
