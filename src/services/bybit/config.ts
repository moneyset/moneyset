export const BYBIT_REST_BASE_DEFAULT = "https://api.bybit.com";

export type BybitCategory = "linear" | "spot";

export function normalizeBybitCategory(input?: string | null): BybitCategory {
  const v = (input ?? "").toLowerCase();
  if (v === "spot") return "spot";
  return "linear";
}
