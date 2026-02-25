"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, PackageCheck } from "lucide-react";
import { useTranslations } from "next-intl";

interface SocialProofEntry {
    name: string;
    city: string;
    quantity: number;
}

const POOL: SocialProofEntry[] = [
    // Italy (biggest market)
    { name: "Marco B.", city: "Milano", quantity: 2 },
    { name: "Luca R.", city: "Roma", quantity: 1 },
    { name: "Andrea M.", city: "Napoli", quantity: 3 },
    { name: "Giovanni P.", city: "Torino", quantity: 1 },
    { name: "Alessandro F.", city: "Firenze", quantity: 2 },
    { name: "Matteo S.", city: "Bologna", quantity: 1 },
    { name: "Davide C.", city: "Palermo", quantity: 1 },
    { name: "Roberto T.", city: "Genova", quantity: 2 },
    { name: "Simone G.", city: "Verona", quantity: 1 },
    { name: "Fabio L.", city: "Catania", quantity: 1 },
    { name: "Lorenzo D.", city: "Bari", quantity: 3 },
    { name: "Stefano V.", city: "Padova", quantity: 1 },
    { name: "Paolo N.", city: "Trieste", quantity: 2 },
    { name: "Riccardo A.", city: "Perugia", quantity: 1 },
    // Germany
    { name: "Thomas K.", city: "Berlin", quantity: 2 },
    { name: "Michael S.", city: "München", quantity: 1 },
    { name: "Stefan W.", city: "Hamburg", quantity: 3 },
    { name: "Andreas B.", city: "Frankfurt", quantity: 1 },
    { name: "Markus H.", city: "Köln", quantity: 2 },
    { name: "Jörg F.", city: "Stuttgart", quantity: 1 },
    { name: "Christian R.", city: "Düsseldorf", quantity: 1 },
    { name: "Felix M.", city: "Leipzig", quantity: 2 },
    // France
    { name: "Pierre D.", city: "Paris", quantity: 1 },
    { name: "Nicolas R.", city: "Lyon", quantity: 2 },
    { name: "Antoine L.", city: "Marseille", quantity: 1 },
    { name: "François B.", city: "Toulouse", quantity: 3 },
    { name: "Mathieu C.", city: "Nice", quantity: 1 },
    { name: "Romain P.", city: "Strasbourg", quantity: 2 },
    { name: "Julien V.", city: "Bordeaux", quantity: 1 },
    // Spain
    { name: "Carlos G.", city: "Madrid", quantity: 2 },
    { name: "Miguel A.", city: "Barcelona", quantity: 1 },
    { name: "Javier S.", city: "Valencia", quantity: 1 },
    { name: "Pablo M.", city: "Sevilla", quantity: 1 },
    { name: "Alejandro R.", city: "Málaga", quantity: 2 },
    // Netherlands & Belgium
    { name: "Jan V.", city: "Amsterdam", quantity: 2 },
    { name: "Pieter D.", city: "Rotterdam", quantity: 1 },
    { name: "Willem B.", city: "Utrecht", quantity: 1 },
    { name: "Mathieu V.", city: "Bruxelles", quantity: 1 },
    { name: "Jonas D.", city: "Antwerpen", quantity: 2 },
    // Poland
    { name: "Krzysztof N.", city: "Warszawa", quantity: 2 },
    { name: "Tomasz K.", city: "Kraków", quantity: 1 },
    { name: "Piotr W.", city: "Wrocław", quantity: 1 },
    // Portugal
    { name: "João S.", city: "Lisboa", quantity: 1 },
    { name: "Pedro M.", city: "Porto", quantity: 2 },
    // Austria
    { name: "Florian M.", city: "Wien", quantity: 1 },
    { name: "Lukas S.", city: "Graz", quantity: 2 },
    // Nordics
    { name: "Erik L.", city: "Stockholm", quantity: 1 },
    { name: "Lars N.", city: "København", quantity: 2 },
    // Others EU
    { name: "Jakub P.", city: "Praha", quantity: 1 },
    { name: "Andrei C.", city: "București", quantity: 2 },
];

const TIME_KEYS = [
    "popup_just_now", "popup_just_now",
    "popup_2min_ago", "popup_2min_ago",
    "popup_5min_ago", "popup_5min_ago",
    "popup_12min_ago",
    "popup_1hour_ago",
];

function shuffle<T>(arr: T[]): T[] {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

type TimeKey = "popup_just_now" | "popup_2min_ago" | "popup_5min_ago" | "popup_12min_ago" | "popup_1hour_ago";
type AmountKey = "popup_box" | "popup_boxes";

export function RecentSalesPopup() {
    const t = useTranslations('Index');
    const [isVisible, setIsVisible] = useState(false);
    const [entries, setEntries] = useState<SocialProofEntry[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [timeKey, setTimeKey] = useState<TimeKey>("popup_just_now");
    const mounted = useRef(true);

    useEffect(() => {
        mounted.current = true;
        setEntries(shuffle(POOL));
        return () => { mounted.current = false; };
    }, []);

    const showNextPopup = useCallback((idx: number, items: SocialProofEntry[]) => {
        if (!mounted.current) return;
        setCurrentIndex(idx);
        setTimeKey(TIME_KEYS[Math.floor(Math.random() * TIME_KEYS.length)] as TimeKey);
        setIsVisible(true);

        setTimeout(() => {
            if (!mounted.current) return;
            setIsVisible(false);
            const nextIdx = (idx + 1) % items.length;
            const delay = 30000 + Math.floor(Math.random() * 60000); // 30-90s
            setTimeout(() => showNextPopup(nextIdx, items), delay);
        }, 5000);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (entries.length === 0) return;
        const initialDelay = 15000 + Math.floor(Math.random() * 10000);
        const timer = setTimeout(() => showNextPopup(0, entries), initialDelay);
        return () => clearTimeout(timer);
    }, [entries, showNextPopup]);

    if (entries.length === 0) return null;

    const current = entries[currentIndex];
    if (!current) return null;

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
                            <span>{t('popup_verified_order')} • {t(timeKey)}</span>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
