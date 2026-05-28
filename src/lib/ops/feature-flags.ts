/**
 * Operational feature flags — flip without redeploying UI logic.
 *
 * Telegram integration is OFF by default until explicitly enabled:
 *   MONEYSET_TELEGRAM_ENABLED=true          (server)
 *   NEXT_PUBLIC_MONEYSET_TELEGRAM_ENABLED=true  (client)
 */

function parseEnabled(raw: string | undefined): boolean | null {
  if (raw === undefined || raw === "") return null;
  const v = raw.trim().toLowerCase();
  if (v === "1" || v === "true" || v === "yes" || v === "on") return true;
  if (v === "0" || v === "false" || v === "no" || v === "off") return false;
  return null;
}

/** Server-side — webhook, push, alert routes. */
export function isTelegramIntegrationEnabled(): boolean {
  const explicit = parseEnabled(process.env.MONEYSET_TELEGRAM_ENABLED);
  if (explicit !== null) return explicit;
  const pub = parseEnabled(process.env.NEXT_PUBLIC_MONEYSET_TELEGRAM_ENABLED);
  if (pub !== null) return pub;
  return false;
}

/** Client-side bridge — reads public env only. */
export function isTelegramIntegrationEnabledClient(): boolean {
  const pub = parseEnabled(process.env.NEXT_PUBLIC_MONEYSET_TELEGRAM_ENABLED);
  if (pub !== null) return pub;
  return false;
}

export function telegramDisabledResponse() {
  return { ok: true as const, disabled: true as const };
}
