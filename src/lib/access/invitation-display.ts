export type CountdownParts = Readonly<{
  days: number;
  hours: number;
  minutes: number;
  expired: boolean;
}>;

export function countdownTo(iso: string | null): CountdownParts {
  if (!iso) return { days: 0, hours: 0, minutes: 0, expired: true };
  const ms = new Date(iso).getTime() - Date.now();
  if (ms <= 0) return { days: 0, hours: 0, minutes: 0, expired: true };
  const totalMinutes = Math.floor(ms / 60_000);
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;
  return { days, hours, minutes, expired: false };
}

export function formatInvitationCountdown(locale: "en" | "ru", iso: string | null): string {
  const c = countdownTo(iso);
  if (c.expired) {
    return locale === "ru" ? "Истекло" : "Expired";
  }
  if (locale === "ru") {
    return `${c.days} дн. ${c.hours} ч. ${c.minutes} мин.`;
  }
  const dayPart = c.days === 1 ? "1 day" : `${c.days} days`;
  const hourPart = c.hours === 1 ? "1 hour" : `${c.hours} hours`;
  if (c.days > 0) return `${dayPart} ${hourPart}`;
  return `${hourPart} ${c.minutes} min`;
}
