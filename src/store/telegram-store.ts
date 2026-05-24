"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

import type { TelegramLinkState } from "@/types/telegram";

type TelegramStore = TelegramLinkState & {
  setPending: (code: string) => void;
  setLinked: (args: { chatId: string; username?: string | null }) => void;
  reset: () => void;
};

const initial: TelegramLinkState = {
  status: "unlinked",
  linkCode: null,
  chatId: null,
  username: null,
  prefs: { locale: "en", alertsEnabled: true, alertLevel: "standard" },
  updatedAtTs: null,
};

export const useTelegramStore = create<TelegramStore>()(
  persist(
    (set) => ({
      ...initial,
      setPending: (code) => set({ status: "pending", linkCode: code, updatedAtTs: Date.now() }),
      setLinked: ({ chatId, username = null }) =>
        set({ status: "linked", chatId, username, updatedAtTs: Date.now() }),
      reset: () => set({ ...initial, updatedAtTs: Date.now() }),
    }),
    { name: "moneyset_telegram_v1", partialize: (s) => ({ status: s.status, linkCode: s.linkCode, chatId: s.chatId, username: s.username, prefs: s.prefs, updatedAtTs: s.updatedAtTs }), skipHydration: true },
  ),
);

