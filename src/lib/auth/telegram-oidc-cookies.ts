import { cookies } from "next/headers";
import type { NextResponse } from "next/server";

const STATE_COOKIE = "ms_tg_oidc_state";
const VERIFIER_COOKIE = "ms_tg_oidc_verifier";
const NEXT_COOKIE = "ms_tg_oidc_next";

const MAX_AGE_SEC = 600;

type OidcCookieBundle = Readonly<{
  state: string;
  codeVerifier: string;
  nextPath: string;
}>;

function cookieOptions(userAgent?: string) {
  const inTelegramWebView = Boolean(userAgent && /Telegram/i.test(userAgent));
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: (inTelegramWebView ? "none" : "lax") as "none" | "lax",
    path: "/",
    maxAge: MAX_AGE_SEC,
  };
}

export function applyTelegramOidcCookies(
  response: NextResponse,
  bundle: OidcCookieBundle,
  userAgent?: string,
): void {
  const opts = cookieOptions(userAgent);
  response.cookies.set(STATE_COOKIE, bundle.state, opts);
  response.cookies.set(VERIFIER_COOKIE, bundle.codeVerifier, opts);
  response.cookies.set(NEXT_COOKIE, bundle.nextPath, opts);
}

export async function setTelegramOidcCookies(bundle: OidcCookieBundle, userAgent?: string): Promise<void> {
  const jar = await cookies();
  const opts = cookieOptions(userAgent);

  jar.set(STATE_COOKIE, bundle.state, opts);
  jar.set(VERIFIER_COOKIE, bundle.codeVerifier, opts);
  jar.set(NEXT_COOKIE, bundle.nextPath, opts);
}

export async function readTelegramOidcCookies(): Promise<OidcCookieBundle | null> {
  const jar = await cookies();
  const state = jar.get(STATE_COOKIE)?.value;
  const codeVerifier = jar.get(VERIFIER_COOKIE)?.value;
  const nextPath = jar.get(NEXT_COOKIE)?.value ?? "/";
  if (!state || !codeVerifier) return null;
  return { state, codeVerifier, nextPath };
}

export async function clearTelegramOidcCookies(): Promise<void> {
  const jar = await cookies();
  for (const name of [STATE_COOKIE, VERIFIER_COOKIE, NEXT_COOKIE]) {
    jar.set(name, "", { path: "/", maxAge: 0 });
  }
}
