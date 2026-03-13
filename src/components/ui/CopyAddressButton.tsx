"use client";

import { useState } from "react";
import { usePostHog } from "posthog-js/react";
import { Copy, Check } from "lucide-react";

interface CopyAddressButtonProps {
    address: string;
    labelCopy: string;
    labelCopied: string;
}

export function CopyAddressButton({ address, labelCopy, labelCopied }: CopyAddressButtonProps) {
    const [copied, setCopied] = useState(false);
    const posthog = usePostHog();

    const handleCopy = async () => {
        posthog?.capture('checkout_address_copied');
        try {
            await navigator.clipboard.writeText(address);
        } catch {
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
        setTimeout(() => setCopied(false), 3000);
    };

    return (
        <div className="w-full flex flex-col gap-3">
            {/* Address display — readable, selectable */}
            <div className="bg-t-bg-subtle border border-t-border rounded-2xl px-4 py-4">
                <p className="font-mono text-sm text-t-text-2 break-all leading-relaxed select-all text-center">
                    {address}
                </p>
            </div>

            {/* Big copy button */}
            <button
                onClick={handleCopy}
                aria-label={copied ? labelCopied : labelCopy}
                className={`w-full flex items-center justify-center gap-3 py-5 rounded-2xl text-lg font-bold transition-all duration-300 active:scale-95 ${
                    copied
                        ? "bg-green-500 text-white shadow-[0_0_25px_rgba(34,197,94,0.5)]"
                        : "bg-t-btn text-t-btn-text shadow-[0_0_25px_rgba(212,175,55,0.4)] hover:bg-t-accent-hover"
                }`}
            >
                {copied ? (
                    <>
                        <Check className="w-6 h-6" />
                        {labelCopied}
                    </>
                ) : (
                    <>
                        <Copy className="w-6 h-6" />
                        {labelCopy}
                    </>
                )}
            </button>
        </div>
    );
}
