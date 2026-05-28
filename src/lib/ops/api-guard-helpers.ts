import { NextResponse } from "next/server";

import { checkRateLimit, rateLimitKey } from "@/lib/ops/rate-limit";
import { logOpsEvent } from "@/lib/ops/operational-events";

type ApplyRateLimitArgs = {
  req: Request;
  route: string;
  limit?: number;
  windowMs?: number;
};

export function applyRateLimit({ req, route, limit = 12, windowMs = 60_000 }: ApplyRateLimitArgs) {
  const rl = checkRateLimit(rateLimitKey(req, route), { limit, windowMs });
  if (rl.allowed) return null;

  logOpsEvent("api_rate_limited", { route, retryMs: rl.retryAfterMs });
  return NextResponse.json(
    { ok: false, error: "Too many requests. Please wait and retry." },
    {
      status: 429,
      headers: { "Retry-After": String(Math.ceil(rl.retryAfterMs / 1000)) },
    },
  );
}
