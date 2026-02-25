"use client";

import { useEffect, useState, useRef } from "react";
import { AlertTriangle } from "lucide-react";
import { useTranslations } from "next-intl";

export function LiveInventoryBadge() {
    const t = useTranslations('Index');
    const [stock, setStock] = useState(47);
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        const scheduleNext = () => {
            // Random interval between 60s and 180s (1-3 minutes)
            const delay = 60000 + Math.random() * 120000;
            timeoutRef.current = setTimeout(() => {
                setStock(prev => {
                    // Random decrement 1-5
                    const drop = 1 + Math.floor(Math.random() * 5);
                    return Math.max(3, prev - drop);
                });
                scheduleNext();
            }, delay);
        };
        scheduleNext();
        return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); };
    }, []);

    return (
        <div className="flex items-center justify-center lg:justify-start gap-2 bg-red-500/10 border border-red-500/30 px-3 py-2 rounded-lg w-fit mx-auto lg:mx-0">
            <AlertTriangle className="w-3.5 h-3.5 text-red-500 animate-pulse shrink-0" />
            <span className="text-xs font-medium text-red-200 leading-tight">
                {t('inventory_high_demand')} <strong className="text-white tabular-nums">{stock}</strong> {t('inventory_kits_remaining')}
            </span>
        </div>
    );
}
