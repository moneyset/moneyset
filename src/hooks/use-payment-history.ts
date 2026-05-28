"use client";

import { useCallback, useEffect, useState } from "react";

import type { PaymentHistoryItem } from "@/app/api/billing/history/route";
import { authHeadersForUser } from "@/lib/access/request-user";
import { useAuthStore } from "@/store/auth-store";

export function usePaymentHistory(enabled: boolean) {
  const user = useAuthStore((s) => s.user);
  const session = useAuthStore((s) => s.session);
  const [payments, setPayments] = useState<PaymentHistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!enabled || !user?.id) {
      setPayments([]);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const headers: HeadersInit = {
        ...authHeadersForUser(user.id, session?.access_token ?? null),
      };
      const res = await fetch("/api/billing/history", { headers, cache: "no-store" });
      const json = (await res.json()) as { ok: boolean; payments?: PaymentHistoryItem[]; error?: string };
      if (!json.ok) {
        setError(json.error ?? "Could not load payment history");
        setPayments([]);
        return;
      }
      setPayments(json.payments ?? []);
    } catch {
      setError("Could not load payment history");
      setPayments([]);
    } finally {
      setLoading(false);
    }
  }, [enabled, user?.id, session?.access_token]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { payments, loading, error, refresh };
}
