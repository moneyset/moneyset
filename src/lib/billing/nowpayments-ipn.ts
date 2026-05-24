import { createHmac } from "node:crypto";

import { env } from "@/lib/services/shared/env";

/** NOWPayments IPN signature (HMAC-SHA512 over sorted JSON body). */
export function verifyNowPaymentsIpnSignature(body: unknown, signatureHeader: string | null): boolean {
  const secret = env("NOWPAYMENTS_IPN_SECRET");
  if (!secret) return process.env.NODE_ENV === "development";
  if (!signatureHeader?.trim()) return false;

  const payload =
    typeof body === "object" && body !== null
      ? sortObjectKeys(body as Record<string, unknown>)
      : {};
  const sorted = JSON.stringify(payload);
  const expected = createHmac("sha512", secret).update(sorted).digest("hex");
  return timingSafeEqualHex(expected, signatureHeader.trim().toLowerCase());
}

function sortObjectKeys(obj: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const key of Object.keys(obj).sort()) {
    const val = obj[key];
    if (val !== null && typeof val === "object" && !Array.isArray(val)) {
      out[key] = sortObjectKeys(val as Record<string, unknown>);
    } else {
      out[key] = val;
    }
  }
  return out;
}

function timingSafeEqualHex(a: string, b: string): boolean {
  const aa = a.toLowerCase();
  const bb = b.toLowerCase();
  if (aa.length !== bb.length) return false;
  let diff = 0;
  for (let i = 0; i < aa.length; i++) diff |= aa.charCodeAt(i) ^ bb.charCodeAt(i);
  return diff === 0;
}
