"use client";

import { useEffect, useState } from "react";
import { AlertTriangle } from "lucide-react";

export function LiveInventoryBadge() {
    const [stock, setStock] = useState(47); // Initial believable number

    useEffect(() => {
        // Decrease stock randomly every few hours to create realistic scarcity
        const interval = setInterval(() => {
            setStock(prev => Math.max(12, prev - Math.floor(Math.random() * 3)));
        }, 45000); // For demo purposes, drops faster. In prod, set to hours. 

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/30 px-3 py-1.5 rounded-lg animate-fade-in w-fit">
            <AlertTriangle className="w-3 h-3 text-red-500 animate-pulse" />
            <span className="text-xs font-medium text-red-200">
                High Demand: <strong className="text-white">{stock} Kits</strong> remaining in EU Logistics Center.
            </span>
            <span className="text-[10px] text-red-400/60 ml-1 hidden sm:inline-block">Updated just now</span>
        </div>
    );
}
