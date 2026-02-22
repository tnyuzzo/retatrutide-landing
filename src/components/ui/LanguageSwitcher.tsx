"use client";

import { useLocale } from 'next-intl';
import { usePathname, useRouter } from '@/i18n/routing';
import { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

export function LanguageSwitcher() {
    const locale = useLocale();
    const router = useRouter();
    const pathname = usePathname();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Chiudi il menu se si clicca fuori
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleLocaleChange = (newLocale: string) => {
        router.replace(pathname, { locale: newLocale });
    };

    const languages = [
        { code: 'en', label: 'EN', flag: '🇬🇧' },
        { code: 'it', label: 'IT', flag: '🇮🇹' },
        { code: 'fr', label: 'FR', flag: '🇫🇷' },
        { code: 'de', label: 'DE', flag: '🇩🇪' },
        { code: 'es', label: 'ES', flag: '🇪🇸' },
        { code: 'pt', label: 'PT', flag: '🇵🇹' },
        { code: 'pl', label: 'PL', flag: '🇵🇱' },
        { code: 'ru', label: 'RU', flag: '🇷🇺' },
        { code: 'uk', label: 'UK', flag: '🇺🇦' },
        { code: 'ar', label: 'AR', flag: '🇸🇦' },
    ];

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Desktop View */}
            <div className="hidden lg:flex gap-3 text-xs tracking-widest">
                {languages.map((lang) => (
                    <span
                        key={lang.code}
                        onClick={() => handleLocaleChange(lang.code)}
                        className={`cursor-pointer transition-colors uppercase flex items-center gap-1 ${locale === lang.code
                            ? 'text-brand-gold font-medium'
                            : 'text-white/40 hover:text-white'
                            }`}
                    >
                        <span>{lang.flag}</span>
                        <span>{lang.label}</span>
                    </span>
                ))}
            </div>

            {/* Mobile View (Dropdown) */}
            <div className="lg:hidden flex items-center">
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="flex items-center gap-1.5 text-xs tracking-widest uppercase text-brand-gold font-medium hover:text-brand-gold-light transition-colors min-h-[44px] px-1"
                >
                    <span className="text-base leading-none">{languages.find(l => l.code === locale)?.flag}</span>
                    <span>{locale.toUpperCase()}</span>
                    <ChevronDown className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </button>

                {isOpen && (
                    <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} aria-hidden="true" />
                    <div className="absolute right-0 top-full mt-2 bg-brand-void/98 backdrop-blur-xl border border-brand-gold/20 rounded-xl p-4 flex flex-col gap-3 shadow-2xl z-50 min-w-[100px]">
                        {languages.map((lang) => (
                            <span
                                key={lang.code}
                                onClick={() => {
                                    handleLocaleChange(lang.code);
                                    setIsOpen(false);
                                }}
                                className={`cursor-pointer transition-colors text-xs tracking-widest uppercase flex items-center gap-2 ${locale === lang.code
                                    ? 'text-brand-gold font-medium'
                                    : 'text-white/50 hover:text-white'
                                    }`}
                            >
                                <span className="text-base leading-none">{lang.flag}</span>
                                <span>{lang.label}</span>
                            </span>
                        ))}
                    </div>
                    </>
                )}
            </div>
        </div>
    );
}
