"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export function CheckoutPoller({ referenceId }: { referenceId: string }) {
    const router = useRouter();

    useEffect(() => {
        // Poll the lightweight status API every 10 seconds
        const interval = setInterval(async () => {
            try {
                const res = await fetch(`/api/checkout/status?ref=${encodeURIComponent(referenceId)}`);
                const data = await res.json();

                if (data.status === 'paid' || data.status === 'shipped' || data.status === 'delivered') {
                    router.refresh(); // Server component re-renders with success screen
                }
            } catch {
                // Silently ignore fetch errors — will retry on next interval
            }
        }, 10000);

        return () => clearInterval(interval);
    }, [referenceId, router]);

    return null;
}
