"use client";

import { useEffect, useState } from "react";
import { AlertTriangle } from "lucide-react";
import { useTranslations } from "next-intl";

export function LiveInventoryBadge() {
    const t = useTranslations('Index');
    const [stock, setStock] = useState(47);

    useEffect(() => {
        const interval = setInterval(() => {
            setStock(prev => Math.max(12, prev - Math.floor(Math.random() * 3)));
        }, 45000);

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 px-3 py-1.5 rounded-lg animate-fade-in w-fit whitespace-nowrap">
            <AlertTriangle className="w-3 h-3 text-red-500 animate-pulse shrink-0" />
            <span className="text-xs font-medium text-red-200">
                {t('inventory_high_demand')} <strong className="text-white">{stock}</strong> {t('inventory_kits_remaining')}
            </span>
        </div>
    );
}
