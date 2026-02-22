"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, PackageCheck } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ActivityItem } from "@/app/api/recent-activity/route";

type TimeKey = "popup_just_now" | "popup_2min_ago" | "popup_5min_ago" | "popup_12min_ago" | "popup_1hour_ago";
type AmountKey = "popup_box" | "popup_boxes";

export function RecentSalesPopup() {
    const t = useTranslations('Index');
    const [isVisible, setIsVisible] = useState(false);
    const [activities, setActivities] = useState<ActivityItem[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [ready, setReady] = useState(false);

    // Fetch real order data once on mount
    useEffect(() => {
        fetch('/api/recent-activity')
            .then(r => r.json())
            .then(({ activities: data }: { activities: ActivityItem[] }) => {
                if (data && data.length > 0) {
                    setActivities(data);
                    setReady(true);
                }
                // If empty → ready stays false → popup never shows
            })
            .catch(() => {
                // Silently fail — no fake fallback
            });
    }, []);

    const showNextPopup = useCallback((idx: number, items: ActivityItem[]) => {
        setCurrentIndex(idx);
        setIsVisible(true);

        // Hide after 5 seconds, then schedule next
        setTimeout(() => {
            setIsVisible(false);
            const nextIdx = (idx + 1) % items.length;
            const delay = Math.floor(Math.random() * 60000) + 30000; // 30–90s
            setTimeout(() => showNextPopup(nextIdx, items), delay);
        }, 5000);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (!ready || activities.length === 0) return;
        // First popup after 15–25 seconds
        const initialDelay = 15000 + Math.floor(Math.random() * 10000);
        const timer = setTimeout(() => showNextPopup(0, activities), initialDelay);
        return () => clearTimeout(timer);
    }, [ready, activities, showNextPopup]);

    if (!ready || activities.length === 0) return null;

    const current = activities[currentIndex];
    const amountKey: AmountKey = current.quantity > 1 ? "popup_boxes" : "popup_box";

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0, y: 50, x: -20 }}
                    animate={{ opacity: 1, y: 0, x: 0 }}
                    exit={{ opacity: 0, y: 20, scale: 0.95 }}
                    className="fixed bottom-24 left-4 z-40 glass-panel border-brand-gold/30 p-4 rounded-xl flex items-start gap-4 shadow-2xl max-w-[300px] pointer-events-none lg:bottom-6 lg:left-6 lg:max-w-[320px]"
                >
                    <div className="w-10 h-10 rounded-full bg-brand-gold/20 border border-brand-gold/40 flex items-center justify-center shrink-0">
                        <PackageCheck className="w-5 h-5 text-brand-gold" />
                    </div>
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-white text-sm font-medium">{current.name}</span>
                            <span className="text-white/40 text-xs">{t('popup_from')} {current.city}</span>
                        </div>
                        <p className="text-brand-gold/90 text-sm">
                            {t('popup_purchased')}{' '}
                            <strong className="text-brand-gold font-bold">
                                {current.quantity} {t(amountKey)}
                            </strong>{' '}
                            {t('popup_of_retatrutide')}.
                        </p>
                        <div className="flex items-center gap-1 mt-1 text-[10px] text-white/50">
                            <CheckCircle2 className="w-3 h-3 text-green-400" />
                            <span>{t('popup_verified_order')} • {t(current.timeAgoKey as TimeKey)}</span>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
