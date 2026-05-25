/**
 * Permanent founder access identifiers.
 * These Telegram accounts receive full founding access unconditionally,
 * with no expiry and no paywall — bypasses subscription checks entirely.
 */

const FOUNDER_TELEGRAM_IDS: ReadonlySet<string> = new Set(["7538344648"]);

/**
 * Returns true if the given Telegram user ID belongs to a permanent founder.
 * Accepts string or numeric IDs — both are normalised to string for comparison.
 */
export function isFounderTelegramId(tgId: string | number | null | undefined): boolean {
  if (tgId == null) return false;
  return FOUNDER_TELEGRAM_IDS.has(String(tgId));
}
