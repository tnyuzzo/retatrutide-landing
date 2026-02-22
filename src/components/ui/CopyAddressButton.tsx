"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";

interface CopyAddressButtonProps {
    address: string;
    labelCopy: string;
    labelCopied: string;
}

export function CopyAddressButton({ address, labelCopy, labelCopied }: CopyAddressButtonProps) {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(address);
        } catch {
            // Fallback for older mobile browsers
            const textarea = document.createElement("textarea");
            textarea.value = address;
            textarea.style.position = "fixed";
            textarea.style.opacity = "0";
            document.body.appendChild(textarea);
            textarea.focus();
            textarea.select();
            document.execCommand("copy");
            document.body.removeChild(textarea);
        }
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
    };

    return (
        <div className="w-full flex items-center gap-2 bg-black/40 p-3 rounded-xl border border-white/5 hover:border-brand-gold/30 transition-colors">
            <span className="font-mono text-xs truncate text-white/70 tracking-tight select-all flex-1 min-w-0">
                {address}
            </span>
            <button
                onClick={handleCopy}
                aria-label={copied ? labelCopied : labelCopy}
                className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${copied
                    ? "bg-green-500/20 border border-green-500/40 text-green-400"
                    : "bg-brand-gold/10 hover:bg-brand-gold/20 border border-brand-gold/30 text-brand-gold"
                    }`}
            >
                {copied ? (
                    <Check className="w-3.5 h-3.5" />
                ) : (
                    <Copy className="w-3.5 h-3.5" />
                )}
                <span className="hidden sm:inline">
                    {copied ? labelCopied : labelCopy}
                </span>
            </button>
        </div>
    );
}
