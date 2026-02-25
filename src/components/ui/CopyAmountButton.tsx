"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";

interface CopyAmountButtonProps {
    amount: string | number;
}

export function CopyAmountButton({ amount }: CopyAmountButtonProps) {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(String(amount));
        } catch {
            const ta = document.createElement("textarea");
            ta.value = String(amount);
            ta.style.position = "fixed";
            ta.style.opacity = "0";
            document.body.appendChild(ta);
            ta.focus();
            ta.select();
            document.execCommand("copy");
            document.body.removeChild(ta);
        }
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
    };

    return (
        <button
            onClick={handleCopy}
            aria-label="Copy amount"
            className="flex items-center justify-center gap-2.5 group"
        >
            <span className="text-6xl font-bold text-brand-gold tracking-tight leading-none">
                {amount}
            </span>
            <span className={`transition-colors duration-200 ${
                copied
                    ? "text-green-400"
                    : "text-brand-gold/35 group-hover:text-brand-gold/70"
            }`}>
                {copied
                    ? <Check className="w-5 h-5" />
                    : <Copy className="w-5 h-5 mt-1" />
                }
            </span>
        </button>
    );
}
