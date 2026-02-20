"use client";

import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export function CheckoutPoller({ referenceId }: { referenceId: string }) {
    const router = useRouter();

    useEffect(() => {
        // Poll every 10 seconds to check if status changed to 'paid'
        const interval = setInterval(async () => {
            const { data, error } = await supabase
                .from('orders')
                .select('status')
                .eq('reference_id', referenceId)
                .single();

            if (!error && data && (data.status === 'paid' || data.status === 'shipped')) {
                router.refresh(); // This will trigger the server component to re-render and show success
            }
        }, 10000);

        return () => clearInterval(interval);
    }, [referenceId, router]);

    return null;
}
