"use client";

import { useEffect } from "react";

import { useAccessStore } from "@/store/access-store";
import { useEntryStore } from "@/store/entry-store";
import { useMemoryStore } from "@/store/memory-store";
import { useSubscriptionStore } from "@/store/subscription-store";
import { useTelegramStore } from "@/store/telegram-store";
import { useThemeStore } from "@/store/theme-store";
import { useUiPrefsStore } from "@/store/ui-prefs-store";

const PERSIST_STORES = [
  useAccessStore,
  useEntryStore,
  useMemoryStore,
  useSubscriptionStore,
  useTelegramStore,
  useThemeStore,
  useUiPrefsStore,
] as const;

/** Rehydrate persisted Zustand slices once on the client (React 19 safe). */
export function PersistRehydration() {
  useEffect(() => {
    for (const store of PERSIST_STORES) {
      if (!store.persist.hasHydrated()) {
        void store.persist.rehydrate();
      }
    }

    const unsubAccess = useAccessStore.persist.onFinishHydration(() => {
      useAccessStore.getState().retryProfileSync?.();
    });

    return () => {
      unsubAccess();
    };
  }, []);

  return null;
}
