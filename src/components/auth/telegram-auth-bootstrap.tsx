"use client";

import { useTelegramAutoSignIn } from "@/hooks/use-telegram-auth";

/** Runs automatic Telegram Mini App sign-in before onboarding overlays. */
export function TelegramAuthBootstrap() {
  useTelegramAutoSignIn();
  return null;
}
