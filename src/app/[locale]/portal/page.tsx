import { getTranslations } from "next-intl/server";
import { PortalForm } from "@/components/ui/PortalForm";
import { ArrowLeft, Navigation, ShieldCheck } from "lucide-react";
import Link from "next/link";

export const metadata = {
    title: "Track Your Order | Aura Peptides",
    description: "Securely track your premium research peptide order.",
};

export default async function PortalPage(props: {
    params: Promise<{ locale: string }>;
}) {
    const params = await props.params;
    const t = await getTranslations({ locale: params.locale, namespace: 'Index' });

    return (
        <main className="min-h-screen bg-brand-void text-white font-sans flex flex-col relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-brand-gold/5 blur-[120px] rounded-full pointer-events-none translate-x-1/2 -translate-y-1/2"></div>
            <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-brand-gold/5 blur-[120px] rounded-full pointer-events-none -translate-x-1/2 translate-y-1/2"></div>

            {/* Simple Nav */}
            <nav className="relative z-10 p-6 flex justify-between items-center border-b border-white/5">
                <Link href={`/${params.locale}`} className="flex items-center gap-2 text-white/50 hover:text-brand-gold transition-colors text-sm">
                    <ArrowLeft className="w-4 h-4" /> {t('nav_home')}
                </Link>
                <div className="flex items-center gap-2 opacity-50">
                    <div className="w-6 h-6 rounded-full border border-brand-gold flex items-center justify-center">
                        <div className="w-2 h-2 bg-brand-gold rounded-full"></div>
                    </div>
                    <span className="text-sm font-medium tracking-widest uppercase">Aura</span>
                </div>
            </nav>

            <div className="flex-1 flex flex-col items-center justify-center p-6 py-12 relative z-10 w-full">
                <div className="text-center mb-10">
                    <h1 className="text-3xl md:text-5xl font-light mb-4">{t('portal_title')}</h1>
                    <p className="text-white/50 max-w-md mx-auto text-sm">{t('portal_subtitle')}</p>
                </div>

                <div className="w-full max-w-2xl px-2">
                    <PortalForm />
                </div>
            </div>

            {/* Minimal Footer */}
            <footer className="relative z-10 border-t border-white/5 py-8 px-6 bg-[#050505]/50 backdrop-blur-sm mt-auto">
                <div className="max-w-4xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-white/30">
                    <p>{t('footer_copy')}</p>
                    <div className="flex gap-4 items-center">
                        <span className="flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3 text-brand-gold" /> {t('footer_secure')}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                            <Navigation className="w-3 h-3 text-brand-gold" /> EU Logistics
                        </span>
                    </div>
                </div>
            </footer>
        </main>
    );
}
