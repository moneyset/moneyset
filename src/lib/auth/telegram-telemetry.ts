import { logOpsEvent } from "@/lib/ops/operational-events";

export type TelegramAuthTelemetryEvent =
  | "telegram_login_started"
  | "telegram_login_completed"
  | "telegram_login_failed"
  | "telegram_account_linked"
  | "telegram_account_restored";

export function logTelegramAuthEvent(
  event: TelegramAuthTelemetryEvent,
  detail: Record<string, string | number | boolean | null> = {},
): void {
  logOpsEvent("telegram_auth", { event, ...detail });
}
