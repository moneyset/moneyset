"use client";

import { create } from "zustand";

type AuthModalState = {
  open: boolean;
  setOpen: (open: boolean) => void;
  openAuth: () => void;
  closeAuth: () => void;
};

export const useAuthModalStore = create<AuthModalState>((set) => ({
  open: false,
  setOpen: (open) => set({ open }),
  openAuth: () => set({ open: true }),
  closeAuth: () => set({ open: false }),
}));

