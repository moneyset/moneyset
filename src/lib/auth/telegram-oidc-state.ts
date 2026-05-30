import { createHmac, timingSafeEqual } from "node:crypto";

import { env } from "@/lib/services/shared/env";

export type TelegramOidcStatePayload = Readonly<{
  /** Inner CSRF nonce (also embedded in signed blob). */
  state: string;
  codeVerifier: string;
  nextPath: string;
  exp: number;
}>;

const MAX_AGE_SEC = 600;

function signingSecret(): string | null {
  return env("TELEGRAM_AUTH_SECRET") ?? env("TELEGRAM_OIDC_CLIENT_SECRET") ?? null;
}

function safeEqualString(a: string, b: string): boolean {
  const aa = Buffer.from(a);
  const bb = Buffer.from(b);
  if (aa.length !== bb.length) return false;
  return timingSafeEqual(aa, bb);
}

/** Signed OAuth state — survives Telegram WebView cookie loss on cross-site redirect. */
export function signTelegramOidcState(
  bundle: Readonly<{ state: string; codeVerifier: string; nextPath: string }>,
): string | null {
  const secret = signingSecret();
  if (!secret) return null;

  const payload = Buffer.from(
    JSON.stringify({
      s: bundle.state,
      v: bundle.codeVerifier,
      n: bundle.nextPath,
      e: Math.floor(Date.now() / 1000) + MAX_AGE_SEC,
    }),
    "utf8",
  ).toString("base64url");

  const sig = createHmac("sha256", secret).update(payload).digest("base64url");
  return `${payload}.${sig}`;
}

export function unsignTelegramOidcState(signedState: string | null): TelegramOidcStatePayload | null {
  if (!signedState) return null;
  const secret = signingSecret();
  if (!secret) return null;

  const dot = signedState.lastIndexOf(".");
  if (dot <= 0) return null;

  const payload = signedState.slice(0, dot);
  const sig = signedState.slice(dot + 1);
  const expected = createHmac("sha256", secret).update(payload).digest("base64url");
  if (!safeEqualString(sig, expected)) return null;

  try {
    const json = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as {
      s?: string;
      v?: string;
      n?: string;
      e?: number;
    };
    if (!json.s || !json.v || typeof json.e !== "number") return null;
    if (json.e < Math.floor(Date.now() / 1000)) return null;
    return {
      state: json.s,
      codeVerifier: json.v,
      nextPath: typeof json.n === "string" && json.n ? json.n : "/",
      exp: json.e,
    };
  } catch {
    return null;
  }
}
