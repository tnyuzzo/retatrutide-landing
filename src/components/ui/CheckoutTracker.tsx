"use client";

import { usePostHog } from "posthog-js/react";
import { useEffect } from "react";

export function CheckoutTracker({
  referenceId,
  crypto,
  fiatAmount,
  status,
}: {
  referenceId: string;
  crypto: string;
  fiatAmount: number;
  status: string;
}) {
  const posthog = usePostHog();

  useEffect(() => {
    if (!posthog) return;

    if (status === "pending") {
      posthog.capture("checkout_viewed", {
        reference_id: referenceId,
        crypto,
        fiat_amount: fiatAmount,
      });
      (window as any).clarity?.("set", "checkout_viewed", referenceId);
      (window as any).clarity?.("set", "crypto", crypto);
    } else if (status === "paid" || status === "shipped" || status === "delivered") {
      posthog.capture("payment_confirmed", {
        reference_id: referenceId,
        crypto,
        fiat_amount: fiatAmount,
      });
      (window as any).clarity?.("set", "payment_confirmed", referenceId);
    }
  }, [posthog, referenceId, crypto, fiatAmount, status]);

  return null;
}
