import { createHash, createHmac, timingSafeEqual } from "node:crypto";

export type TelegramLoginUser = Readonly<{
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
}>;

/** Validates Telegram Login Widget callback query per official spec. */
export function verifyTelegramLoginWidget(
  params: Record<string, string>,
  botToken: string,
): TelegramLoginUser | null {
  if (!botToken.trim()) return null;

  const hash = params.hash;
  if (!hash) return null;

  const pairs: string[] = [];
  for (const [key, value] of Object.entries(params)) {
    if (key === "hash") continue;
    pairs.push(`${key}=${value}`);
  }
  pairs.sort();
  const dataCheckString = pairs.join("\n");

  const secretKey = createHash("sha256").update(botToken).digest();
  const calculated = createHmac("sha256", secretKey).update(dataCheckString).digest("hex");

  try {
    const a = Buffer.from(calculated, "hex");
    const b = Buffer.from(hash, "hex");
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  } catch {
    return null;
  }

  const id = Number(params.id);
  const authDate = Number(params.auth_date);
  if (!Number.isFinite(id) || !Number.isFinite(authDate)) return null;
  if (Math.abs(Date.now() / 1000 - authDate) > 60 * 60 * 24) return null;

  return {
    id,
    first_name: params.first_name,
    last_name: params.last_name,
    username: params.username,
    photo_url: params.photo_url,
    auth_date: authDate,
  };
}
