"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, PackageCheck } from "lucide-react";

const NAMES = ["Michael R.", "Elena S.", "David K.", "Dr. Thomas", "Sarah M.", "Andreas W.", "Laura C.", "Dr. Petrov", "James H.", "Anna L."];
const CITIES = ["Berlin", "London", "Munich", "Vienna", "Zurich", "Paris", "Amsterdam", "Stockholm", "Copenhagen", "Geneva", "Rome", "Madrid"];
const TIMES = ["just now", "2 minutes ago", "5 minutes ago", "12 minutes ago", "1 hour ago"];

export function RecentSalesPopup() {
    const [isVisible, setIsVisible] = useState(false);
    const [currentPurchase, setCurrentPurchase] = useState({ name: "", city: "", time: "", amount: "" });

    useEffect(() => {
        const initialTimer = setTimeout(() => {
            triggerNewPopup();
        }, 15000);

        return () => clearTimeout(initialTimer);
    }, []);

    const triggerNewPopup = () => {
        const randomName = NAMES[Math.floor(Math.random() * NAMES.length)];
        const randomCity = CITIES[Math.floor(Math.random() * CITIES.length)];
        const randomTime = TIMES[Math.floor(Math.random() * TIMES.length)];

        const roll = Math.random();
        let amount = "1 Box";
        if (roll > 0.8) amount = "20 Boxes";
        else if (roll > 0.5) amount = "5 Boxes";

        setCurrentPurchase({ name: randomName, city: randomCity, time: randomTime, amount });
        setIsVisible(true);

        setTimeout(() => {
            setIsVisible(false);
            const nextDelay = Math.floor(Math.random() * 60000) + 30000;
            setTimeout(triggerNewPopup, nextDelay);
        }, 5000);
    };

    return (
        <AnimatePresence>
            {isVisible && (
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
                            <span className="text-white/40 text-xs">from {currentPurchase.city}</span>
                        </div>
                        <p className="text-brand-gold/90 text-sm">
                            Purchased <strong className="text-brand-gold font-bold">{currentPurchase.amount}</strong> of Retatrutide.
                        </p>
                        <div className="flex items-center gap-1 mt-1 text-[10px] text-white/50">
                            <CheckCircle2 className="w-3 h-3 text-green-400" />
                            <span>Verified Order • {currentPurchase.time}</span>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
