"use client";

import { create } from "zustand";

type UpgradeModalState = {
  open: boolean;
  setOpen: (open: boolean) => void;
  openUpgrade: () => void;
  closeUpgrade: () => void;
};

export const useUpgradeModalStore = create<UpgradeModalState>((set) => ({
  open: false,
  setOpen: (open) => set({ open }),
  openUpgrade: () => set({ open: true }),
  closeUpgrade: () => set({ open: false }),
}));

