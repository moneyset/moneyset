"use client";

import { pickLocale } from "@/lib/i18n/cognition-dict";
import { useAccessStore } from "@/store/access-store";
import { useAuthStore } from "@/store/auth-store";
import { useUiPrefsStore } from "@/store/ui-prefs-store";

/** Shown when signed-in user cannot confirm entitlements from server. */
export function AccessSyncBanner() {
  const locale = useUiPrefsStore((s) => s.uiLocale);
  const signedIn = useAuthStore((s) => s.status === "signed_in");
  const syncStatus = useAccessStore((s) => s.syncStatus);
  const retry = useAccessStore((s) => s.retryProfileSync);

  if (!signedIn || syncStatus !== "error" || !retry) return null;

  return (
    <div className="ms-access-sync-banner" role="status" aria-live="polite">
      <p className="ms-access-sync-banner__text">
        {pickLocale(
          locale,
          "We couldn't load your membership status. Retry to unlock premium surfaces.",
          "Не удалось загрузить статус членства. Повторите, чтобы открыть премиум-разделы.",
        )}
      </p>
      <button type="button" className="ms-access-sync-banner__retry ms-focus-ring" onClick={() => void retry()}>
        {pickLocale(locale, "Retry", "Повторить")}
      </button>
    </div>
  );
}
