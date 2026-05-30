import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

import { env, publicSiteUrl } from "@/lib/services/shared/env";

const TELEGRAM_OAUTH_AUTH = "https://oauth.telegram.org/auth";
const TELEGRAM_OAUTH_TOKEN = "https://oauth.telegram.org/token";
const TELEGRAM_JWKS_URL = "https://oauth.telegram.org/.well-known/jwks.json";
const TELEGRAM_ISSUER = "https://oauth.telegram.org";

export type TelegramOidcConfig = Readonly<{
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}>;

export type TelegramOidcUser = Readonly<{
  telegramId: number;
  username: string | null;
  name: string | null;
}>;

export type TelegramOidcPkce = Readonly<{
  state: string;
  codeVerifier: string;
  codeChallenge: string;
}>;

type Jwk = Readonly<{
  kid?: string;
  kty?: string;
  n?: string;
  e?: string;
  alg?: string;
  use?: string;
}>;

type IdTokenPayload = Readonly<{
  iss?: string;
  aud?: string | number;
  sub?: string;
  id?: number;
  exp?: number;
  iat?: number;
  preferred_username?: string;
  name?: string;
}>;

function base64UrlEncode(input: Buffer): string {
  return input.toString("base64url");
}

export function createTelegramOidcPkce(): TelegramOidcPkce {
  const state = base64UrlEncode(randomBytes(24));
  const codeVerifier = base64UrlEncode(randomBytes(32));
  const codeChallenge = base64UrlEncode(createHash("sha256").update(codeVerifier).digest());
  return { state, codeVerifier, codeChallenge };
}

export function telegramOidcRedirectUri(origin?: string): string {
  const base = origin ?? publicSiteUrl();
  return `${base.replace(/\/$/, "")}/api/auth/telegram/oidc/callback`;
}

export function getTelegramOidcConfig(origin?: string): TelegramOidcConfig | null {
  const clientId = env("TELEGRAM_OIDC_CLIENT_ID");
  const clientSecret = env("TELEGRAM_OIDC_CLIENT_SECRET");
  if (!clientId || !clientSecret) return null;
  return {
    clientId,
    clientSecret,
    redirectUri: telegramOidcRedirectUri(origin),
  };
}

export function buildTelegramOidcAuthorizationUrl(
  config: TelegramOidcConfig,
  pkce: TelegramOidcPkce,
  oauthState: string = pkce.state,
): string {
  const url = new URL(TELEGRAM_OAUTH_AUTH);
  url.searchParams.set("client_id", config.clientId);
  url.searchParams.set("redirect_uri", config.redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "openid profile");
  url.searchParams.set("state", oauthState);
  url.searchParams.set("code_challenge", pkce.codeChallenge);
  url.searchParams.set("code_challenge_method", "S256");
  return url.toString();
}

function decodeJwtPart(part: string): Record<string, unknown> {
  const json = Buffer.from(part, "base64url").toString("utf8");
  return JSON.parse(json) as Record<string, unknown>;
}

function safeEqualString(a: string, b: string): boolean {
  const aa = Buffer.from(a);
  const bb = Buffer.from(b);
  if (aa.length !== bb.length) return false;
  return timingSafeEqual(aa, bb);
}

async function fetchJwks(): Promise<Jwk[]> {
  const res = await fetch(TELEGRAM_JWKS_URL, { cache: "no-store" });
  if (!res.ok) throw new Error("telegram_jwks_fetch_failed");
  const json = (await res.json()) as { keys?: Jwk[] };
  return json.keys ?? [];
}

async function verifyIdTokenSignature(idToken: string, clientId: string): Promise<IdTokenPayload> {
  const parts = idToken.split(".");
  if (parts.length !== 3) throw new Error("telegram_id_token_malformed");

  const [encodedHeader, encodedPayload, encodedSignature] = parts;
  const header = decodeJwtPart(encodedHeader) as { alg?: string; kid?: string };
  const payload = decodeJwtPart(encodedPayload) as IdTokenPayload;

  if (header.alg !== "RS256") throw new Error("telegram_id_token_alg");
  if (!header.kid) throw new Error("telegram_id_token_kid");

  const keys = await fetchJwks();
  const jwk = keys.find((k) => k.kid === header.kid);
  if (!jwk?.n || !jwk?.e) throw new Error("telegram_id_token_jwk");

  const key = await crypto.subtle.importKey(
    "jwk",
    { kty: "RSA", n: jwk.n, e: jwk.e, alg: "RS256", ext: true },
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["verify"],
  );

  const data = Buffer.from(`${encodedHeader}.${encodedPayload}`);
  const signature = Buffer.from(encodedSignature, "base64url");
  const ok = await crypto.subtle.verify("RSASSA-PKCS1-v1_5", key, signature, data);
  if (!ok) throw new Error("telegram_id_token_signature");

  const now = Math.floor(Date.now() / 1000);
  if (payload.iss !== TELEGRAM_ISSUER) throw new Error("telegram_id_token_iss");
  if (String(payload.aud) !== String(clientId)) throw new Error("telegram_id_token_aud");
  if (typeof payload.exp === "number" && payload.exp < now - 30) throw new Error("telegram_id_token_exp");
  if (typeof payload.iat === "number" && payload.iat > now + 60) throw new Error("telegram_id_token_iat");

  return payload;
}

export async function exchangeTelegramOidcCode(
  config: TelegramOidcConfig,
  code: string,
  codeVerifier: string,
): Promise<TelegramOidcUser> {
  const basic = Buffer.from(`${config.clientId}:${config.clientSecret}`).toString("base64");
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: config.redirectUri,
    client_id: config.clientId,
    code_verifier: codeVerifier,
  });

  const res = await fetch(TELEGRAM_OAUTH_TOKEN, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${basic}`,
    },
    body,
    cache: "no-store",
  });

  const json = (await res.json()) as { id_token?: string; error?: string; error_description?: string };
  if (!res.ok || !json.id_token) {
    throw new Error(json.error_description ?? json.error ?? "telegram_token_exchange_failed");
  }

  const claims = await verifyIdTokenSignature(json.id_token, config.clientId);
  const telegramId =
    typeof claims.id === "number"
      ? claims.id
      : Number(claims.sub?.replace(/\D/g, "") || NaN);
  if (!Number.isFinite(telegramId)) throw new Error("telegram_id_token_sub");

  return {
    telegramId,
    username: typeof claims.preferred_username === "string" ? claims.preferred_username : null,
    name: typeof claims.name === "string" ? claims.name : null,
  };
}

export function verifyTelegramOidcState(cookieState: string | undefined, queryState: string | null): boolean {
  if (!cookieState || !queryState) return false;
  return safeEqualString(cookieState, queryState);
}
