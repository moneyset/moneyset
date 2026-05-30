const PARTNER_CODE_RE = /^[a-z0-9_]{3,32}$/;

export const PARTNER_REF_COOKIE = "ms_partner_ref";
export const PARTNER_REF_MAX_AGE_SEC = 30 * 24 * 60 * 60;
export const DEFAULT_PARTNER_COMMISSION_RATE = 0.5;

export function normalizePartnerCode(raw: string | null | undefined): string | null {
  const code = raw?.trim().toLowerCase().replace(/[^a-z0-9_]/g, "") ?? "";
  if (!code || !PARTNER_CODE_RE.test(code)) return null;
  return code;
}

export function partnerPublicUrl(code: string, origin?: string): string {
  const base = (origin ?? "https://moneyset.pro").replace(/\/$/, "");
  return `${base}/partner/${encodeURIComponent(code)}`;
}

export async function readPartnerRefCookie(): Promise<string | null> {
  const { cookies } = await import("next/headers");
  const jar = await cookies();
  return normalizePartnerCode(jar.get(PARTNER_REF_COOKIE)?.value);
}
