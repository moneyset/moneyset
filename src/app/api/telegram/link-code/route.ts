import { NextResponse } from "next/server";

import { tgGenerateLinkCode } from "@/services/telegram/memory";

export const dynamic = "force-dynamic";

export async function POST() {
  const { code, expiresAt } = tgGenerateLinkCode();
  return NextResponse.json({ ok: true, code, expiresAt });
}

