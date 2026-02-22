"use client";

import { useLocale } from 'next-intl';
import { usePathname, useRouter } from '@/i18n/routing';

export function LanguageSwitcher() {
    const locale = useLocale();
    const router = useRouter();
    const pathname = usePathname();

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
        <div className="flex gap-3 text-xs tracking-widest">
            {languages.map((lang) => (
                <span
                    key={lang.code}
                    onClick={() => handleLocaleChange(lang.code)}
                    className={`cursor-pointer transition-colors ${locale === lang.code
                        ? 'text-brand-gold font-medium'
                        : 'text-white/40 hover:text-white'
                        }`}
                >
                    {lang.label}
                </span>
            ))}
        </div>
    );
}
