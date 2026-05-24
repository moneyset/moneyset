"use client";

import { useEffect } from "react";

import { useThemeStore } from "@/store/theme-store";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const applyToDocument = useThemeStore((s) => s.applyToDocument);
  const preference = useThemeStore((s) => s.preference);

  useEffect(() => {
    applyToDocument();
  }, [applyToDocument, preference]);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      useThemeStore.getState().applyToDocument();
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  return children;
}
