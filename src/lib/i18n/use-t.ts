"use client";

import { useUiPrefsStore } from "@/store/ui-prefs-store";
import type { I18nKey } from "@/lib/i18n/strings";
import { t } from "@/lib/i18n/strings";

export function useLocale() {
  return useUiPrefsStore((s) => s.uiLocale);
}

export function useT(): (key: I18nKey) => string {
  const locale = useLocale();
  return (key) => t(locale, key);
}

