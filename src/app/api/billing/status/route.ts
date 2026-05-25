import { NextResponse } from "next/server";

import { parseOrderId } from "@/lib/billing/catalog";
import { unlockProfileForProduct } from "@/lib/billing/access-unlock";
import { resolveRequestUserId } from "@/lib/access/request-user";
import { sanitizeApiError } from "@/lib/services/shared/env";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { paymentProvider } from "@/services/payments/router";

export const dynamic = "force-dynamic";

/** Poll invoice status; applies profile unlock when paid (webhook fallback). */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const invoiceId = searchParams.get("invoiceId")?.trim();
    const orderId = searchParams.get("orderId")?.trim() ?? null;
    if (!invoiceId) return NextResponse.json({ ok: false, error: "Missing invoiceId" }, { status: 400 });

    const provider = paymentProvider();
    const result = await provider.getInvoiceStatus({ invoiceId });
    if (!result.ok) {
      return NextResponse.json({ ok: false, error: sanitizeApiError(result.error) });
    }

    if (result.status === "paid" && orderId) {
      const { productId, userId: orderUserId } = parseOrderId(orderId);
      const admin = supabaseAdmin();
      const authUserId = await resolveRequestUserId(req, admin);
      if (!authUserId) {
        return NextResponse.json({ ok: false, error: "Authentication required" }, { status: 401 });
      }
      if (orderUserId && orderUserId !== authUserId) {
        return NextResponse.json({ ok: false, error: "Order does not belong to this account" }, { status: 403 });
      }
      const userId = authUserId;
      if (admin && productId) {
        await unlockProfileForProduct(admin, userId, productId, orderId);
      }
    }

    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: sanitizeApiError(e instanceof Error ? e.message : "Billing status error") },
      { status: 500 },
    );
  }
}
