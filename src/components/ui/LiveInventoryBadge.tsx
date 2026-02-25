"use client";

import { useEffect, useState } from "react";
import { AlertTriangle } from "lucide-react";
import { useTranslations } from "next-intl";
import { useStock } from "./useStock";

export function LiveInventoryBadge() {
    const t = useTranslations('Index');
    const stock = useStock();
    const [timestamp, setTimestamp] = useState<string | null>(null);

    // Update timestamp every time stock changes — uses browser's local timezone
    useEffect(() => {
        const now = new Date();
        // Explicitly use browser timezone via Intl
        const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', timeZone: tz });
        const date = now.toLocaleDateString([], { day: '2-digit', month: '2-digit', year: '2-digit', timeZone: tz });
        setTimestamp(`${time} · ${date}`);
    }, [stock]);

    return (
        <div className="flex flex-col items-center lg:items-start gap-1 w-fit mx-auto lg:mx-0">
            <div className="flex items-center justify-center lg:justify-start gap-2 bg-red-500/10 border border-red-500/30 px-3 py-2 rounded-lg">
                <AlertTriangle className="w-3.5 h-3.5 text-red-500 animate-pulse shrink-0" />
                <span className="text-xs font-medium text-red-200 leading-tight">
                    {t('inventory_high_demand')} <strong className="text-white tabular-nums">{stock}</strong> {t('inventory_kits_remaining')}
                </span>
            </div>
            {timestamp && (
                <div className="flex items-center gap-1.5 px-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse shrink-0"></span>
                    <span className="text-[10px] text-white/40 tabular-nums">
                        Live · {timestamp}
                    </span>
                </div>
            )}
        </div>
    );
}
