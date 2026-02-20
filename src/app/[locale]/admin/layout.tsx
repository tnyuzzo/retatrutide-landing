import { ReactNode } from "react";
import { ShieldAlert } from "lucide-react";

export default function AdminLayout({ children }: { children: ReactNode }) {
    // Nota: implementare un vero check di sessione/auth (es. Supabase Auth) in produzione.
    // Qui inseriamo un layout di base protetto per l'admin.

    return (
        <div className="min-h-screen bg-[#070A0F] text-white flex flex-col font-sans">
            {/* Topbar Admin */}
            <header className="w-full border-b border-white/5 bg-black/40 backdrop-blur-md p-4 flex justify-between items-center z-50">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg border border-brand-gold/30 bg-brand-gold/10 flex items-center justify-center">
                        <ShieldAlert className="w-4 h-4 text-brand-gold" />
                    </div>
                    <span className="font-medium tracking-wide">Aura Admin <span className="text-white/40 font-light ml-1">Orders</span></span>
                </div>
                <div className="text-xs text-white/40">
                    SuperUser Session
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 p-6 md:p-12 overflow-x-hidden">
                {children}
            </main>
        </div>
    );
}
