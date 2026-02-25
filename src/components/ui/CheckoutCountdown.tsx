"use client";

import { useState, useEffect } from "react";
import { Clock } from "lucide-react";

interface CheckoutCountdownProps {
  createdAt: string;
  labelValid: string;
  labelExpires: string;
  labelExpired: string;
  className?: string;
}

const ORDER_TTL_MS = 24 * 60 * 60 * 1000;

function calcRemaining(createdAt: string): number {
  const expiresAt = new Date(createdAt).getTime() + ORDER_TTL_MS;
  return Math.max(0, expiresAt - Date.now());
}

function formatTime(ms: number): { h: number; m: number; s: number } {
  const totalSec = Math.floor(ms / 1000);
  return {
    h: Math.floor(totalSec / 3600),
    m: Math.floor((totalSec % 3600) / 60),
    s: totalSec % 60,
  };
}

export function CheckoutCountdown({ createdAt, labelValid, labelExpires, labelExpired, className = '' }: CheckoutCountdownProps) {
  // Initialize null to avoid SSR/client mismatch (Date.now() differs between server and client)
  const [remaining, setRemaining] = useState<number | null>(null);

  useEffect(() => {
    // Set initial value only on client
    setRemaining(calcRemaining(createdAt));

    const tick = setInterval(() => {
      const r = calcRemaining(createdAt);
      setRemaining(r);
      if (r <= 0) clearInterval(tick);
    }, 1000);
    return () => clearInterval(tick);
  }, [createdAt]);

  // Don't render until client-side hydration is complete
  if (remaining === null) return null;

  const { h, m, s } = formatTime(remaining);
  const pad = (n: number) => String(n).padStart(2, "0");

  const isExpired = remaining <= 0;
  const isCritical = remaining > 0 && remaining < 15 * 60 * 1000;
  const isWarning = remaining > 0 && remaining < 60 * 60 * 1000;

  const colorClass = isExpired || isCritical
    ? "text-red-400 border-red-500/30 bg-red-500/5"
    : isWarning
    ? "text-yellow-400 border-yellow-500/30 bg-yellow-500/5"
    : "text-white/50 border-white/10 bg-white/3";

  const timeStr = `${pad(h)}:${pad(m)}:${pad(s)}`;
  const label = isExpired ? labelExpired : h > 0 ? labelValid : labelExpires;

  return (
    <div className={`flex items-center justify-center gap-2 px-4 py-2 rounded-xl border font-mono ${colorClass} transition-colors duration-500 ${className}`}>
      <Clock className="w-4 h-4 shrink-0" />
      <span className="font-sans font-medium">{label}</span>
      {!isExpired && (
        <span className="tabular-nums tracking-wider">{timeStr}</span>
      )}
    </div>
  );
}
