import { NextResponse } from "next/server";

import { resolveRequestUserId } from "@/lib/access/request-user";
import { billingProduct, type BillingProductId } from "@/lib/billing/catalog";
import { sanitizeApiError } from "@/lib/services/shared/env";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { paymentProvider } from "@/services/payments/router";
import type { CreateInvoiceInput } from "@/types/billing";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as CreateInvoiceInput;
    const productId: BillingProductId =
      body.productId ??
      (body.tier === "premium" || body.tier === "pro"
        ? "premium_monthly"
        : "founding_access");
    if (!body?.payCurrency || !billingProduct(productId)) {
      return NextResponse.json({ ok: false, error: "Missing product or currency" }, { status: 400 });
    }

    const admin = supabaseAdmin();
    const userId = await resolveRequestUserId(req, admin);
    if (!userId) {
      return NextResponse.json({ ok: false, error: "Sign in required for checkout" }, { status: 401 });
    }

    const provider = paymentProvider();
    const result = await provider.createInvoice({ ...body, productId }, { userId });
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: sanitizeApiError(e instanceof Error ? e.message : "Billing create error") },
      { status: 500 },
    );
  }
}
