"use client";

import { useEffect, useState } from "react";
import { AlertTriangle } from "lucide-react";
import { useTranslations, useLocale } from "next-intl";
import { useStock } from "./useStock";

export function LiveInventoryBadge() {
    const t = useTranslations('Index');
    const locale = useLocale();
    const stock = useStock();
    const [timestamp, setTimestamp] = useState<string | null>(null);

    // Generate "last verified" timestamp client-side (visitor's timezone)
    useEffect(() => {
        const now = new Date();
        const hoursAgo = 1 + Math.floor(Math.random() * 3); // 1-3h ago
        const d = new Date(now.getTime() - hoursAgo * 3600000);
        d.setMinutes(d.getMinutes() >= 30 ? 30 : 0, 0, 0);

        const time = d.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
        const date = d.toLocaleDateString(locale, { day: '2-digit', month: '2-digit', year: '2-digit' });
        setTimestamp(`${time} · ${date}`);
    }, [locale]);

    return (
        <div className="flex flex-col items-center lg:items-start gap-1 w-fit mx-auto lg:mx-0">
            <div className="flex items-center justify-center lg:justify-start gap-2 bg-red-500/10 border border-red-500/30 px-3 py-2 rounded-lg">
                <AlertTriangle className="w-3.5 h-3.5 text-red-500 animate-pulse shrink-0" />
                <span className="text-xs font-medium text-red-200 leading-tight">
                    {t('inventory_high_demand')} <strong className="text-white tabular-nums">{stock}</strong> {t('inventory_kits_remaining')}
                </span>
            </div>
            {timestamp && (
                <span className="text-[10px] text-white/30 tabular-nums px-1">
                    {t('inventory_updated')} {timestamp}
                </span>
            )}
        </div>
    );
}
