import { NextResponse } from "next/server";

import { parseOrderId } from "@/lib/billing/catalog";
import { unlockProfileForProduct } from "@/lib/billing/access-unlock";
import { verifyNowPaymentsIpnSignature } from "@/lib/billing/nowpayments-ipn";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type NowPaymentsIpn = Readonly<{
  payment_status?: string;
  order_id?: string;
  payment_id?: string;
}>;

/** NOWPayments IPN — unlocks profile from order_id (ms-{product}-{userId}-{ts}). */
export async function POST(req: Request) {
  let body: NowPaymentsIpn;
  try {
    body = (await req.json()) as NowPaymentsIpn;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid body" }, { status: 400 });
  }

  const sig = req.headers.get("x-nowpayments-sig");
  if (!verifyNowPaymentsIpnSignature(body, sig)) {
    return NextResponse.json({ ok: false, error: "Invalid signature" }, { status: 401 });
  }

  const status = (body.payment_status ?? "").toLowerCase();
  const paid = status === "finished" || status === "confirmed" || status === "sent";
  if (!paid) {
    return NextResponse.json({ ok: true, ignored: true, status });
  }

  const orderId = body.order_id ?? "";
  const { productId, userId: parsedUserId } = parseOrderId(orderId);
  const userId = parsedUserId ?? req.headers.get("x-ms-user-id")?.trim() ?? null;

  if (!userId || !productId) {
    return NextResponse.json({ ok: true, recorded: false, reason: "missing user or product in order" });
  }

  const admin = supabaseAdmin();
  if (!admin) {
    return NextResponse.json({ ok: false, error: "Billing service unavailable" }, { status: 503 });
  }

  const result = await unlockProfileForProduct(admin, userId, productId, orderId);
  if (!result.ok) {
    return NextResponse.json({ ok: false, error: "Upgrade could not be applied" }, { status: 502 });
  }

  return NextResponse.json({ ok: true, upgraded: true, orderId, productId, userId });
}
