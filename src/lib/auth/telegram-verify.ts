import { createHmac, timingSafeEqual } from "node:crypto";

export type TelegramWebAppUser = Readonly<{
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  photo_url?: string;
}>;

export type VerifiedTelegramInit = Readonly<{
  user: TelegramWebAppUser;
  authDate: number;
  queryId?: string;
}>;

function parseInitData(initData: string): Map<string, string> {
  const map = new Map<string, string>();
  for (const part of initData.split("&")) {
    const [rawKey, rawVal] = part.split("=");
    if (!rawKey) continue;
    map.set(rawKey, decodeURIComponent(rawVal ?? ""));
  }
  return map;
}

/** Validates Telegram Mini App initData per official WebApp spec. */
export function verifyTelegramWebAppInitData(
  initData: string,
  botToken: string,
): VerifiedTelegramInit | null {
  const trimmed = initData.trim();
  if (!trimmed || !botToken.trim()) return null;

  const params = parseInitData(trimmed);
  const hash = params.get("hash");
  if (!hash) return null;

  const pairs: string[] = [];
  for (const [key, value] of params.entries()) {
    if (key === "hash") continue;
    pairs.push(`${key}=${value}`);
  }
  pairs.sort();
  const dataCheckString = pairs.join("\n");

  const secretKey = createHmac("sha256", "WebAppData").update(botToken).digest();
  const calculated = createHmac("sha256", secretKey).update(dataCheckString).digest("hex");

  try {
    const a = Buffer.from(calculated, "hex");
    const b = Buffer.from(hash, "hex");
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  } catch {
    return null;
  }

  const authDate = Number(params.get("auth_date"));
  if (!Number.isFinite(authDate)) return null;
  const maxAgeSec = 60 * 60 * 24;
  if (Math.abs(Date.now() / 1000 - authDate) > maxAgeSec) return null;

  const userRaw = params.get("user");
  if (!userRaw) return null;
  let user: TelegramWebAppUser;
  try {
    user = JSON.parse(userRaw) as TelegramWebAppUser;
  } catch {
    return null;
  }
  if (!user?.id || typeof user.id !== "number") return null;

  return {
    user,
    authDate,
    queryId: params.get("query_id") ?? undefined,
  };
}
