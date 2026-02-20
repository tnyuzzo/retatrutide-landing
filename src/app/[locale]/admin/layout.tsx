"use client";

import { ReactNode, useEffect, useState } from "react";
import { ShieldAlert, LogOut, Loader2 } from "lucide-react";
import { supabaseBrowser } from "@/lib/supabase-browser";
import type { User } from "@supabase/supabase-js";

export default function AdminLayout({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loginLoading, setLoginLoading] = useState(false);

    useEffect(() => {
        supabaseBrowser.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user ?? null);
            setLoading(false);
        });

        const { data: { subscription } } = supabaseBrowser.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
        });

        return () => subscription.unsubscribe();
    }, []);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoginLoading(true);
        setError("");

        const { error } = await supabaseBrowser.auth.signInWithPassword({ email, password });

        if (error) {
            setError(error.message);
        }
        setLoginLoading(false);
    };

    const handleLogout = async () => {
        await supabaseBrowser.auth.signOut();
        setUser(null);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#070A0F] text-white flex items-center justify-center">
                <Loader2 className="w-6 h-6 text-brand-gold animate-spin" />
            </div>
        );
    }

    // Login Screen
    if (!user) {
        return (
            <div className="min-h-screen bg-[#070A0F] text-white flex items-center justify-center font-sans p-6">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brand-gold/5 blur-[120px] rounded-full pointer-events-none"></div>

                <form onSubmit={handleLogin} className="relative z-10 w-full max-w-sm flex flex-col gap-6 p-8 rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-xl border border-brand-gold/30 bg-brand-gold/10 flex items-center justify-center">
                            <ShieldAlert className="w-5 h-5 text-brand-gold" />
                        </div>
                        <div>
                            <h1 className="text-lg font-medium">Aura Admin</h1>
                            <p className="text-xs text-white/40">Pannello di gestione</p>
                        </div>
                    </div>

                    <div className="flex flex-col gap-4">
                        <input
                            type="email"
                            placeholder="Email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-brand-gold/50 transition-colors"
                            required
                        />
                        <input
                            type="password"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-brand-gold/50 transition-colors"
                            required
                        />
                    </div>

                    {error && (
                        <p className="text-red-400 text-xs text-center">{error}</p>
                    )}

                    <button
                        type="submit"
                        disabled={loginLoading}
                        className="w-full bg-brand-gold text-black font-medium py-3 rounded-xl hover:bg-brand-gold/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {loginLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                        {loginLoading ? "Accesso..." : "Accedi"}
                    </button>
                </form>
            </div>
        );
    }

    const role = (user.app_metadata?.role as string) || "customer";

    return (
        <div className="min-h-screen bg-[#070A0F] text-white flex flex-col font-sans">
            {/* Topbar Admin */}
            <header className="w-full border-b border-white/5 bg-black/40 backdrop-blur-md p-4 flex justify-between items-center z-50">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg border border-brand-gold/30 bg-brand-gold/10 flex items-center justify-center">
                        <ShieldAlert className="w-4 h-4 text-brand-gold" />
                    </div>
                    <span className="font-medium tracking-wide">Aura Admin <span className="text-white/40 font-light ml-1">{role}</span></span>
                </div>
                <div className="flex items-center gap-4">
                    <span className="text-xs text-white/40 hidden md:block">{user.email}</span>
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 text-xs text-white/50 hover:text-red-400 transition-colors border border-white/10 px-3 py-1.5 rounded-lg"
                    >
                        <LogOut className="w-3 h-3" /> Esci
                    </button>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 p-6 md:p-12 overflow-x-hidden">
                {children}
            </main>
        </div>
    );
}
