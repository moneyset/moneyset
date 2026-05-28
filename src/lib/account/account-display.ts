import type { BillingProductId } from "@/lib/billing/catalog";
import { BILLING_PRODUCTS } from "@/lib/billing/catalog";
import { hasFounderAccess } from "@/lib/access/founder";
import { hasFullPlatformAccess } from "@/lib/access/capabilities";
import type { ProfileAccess, SubscriptionStatus } from "@/lib/access/roles";
import type { PaymentStatus } from "@/lib/billing/payment-record";
import { pickLocale } from "@/lib/i18n/cognition-dict";
import type { UiLocale } from "@/store/ui-prefs-store";

export function formatAccountDate(value: number | string | null | undefined): string {
  if (!value) return "—";
  const d = new Date(typeof value === "number" ? value : value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

export function formatAccountDateTime(value: number | string | null | undefined): string {
  if (!value) return "—";
  const d = new Date(typeof value === "number" ? value : value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function maskAccountEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!local || !domain) return email;
  const masked = local.length > 3 ? `${local.slice(0, 2)}${"•".repeat(Math.min(local.length - 2, 6))}` : local;
  return `${masked}@${domain}`;
}

export function accessPlanLabel(locale: UiLocale, profile: ProfileAccess): string {
  if (hasFounderAccess(profile)) {
    return pickLocale(locale, "Founding Access", "Founding Access");
  }
  if (profile.accessLevel === "invitation") {
    return pickLocale(locale, "Invitation Access", "Приглашение");
  }
  if (profile.accessLevel === "admin") {
    return pickLocale(locale, "Admin Access", "Админ доступ");
  }
  if (profile.accessTier === "premium" || hasFullPlatformAccess(profile)) {
    return pickLocale(locale, "Premium Intelligence", "Premium Intelligence");
  }
  return pickLocale(locale, "Free Access", "Бесплатный доступ");
}

export function accessPlanDetail(locale: UiLocale, profile: ProfileAccess): string {
  if (hasFounderAccess(profile)) {
    return pickLocale(locale, "Lifetime access · no expiry", "Пожизненный доступ · без срока");
  }
  if (profile.premiumUntil) {
    return pickLocale(
      locale,
      `Active until ${formatAccountDate(profile.premiumUntil)}`,
      `Активен до ${formatAccountDate(profile.premiumUntil)}`,
    );
  }
  if (profile.invitationUntil) {
    return pickLocale(
      locale,
      `Invitation until ${formatAccountDate(profile.invitationUntil)}`,
      `Приглашение до ${formatAccountDate(profile.invitationUntil)}`,
    );
  }
  if (hasFullPlatformAccess(profile)) {
    return pickLocale(locale, "Full platform access active", "Полный доступ активен");
  }
  return pickLocale(
    locale,
    "Execution map and deep interpretation locked",
    "Карта исполнения и глубокая интерпретация закрыты",
  );
}

export function subscriptionStatusLabel(locale: UiLocale, status: SubscriptionStatus): string {
  const map: Record<SubscriptionStatus, { en: string; ru: string }> = {
    inactive: { en: "Inactive", ru: "Неактивна" },
    trial: { en: "Trial", ru: "Пробный период" },
    active: { en: "Active", ru: "Активна" },
    founding: { en: "Founding", ru: "Founding" },
    past_due: { en: "Past due", ru: "Просрочена" },
    expired: { en: "Expired", ru: "Истекла" },
    canceled: { en: "Canceled", ru: "Отменена" },
  };
  const entry = map[status];
  return locale === "ru" ? entry.ru : entry.en;
}

export function paymentStatusLabel(locale: UiLocale, status: PaymentStatus): string {
  const map: Record<PaymentStatus, { en: string; ru: string }> = {
    pending: { en: "Pending", ru: "Ожидание" },
    confirming: { en: "Confirming", ru: "Подтверждение" },
    paid: { en: "Paid", ru: "Оплачено" },
    expired: { en: "Expired", ru: "Истекло" },
    failed: { en: "Failed", ru: "Ошибка" },
  };
  const entry = map[status];
  return locale === "ru" ? entry.ru : entry.en;
}

export function productLabelFromId(productId: BillingProductId | string, locale: UiLocale): string {
  if (productId in BILLING_PRODUCTS) {
    return BILLING_PRODUCTS[productId as BillingProductId].label;
  }
  return productId;
}

export function providerLabel(provider: string): string {
  if (provider === "nowpayments") return "Crypto (NOWPayments)";
  if (provider === "helio") return "Helio";
  if (provider === "coinbase_commerce") return "Coinbase Commerce";
  return provider.charAt(0).toUpperCase() + provider.slice(1);
}

export const FOUNDER_INCLUDED_SYSTEMS = [
  { en: "Execution Intelligence Map", ru: "Карта исполнения" },
  { en: "Structural Overlays & Terrain", ru: "Структурные оверлеи и рельеф" },
  { en: "Full Agent Consensus", ru: "Полный консенсус агентов" },
  { en: "Replay Studio", ru: "Replay Studio" },
  { en: "Deep Interpretation Layer", ru: "Слой глубокой интерпретации" },
  { en: "Market Memory Constellation", ru: "Констелляция рыночной памяти" },
  { en: "Labs & Topology Surfaces", ru: "Лаборатории и топология" },
] as const;
