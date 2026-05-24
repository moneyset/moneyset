import type { UiLocale } from "@/store/ui-prefs-store";
import type { TelegramChatPrefs, TelegramPushState } from "@/types/telegram";

type LinkRecord = {
  code: string;
  createdAt: number;
  expiresAt: number;
  chatId: string | null;
  username: string | null;
};

const linkCodes = new Map<string, LinkRecord>();

type ChatRecord = {
  chatId: string;
  username: string | null;
  prefs: TelegramChatPrefs;
  linkedAt: number;
};

const chats = new Map<string, ChatRecord>();

let latestState: TelegramPushState | null = null;

export function tgGenerateLinkCode(): { code: string; expiresAt: number } {
  const code = Math.random().toString(36).slice(2, 8).toUpperCase();
  const now = Date.now();
  const rec: LinkRecord = {
    code,
    createdAt: now,
    expiresAt: now + 10 * 60_000,
    chatId: null,
    username: null,
  };
  linkCodes.set(code, rec);
  return { code, expiresAt: rec.expiresAt };
}

export function tgLinkChat(args: { code: string; chatId: string; username: string | null }) {
  const rec = linkCodes.get(args.code);
  if (!rec) return { ok: false, error: "Invalid code" } as const;
  if (Date.now() > rec.expiresAt) return { ok: false, error: "Code expired" } as const;
  rec.chatId = args.chatId;
  rec.username = args.username;
  linkCodes.set(args.code, rec);

  if (!chats.has(args.chatId)) {
    chats.set(args.chatId, {
      chatId: args.chatId,
      username: args.username,
      prefs: { locale: "en", alertsEnabled: true, alertLevel: "standard" },
      linkedAt: Date.now(),
    });
  }

  return { ok: true } as const;
}

export function tgResolveLink(code: string): { status: "pending" | "linked" | "expired" | "invalid"; chatId?: string } {
  const rec = linkCodes.get(code);
  if (!rec) return { status: "invalid" };
  if (Date.now() > rec.expiresAt) return { status: "expired" };
  if (rec.chatId) return { status: "linked", chatId: rec.chatId };
  return { status: "pending" };
}

export function tgGetChat(chatId: string): ChatRecord | null {
  return chats.get(chatId) ?? null;
}

export function tgSetChatPrefs(chatId: string, patch: Partial<TelegramChatPrefs>) {
  const rec = chats.get(chatId);
  if (!rec) return;
  rec.prefs = { ...rec.prefs, ...patch };
  chats.set(chatId, rec);
}

export function tgAllChats(): ChatRecord[] {
  return [...chats.values()];
}

export function tgSetLatestState(s: TelegramPushState) {
  latestState = s;
}

export function tgGetLatestState(): TelegramPushState | null {
  return latestState;
}

export function tgDefaultLocaleForChat(chatId: string): UiLocale {
  return chats.get(chatId)?.prefs.locale ?? "en";
}

