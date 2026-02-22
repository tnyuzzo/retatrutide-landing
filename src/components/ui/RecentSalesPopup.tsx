"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, PackageCheck } from "lucide-react";
import { useTranslations } from "next-intl";

const NAMES = ["Michael R.", "Elena S.", "David K.", "Dr. Thomas", "Sarah M.", "Andreas W.", "Laura C.", "Dr. Petrov", "James H.", "Anna L."];
const CITIES = ["Berlin", "London", "Munich", "Vienna", "Zurich", "Paris", "Amsterdam", "Stockholm", "Copenhagen", "Geneva", "Rome", "Madrid"];

type TimeKey = "popup_just_now" | "popup_2min_ago" | "popup_5min_ago" | "popup_12min_ago" | "popup_1hour_ago";
type AmountKey = "popup_box" | "popup_boxes";

const TIME_KEYS: TimeKey[] = ["popup_just_now", "popup_2min_ago", "popup_5min_ago", "popup_12min_ago", "popup_1hour_ago"];

export function RecentSalesPopup() {
    const t = useTranslations('Index');
    const [isVisible, setIsVisible] = useState(false);
    const [currentPurchase, setCurrentPurchase] = useState<{
        name: string; city: string; timeKey: TimeKey; amountKey: AmountKey; amountNum: string;
    } | null>(null);

    useEffect(() => {
        const initialTimer = setTimeout(() => {
            triggerNewPopup();
        }, 15000);
        return () => clearTimeout(initialTimer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const triggerNewPopup = () => {
        const randomName = NAMES[Math.floor(Math.random() * NAMES.length)];
        const randomCity = CITIES[Math.floor(Math.random() * CITIES.length)];
        const randomTimeKey = TIME_KEYS[Math.floor(Math.random() * TIME_KEYS.length)];

        const roll = Math.random();
        let amountNum = "1";
        let amountKey: AmountKey = "popup_box";
        if (roll > 0.8) { amountNum = "20"; amountKey = "popup_boxes"; }
        else if (roll > 0.5) { amountNum = "5"; amountKey = "popup_boxes"; }

        setCurrentPurchase({ name: randomName, city: randomCity, timeKey: randomTimeKey, amountKey, amountNum });
        setIsVisible(true);

        setTimeout(() => {
            setIsVisible(false);
            const nextDelay = Math.floor(Math.random() * 60000) + 30000;
            setTimeout(triggerNewPopup, nextDelay);
        }, 5000);
    };

    return (
        <AnimatePresence>
            {isVisible && currentPurchase && (
                <motion.div
                    initial={{ opacity: 0, y: 50, x: -20 }}
                    animate={{ opacity: 1, y: 0, x: 0 }}
                    exit={{ opacity: 0, y: 20, scale: 0.95 }}
                    className="fixed bottom-6 left-6 z-50 glass-panel border-brand-gold/30 p-4 rounded-xl flex items-start gap-4 shadow-2xl max-w-[320px] pointer-events-none"
                >
                    <div className="w-10 h-10 rounded-full bg-brand-gold/20 border border-brand-gold/40 flex items-center justify-center shrink-0">
                        <PackageCheck className="w-5 h-5 text-brand-gold" />
                    </div>
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                            <span className="text-white text-sm font-medium">{currentPurchase.name}</span>
                            <span className="text-white/40 text-xs">{t('popup_from')} {currentPurchase.city}</span>
                        </div>
                        <p className="text-brand-gold/90 text-sm">
                            {t('popup_purchased')} <strong className="text-brand-gold font-bold">{currentPurchase.amountNum} {t(currentPurchase.amountKey)}</strong> {t('popup_of_retatrutide')}.
                        </p>
                        <div className="flex items-center gap-1 mt-1 text-[10px] text-white/50">
                            <CheckCircle2 className="w-3 h-3 text-green-400" />
                            <span>{t('popup_verified_order')} • {t(currentPurchase.timeKey)}</span>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
