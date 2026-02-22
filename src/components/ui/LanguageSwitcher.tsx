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
        { code: 'en', label: 'EN' },
        { code: 'it', label: 'IT' },
        { code: 'fr', label: 'FR' },
        { code: 'de', label: 'DE' },
        { code: 'es', label: 'ES' },
        { code: 'pt', label: 'PT' },
        { code: 'pl', label: 'PL' },
        { code: 'ru', label: 'RU' },
        { code: 'uk', label: 'UK' },
        { code: 'ar', label: 'AR' }
    ];

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Desktop View */}
            <div className="hidden lg:flex gap-3 text-xs tracking-widest">
                {languages.map((lang) => (
                    <span
                        key={lang.code}
                        onClick={() => handleLocaleChange(lang.code)}
                        className={`cursor-pointer transition-colors uppercase ${locale === lang.code
                            ? 'text-brand-gold font-medium'
                            : 'text-white/40 hover:text-white'
                            }`}
                    >
                        {lang.label}
                    </span>
                ))}
            </div>

            {/* Mobile View (Dropdown) */}
            <div className="lg:hidden flex items-center">
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="flex items-center gap-1 text-xs tracking-widest uppercase text-brand-gold font-medium bg-brand-gold/10 px-3 py-1.5 rounded-full border border-brand-gold/30 hover:bg-brand-gold/20 transition-colors"
                >
                    {locale} <ChevronDown className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </button>

                {isOpen && (
                    <div className="absolute right-0 top-full mt-4 bg-brand-void/95 backdrop-blur-xl border border-brand-gold/20 rounded-xl p-4 flex flex-col gap-4 shadow-2xl z-50 min-w-[80px]">
                        {languages.map((lang) => (
                            <span
                                key={lang.code}
                                onClick={() => {
                                    handleLocaleChange(lang.code);
                                    setIsOpen(false);
                                }}
                                className={`cursor-pointer transition-colors text-xs tracking-widest uppercase text-right ${locale === lang.code
                                    ? 'text-brand-gold font-medium'
                                    : 'text-white/50 hover:text-white'
                                    }`}
                            >
                                {lang.label}
                            </span>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
