"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { RefreshCw, Search, CheckCircle, Clock, XCircle } from "lucide-react";

// Tipi fittizi per l'interfaccia
type OrderStatus = 'pending' | 'paid' | 'shipped' | 'failed';
type Order = {
    id: string;
    reference_id: string;
    created_at: string;
    crypto_amount: number;
    crypto_currency: string;
    fiat_amount: number;
    status: OrderStatus;
    email: string | null;
};

const StatusBadge = ({ status }: { status: OrderStatus }) => {
    switch (status) {
        case 'paid': return <span className="px-2 py-1 text-xs rounded-full bg-green-500/10 text-green-400 border border-green-500/20 flex items-center w-fit gap-1"><CheckCircle className="w-3 h-3" /> Paid</span>;
        case 'shipped': return <span className="px-2 py-1 text-xs rounded-full bg-brand-gold/10 text-brand-gold border border-brand-gold/20 flex items-center w-fit gap-1"><CheckCircle className="w-3 h-3" /> Shipped</span>;
        case 'pending': return <span className="px-2 py-1 text-xs rounded-full bg-white/5 text-white/50 border border-white/10 flex items-center w-fit gap-1"><Clock className="w-3 h-3" /> Pending</span>;
        default: return <span className="px-2 py-1 text-xs rounded-full bg-red-500/10 text-red-400 border border-red-500/20 flex items-center w-fit gap-1"><XCircle className="w-3 h-3" /> Failed</span>;
    }
};

export default function AdminDashboard() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchOrders = async () => {
        setLoading(true);
        // Nota: questo richiederà le API key reali di Supabase con Row Level Security permessa all'admin
        const { data, error } = await supabase
            .from('orders')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(50);

        if (!error && data) {
            setOrders(data);
        } else {
            // Mock data se non c'è connessione Supabase
            setOrders([
                { id: "1", reference_id: "tx-ret-88x", created_at: new Date().toISOString(), crypto_amount: 0.0015, crypto_currency: "BTC", fiat_amount: 150, status: "pending", email: "anon_user_1@proton.me" },
                { id: "2", reference_id: "tx-ret-99y", created_at: new Date(Date.now() - 86400000).toISOString(), crypto_amount: 0.95, crypto_currency: "XMR", fiat_amount: 150, status: "paid", email: null },
                { id: "3", reference_id: "tx-ret-00z", created_at: new Date(Date.now() - 172800000).toISOString(), crypto_amount: 150, crypto_currency: "USDT", fiat_amount: 150, status: "shipped", email: "client_vip@tutanota.com" },
            ]);
        }
        setLoading(false);
    };

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        fetchOrders();
    }, []);

    return (
        <div className="max-w-7xl mx-auto flex flex-col gap-8">

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-light">Gestione <span className="text-brand-gold font-medium">Ordini</span></h1>
                    <p className="text-white/40 text-sm mt-1">Monitora pagamenti Crypto ed effettua fulfillment.</p>
                </div>

                <div className="flex gap-4 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                        <input
                            type="text"
                            placeholder="Cerca via TxID o Email..."
                            className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-brand-gold/50 transition-colors"
                        />
                    </div>
                    <button onClick={fetchOrders} className="bg-white/5 border border-white/10 p-2 rounded-lg hover:bg-white/10 transition-colors text-white/70">
                        <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </div>

            <div className="glass-panel overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-white/5 bg-white/[0.02]">
                                <th className="p-4 text-xs font-medium text-white/40 uppercase tracking-wider">Ref ID</th>
                                <th className="p-4 text-xs font-medium text-white/40 uppercase tracking-wider">Data</th>
                                <th className="p-4 text-xs font-medium text-white/40 uppercase tracking-wider">Metodo Pagamento</th>
                                <th className="p-4 text-xs font-medium text-white/40 uppercase tracking-wider">Importo</th>
                                <th className="p-4 text-xs font-medium text-white/40 uppercase tracking-wider">Email (se fornita)</th>
                                <th className="p-4 text-xs font-medium text-white/40 uppercase tracking-wider">Stato</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="p-8 text-center text-white/30 text-sm">Caricamento ordini dal DB...</td>
                                </tr>
                            ) : orders.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="p-8 text-center text-white/30 text-sm">Nessun ordine trovato.</td>
                                </tr>
                            ) : (
                                orders.map((order) => (
                                    <tr key={order.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors group">
                                        <td className="p-4 font-mono text-sm text-brand-gold">{order.reference_id}</td>
                                        <td className="p-4 text-sm text-white/70">{new Date(order.created_at).toLocaleDateString()}</td>
                                        <td className="p-4 text-sm">
                                            <span className="font-mono bg-white/5 px-2 py-1 rounded text-xs">{order.crypto_currency}</span>
                                        </td>
                                        <td className="p-4">
                                            <div className="text-sm">{order.crypto_amount} {order.crypto_currency}</div>
                                            <div className="text-xs text-white/40">~ €{order.fiat_amount}</div>
                                        </td>
                                        <td className="p-4 text-sm text-white/50">{order.email || 'Anonimo'}</td>
                                        <td className="p-4">
                                            <StatusBadge status={order.status} />
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

        </div>
    );
}
