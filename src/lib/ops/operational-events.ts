/**
 * Safe operational event logging — no secrets, tokens, or raw user IDs.
 */

export type OpsEventKind =
  | "auth_failure"
  | "payment_webhook_failure"
  | "payment_unlock_failure"
  | "webhook_signature_failure"
  | "entitlement_mismatch"
  | "profile_sync_failure"
  | "openrouter_failure"
  | "api_rate_limited"
  | "startup_env_missing"
  | "telegram_webhook_rejected"
  | "health_degraded";

type OpsDetail = Record<string, string | number | boolean | null>;

export function logOpsEvent(kind: OpsEventKind, detail: OpsDetail = {}): void {
  const payload = {
    kind,
    ts: new Date().toISOString(),
    ...detail,
  };
  console.error("[moneyset:ops]", JSON.stringify(payload));
}
