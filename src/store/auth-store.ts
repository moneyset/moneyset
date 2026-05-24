"use client";

import type { Session, User } from "@supabase/supabase-js";
import { create } from "zustand";

export type AuthSessionMode = "unknown" | "guest" | "authenticated";

type AuthState = {
  status: "unknown" | "signed_out" | "signed_in";
  sessionMode: AuthSessionMode;
  session: Session | null;
  user: User | null;
  setAuth: (session: Session | null) => void;
  setGuest: () => void;
  signOutLocal: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  status: "unknown",
  sessionMode: "unknown",
  session: null,
  user: null,
  setAuth: (session) =>
    set((state) => ({
      status: session ? "signed_in" : "signed_out",
      sessionMode: session ? "authenticated" : state.sessionMode === "guest" ? "guest" : "unknown",
      session,
      user: session?.user ?? null,
    })),
  setGuest: () =>
    set({
      status: "signed_out",
      sessionMode: "guest",
      session: null,
      user: null,
    }),
  signOutLocal: () =>
    set({
      status: "signed_out",
      sessionMode: "unknown",
      session: null,
      user: null,
    }),
}));
