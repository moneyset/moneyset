import { NextResponse } from "next/server";

import type { TelegramAuthTelemetryEvent } from "@/lib/auth/telegram-telemetry";
import { logTelegramAuthEvent } from "@/lib/auth/telegram-telemetry";
import { applyRateLimit } from "@/lib/ops/api-guard-helpers";

export const dynamic = "force-dynamic";

const ALLOWED: ReadonlySet<TelegramAuthTelemetryEvent> = new Set([
  "telegram_login_started",
  "telegram_login_failed",
]);

type Body = Readonly<{
  event?: TelegramAuthTelemetryEvent;
  source?: string;
  reason?: string;
}>;

/** Client-side Telegram auth funnel telemetry (started / failed before server round-trip). */
export async function POST(req: Request) {
  const limited = applyRateLimit({ req, route: "auth/telegram/telemetry", limit: 60, windowMs: 60_000 });
  if (limited) return limited;

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const event = body.event;
  if (!event || !ALLOWED.has(event)) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  logTelegramAuthEvent(event, {
    source: body.source?.trim() || "client",
    reason: body.reason?.slice(0, 120) ?? null,
    channel: "client",
  });

  return NextResponse.json({ ok: true });
}
