import { useEffect, useState, useRef } from "react";

// Module-level singleton: one timer, shared state across all components
let currentStock = 47;
const listeners = new Set<(stock: number) => void>();
let timerActive = false;

function scheduleDecrement() {
    if (timerActive) return;
    timerActive = true;

    const tick = () => {
        const delay = 60000 + Math.random() * 120000; // 1-3 min
        setTimeout(() => {
            const drop = 1 + Math.floor(Math.random() * 5); // 1-5 units
            currentStock = Math.max(3, currentStock - drop);
            listeners.forEach(fn => fn(currentStock));
            tick();
        }, delay);
    };
    tick();
}

/**
 * Shared stock hook — all components using this hook see the same stock value
 * and it decrements from a single timer (no duplicated intervals).
 */
export function useStock(): number {
    const [stock, setStock] = useState(currentStock);
    const mounted = useRef(true);

    useEffect(() => {
        mounted.current = true;
        const listener = (val: number) => {
            if (mounted.current) setStock(val);
        };
        listeners.add(listener);
        scheduleDecrement(); // no-op if already running

        return () => {
            mounted.current = false;
            listeners.delete(listener);
        };
    }, []);

    return stock;
}
