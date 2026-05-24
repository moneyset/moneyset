import { NextResponse } from "next/server";

import { tgResolveLink } from "@/services/telegram/memory";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code")?.trim() ?? "";
  if (!code) return NextResponse.json({ ok: false, error: "Missing code" }, { status: 400 });
  const res = tgResolveLink(code);
  return NextResponse.json({ ok: true, ...res });
}

