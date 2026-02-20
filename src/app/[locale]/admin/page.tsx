"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { RefreshCw, Search, CheckCircle, Clock, XCircle, Package, ExternalLink } from "lucide-react";

type OrderStatus = 'pending' | 'paid' | 'shipped' | 'failed' | 'cancelled';

type Order = {
    id: string;
    reference_id: string;
    created_at: string;
    crypto_amount: number;
    crypto_currency: string;
    fiat_amount: number;
    status: OrderStatus;
    email: string | null;
    shipping_address?: { name?: string; line1?: string; city?: string; country?: string };
    tracking_number?: string;
    items?: any[];
};

const StatusBadge = ({ status }: { status: OrderStatus }) => {
    switch (status) {
        case 'paid': return <span className="px-2 py-1 text-xs rounded-full bg-green-500/10 text-green-400 border border-green-500/20 flex items-center w-fit gap-1"><CheckCircle className="w-3 h-3" /> Paid (To Ship)</span>;
        case 'shipped': return <span className="px-2 py-1 text-xs rounded-full bg-brand-gold/10 text-brand-gold border border-brand-gold/20 flex items-center w-fit gap-1"><Package className="w-3 h-3" /> Shipped</span>;
        case 'pending': return <span className="px-2 py-1 text-xs rounded-full bg-white/5 text-white/50 border border-white/10 flex items-center w-fit gap-1"><Clock className="w-3 h-3" /> Pending</span>;
        default: return <span className="px-2 py-1 text-xs rounded-full bg-red-500/10 text-red-400 border border-red-500/20 flex items-center w-fit gap-1"><XCircle className="w-3 h-3" /> Failed</span>;
    }
};

export default function AdminDashboard() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [inventory, setInventory] = useState<{ quantity: number } | null>(null);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [trackingInput, setTrackingInput] = useState<{ [key: string]: string }>({});
    const [updatingParams, setUpdatingParams] = useState<{ [key: string]: boolean }>({});

    const fetchData = async () => {
        setLoading(true);
        // GET ORDERS (Assumes RLS allows select for current user or uses Service Role in real app)
        const { data: dbOrders, error: orderErr } = await supabase
            .from('orders')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(100);

        if (!orderErr && dbOrders) {
            setOrders(dbOrders);
        }

        // GET INVENTORY
        const { data: invData } = await supabase
            .from('inventory')
            .select('quantity')
            .eq('sku', 'RET-KIT-1')
            .single();

        if (invData) setInventory(invData);

        setLoading(false);
    };

    useEffect(() => {
        fetchData();
    }, []);

    const markAsShipped = async (orderId: string) => {
        const tracking = trackingInput[orderId];
        if (!tracking) return;

        setUpdatingParams(prev => ({ ...prev, [orderId]: true }));

        const { error } = await supabase
            .from('orders')
            .update({
                status: 'shipped',
                tracking_number: tracking,
                shipped_at: new Date().toISOString()
            })
            .eq('id', orderId);

        if (!error) {
            setOrders(orders.map(o => o.id === orderId ? { ...o, status: 'shipped', tracking_number: tracking } : o));
        } else {
            alert("Errore durante l'aggiornamento dell'ordine.");
        }

        setUpdatingParams(prev => ({ ...prev, [orderId]: false }));
    };

    const filteredOrders = orders.filter(o =>
        o.reference_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (o.email && o.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (o.shipping_address?.name && o.shipping_address.name.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div className="max-w-7xl mx-auto flex flex-col gap-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-light">Gestione <span className="text-brand-gold font-medium">Logistica</span></h1>
                    <p className="text-white/40 text-sm mt-1">Evasione ordini e tracking.</p>
                </div>

                <div className="flex gap-4 w-full md:w-auto items-center">
                    {inventory && (
                        <div className="bg-white/5 border border-white/10 px-4 py-2 rounded-lg mr-4">
                            <span className="text-xs text-white/50 uppercase block">Scorte (RET-KIT-1)</span>
                            <span className={`font-mono text-lg ${inventory.quantity < 20 ? 'text-red-400' : 'text-green-400'}`}>
                                {inventory.quantity} units
                            </span>
                        </div>
                    )}
                    <div className="relative flex-1 md:w-64">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                        <input
                            type="text"
                            placeholder="Cerca TxID, Email o Nome..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-brand-gold/50 transition-colors"
                        />
                    </div>
                    <button onClick={fetchData} className="bg-white/5 border border-white/10 p-2 rounded-lg hover:bg-white/10 transition-colors text-white/70">
                        <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </div>

            <div className="glass-panel overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-white/5 bg-white/[0.02]">
                                <th className="p-4 text-xs font-medium text-white/40 uppercase tracking-wider">Ref ID & Cliente</th>
                                <th className="p-4 text-xs font-medium text-white/40 uppercase tracking-wider">Metodo</th>
                                <th className="p-4 text-xs font-medium text-white/40 uppercase tracking-wider">Stato</th>
                                <th className="p-4 text-xs font-medium text-white/40 uppercase tracking-wider">Destinazione</th>
                                <th className="p-4 text-xs font-medium text-white/40 uppercase tracking-wider">Azione (Fulfillment)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={5} className="p-8 text-center text-white/30 text-sm">Caricamento ordini dal DB (Verifica RLS se non appaiono)...</td></tr>
                            ) : filteredOrders.length === 0 ? (
                                <tr><td colSpan={5} className="p-8 text-center text-white/30 text-sm">Nessun ordine trovato.</td></tr>
                            ) : (
                                filteredOrders.map((order) => (
                                    <tr key={order.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors group">
                                        <td className="p-4">
                                            <div className="font-mono text-sm text-brand-gold" title={order.reference_id}>{order.reference_id.substring(0, 8)}...</div>
                                            <div className="text-xs text-white/50">{new Date(order.created_at).toLocaleDateString()}</div>
                                            {order.email && <div className="text-xs text-white/70 mt-1">{order.email}</div>}
                                        </td>
                                        <td className="p-4">
                                            <div className="text-sm">{order.crypto_amount || '?'} {order.crypto_currency}</div>
                                            <div className="text-xs text-white/40">~ €{order.fiat_amount}</div>
                                            {order.items && order.items.length > 0 && (
                                                <div className="text-xs text-blue-400 mt-1">
                                                    {order.items.reduce((acc, i) => acc + (i.quantity || 1), 0)}x Kit
                                                </div>
                                            )}
                                        </td>
                                        <td className="p-4">
                                            <StatusBadge status={order.status} />
                                        </td>
                                        <td className="p-4">
                                            {order.shipping_address ? (
                                                <div className="text-xs text-white/60">
                                                    <strong className="text-white/80">{order.shipping_address.name}</strong><br />
                                                    {order.shipping_address.city}, {order.shipping_address.country}
                                                </div>
                                            ) : (
                                                <span className="text-xs text-white/20">Nessun indirizzo</span>
                                            )}
                                        </td>
                                        <td className="p-4">
                                            {order.status === 'paid' ? (
                                                <div className="flex gap-2 items-center">
                                                    <input
                                                        type="text"
                                                        placeholder="Tracking GLS/DHL..."
                                                        className="bg-black/20 border border-white/10 rounded px-2 py-1 text-xs w-32 focus:border-brand-gold/50"
                                                        value={trackingInput[order.id] || ''}
                                                        onChange={e => setTrackingInput({ ...trackingInput, [order.id]: e.target.value })}
                                                    />
                                                    <button
                                                        onClick={() => markAsShipped(order.id)}
                                                        disabled={!trackingInput[order.id] || updatingParams[order.id]}
                                                        className="bg-brand-gold/20 text-brand-gold disabled:opacity-50 px-3 py-1 rounded text-xs hover:bg-brand-gold/30 transition-colors"
                                                    >
                                                        {updatingParams[order.id] ? '...' : 'Evadi'}
                                                    </button>
                                                </div>
                                            ) : order.status === 'shipped' ? (
                                                <div className="text-xs text-white/50 flex items-center gap-1">
                                                    <CheckCircle className="w-3 h-3 text-brand-gold" />
                                                    {order.tracking_number}
                                                </div>
                                            ) : (
                                                <span className="text-xs text-white/30">-</span>
                                            )}
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
