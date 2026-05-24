"use client";

import { create } from "zustand";

type ShellState = {
  mobileNavOpen: boolean;
  sidebarCollapsed: boolean;
  setMobileNavOpen: (v: boolean) => void;
  toggleMobileNav: () => void;
  toggleSidebarCollapsed: () => void;
};

export const useShellStore = create<ShellState>((set) => ({
  mobileNavOpen: false,
  sidebarCollapsed: false,
  setMobileNavOpen: (v) => set({ mobileNavOpen: v }),
  toggleMobileNav: () => set((s) => ({ mobileNavOpen: !s.mobileNavOpen })),
  toggleSidebarCollapsed: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
}));
