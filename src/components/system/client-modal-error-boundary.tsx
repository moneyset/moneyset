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
    if (this.state.error) return null;
    return this.props.children;
  }
}
