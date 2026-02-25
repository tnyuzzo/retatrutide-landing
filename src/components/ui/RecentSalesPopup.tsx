"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, PackageCheck } from "lucide-react";
import { useTranslations, useLocale } from "next-intl";

// Cities grouped by locale — visitor sees cities from their own country
const CITIES_BY_LOCALE: Record<string, string[]> = {
    it: ["Milano", "Roma", "Napoli", "Torino", "Firenze", "Bologna", "Palermo", "Genova", "Verona", "Catania", "Bari", "Padova", "Trieste", "Perugia", "Bergamo"],
    de: ["Berlin", "München", "Hamburg", "Frankfurt", "Köln", "Stuttgart", "Düsseldorf", "Leipzig", "Dresden", "Wien", "Graz", "Zürich", "Hannover", "Nürnberg", "Bremen"],
    fr: ["Paris", "Lyon", "Marseille", "Toulouse", "Nice", "Strasbourg", "Bordeaux", "Nantes", "Lille", "Montpellier", "Rennes", "Grenoble", "Dijon", "Toulon", "Angers"],
    es: ["Madrid", "Barcelona", "Valencia", "Sevilla", "Málaga", "Bilbao", "Zaragoza", "Alicante", "Palma", "Granada", "Murcia", "Vigo", "Gijón", "Córdoba", "Valladolid"],
    pt: ["Lisboa", "Porto", "Braga", "Coimbra", "Funchal", "Faro", "Aveiro", "Évora", "Setúbal", "Viseu", "Leiria", "Guimarães", "Viana do Castelo", "Beja", "Santarém"],
    pl: ["Warszawa", "Kraków", "Wrocław", "Gdańsk", "Poznań", "Łódź", "Katowice", "Szczecin", "Lublin", "Bydgoszcz", "Białystok", "Toruń", "Rzeszów", "Kielce", "Olsztyn"],
    ru: ["București", "Praha", "Budapest", "Sofia", "Bratislava", "Ljubljana", "Zagreb", "Vilnius", "Riga", "Tallinn", "Helsinki", "Athina", "Nicosia", "Valletta", "Dublin"],
    uk: ["București", "Praha", "Budapest", "Sofia", "Bratislava", "Ljubljana", "Zagreb", "Vilnius", "Riga", "Tallinn", "Helsinki", "Athina", "Nicosia", "Valletta", "Warszawa"],
    ar: ["Berlin", "Paris", "Amsterdam", "Bruxelles", "Stockholm", "Wien", "Milano", "Madrid", "Lisboa", "København", "Helsinki", "Praha", "Budapest", "Warszawa", "Dublin"],
    en: ["Amsterdam", "Rotterdam", "Bruxelles", "Dublin", "Stockholm", "København", "Helsinki", "London", "Edinburgh", "Manchester", "Birmingham", "Leeds", "Bristol", "Liverpool", "Glasgow"],
};

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

interface ToastEntry {
    city: string;
    quantity: number;
}

type TimeKey = "popup_just_now" | "popup_2min_ago" | "popup_5min_ago" | "popup_12min_ago" | "popup_1hour_ago";
type AmountKey = "popup_box" | "popup_boxes";

export function RecentSalesPopup() {
    const t = useTranslations('Index');
    const locale = useLocale();
    const [isVisible, setIsVisible] = useState(false);
    const [entries, setEntries] = useState<ToastEntry[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [timeKey, setTimeKey] = useState<TimeKey>("popup_just_now");
    const mounted = useRef(true);

    useEffect(() => {
        mounted.current = true;
        const cities = CITIES_BY_LOCALE[locale] || CITIES_BY_LOCALE.en;
        const shuffled = shuffle(cities);
        // Generate entries with weighted quantities (mostly 1-2)
        const generated: ToastEntry[] = shuffled.map(city => ({
            city,
            quantity: Math.random() < 0.55 ? 1 : Math.random() < 0.75 ? 2 : Math.random() < 0.9 ? 3 : Math.ceil(Math.random() * 3) + 2,
        }));
        setEntries(generated);
        return () => { mounted.current = false; };
    }, [locale]);

    const showNextPopup = useCallback((idx: number, items: ToastEntry[]) => {
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
                            <span className="text-white/60 text-sm">{t('popup_researcher')} {t('popup_from')} <strong className="text-white">{current.city}</strong></span>
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
