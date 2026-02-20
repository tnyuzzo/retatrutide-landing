"use client";

import { useEffect, useState, useCallback } from "react";
import { supabaseBrowser } from "@/lib/supabase-browser";
import {
    RefreshCw, Search, CheckCircle, Clock, XCircle, Package,
    TrendingUp, ShoppingCart, BarChart3, Users, Boxes, ChevronDown
} from "lucide-react";

// ── Types ──────────────────────────────────
type OrderStatus = 'pending' | 'paid' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
type TabId = 'dashboard' | 'orders' | 'inventory' | 'customers';

type Order = {
    id: string; reference_id: string; created_at: string;
    crypto_amount: number; crypto_currency: string; fiat_amount: number;
    status: OrderStatus; email: string | null;
    shipping_address?: Record<string, string>;
    tracking_number?: string; carrier?: string; items?: { quantity?: number; name?: string }[];
};

type DashboardData = {
    revenue: { total: number; today: number; this_week: number; this_month: number; last_month: number };
    orders: { total: number; today: number; this_week: number; this_month: number; to_ship: number };
    inventory: { stock_quantity: number; low_stock: boolean };
    recent_orders: Order[];
};

type Customer = {
    email: string; total_spent: number; order_count: number; last_purchase: string;
};

// ── Helpers ──────────────────────────────────
const fmt = (n: number) => new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(n);

const StatusBadge = ({ status }: { status: OrderStatus }) => {
    const map: Record<string, { bg: string; text: string; icon: React.ReactNode; label: string }> = {
        paid: { bg: 'bg-green-500/10 border-green-500/20', text: 'text-green-400', icon: <CheckCircle className="w-3 h-3" />, label: 'Da Evadere' },
        processing: { bg: 'bg-blue-500/10 border-blue-500/20', text: 'text-blue-400', icon: <Package className="w-3 h-3" />, label: 'In Lavorazione' },
        shipped: { bg: 'bg-brand-gold/10 border-brand-gold/20', text: 'text-brand-gold', icon: <Package className="w-3 h-3" />, label: 'Spedito' },
        delivered: { bg: 'bg-emerald-500/10 border-emerald-500/20', text: 'text-emerald-400', icon: <CheckCircle className="w-3 h-3" />, label: 'Consegnato' },
        pending: { bg: 'bg-white/5 border-white/10', text: 'text-white/50', icon: <Clock className="w-3 h-3" />, label: 'In Attesa' },
        cancelled: { bg: 'bg-red-500/10 border-red-500/20', text: 'text-red-400', icon: <XCircle className="w-3 h-3" />, label: 'Annullato' },
    };
    const s = map[status] || map.pending;
    return <span className={`px-2 py-1 text-xs rounded-full ${s.bg} ${s.text} border flex items-center w-fit gap-1`}>{s.icon} {s.label}</span>;
};

const KpiCard = ({ label, value, sub, icon, accent }: { label: string; value: string; sub?: string; icon: React.ReactNode; accent?: string }) => (
    <div className="bg-white/[0.03] border border-white/8 rounded-2xl p-5 flex flex-col gap-3">
        <div className="flex items-center justify-between">
            <span className="text-xs text-white/40 uppercase tracking-wider">{label}</span>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${accent || 'bg-brand-gold/10 text-brand-gold'}`}>{icon}</div>
        </div>
        <div className="text-2xl font-semibold">{value}</div>
        {sub && <div className="text-xs text-white/40">{sub}</div>}
    </div>
);

const CARRIERS = ['GLS', 'BRT', 'DHL', 'SDA', 'UPS', 'POSTE', 'FEDEX'];

// ── Main Component ──────────────────────────────────
export default function AdminDashboard() {
    const [activeTab, setActiveTab] = useState<TabId>('dashboard');
    const [token, setToken] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    // Dashboard state
    const [dashboard, setDashboard] = useState<DashboardData | null>(null);

    // Orders state
    const [orders, setOrders] = useState<Order[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [trackingInput, setTrackingInput] = useState<Record<string, string>>({});
    const [carrierInput, setCarrierInput] = useState<Record<string, string>>({});
    const [updating, setUpdating] = useState<Record<string, boolean>>({});

    // Inventory state
    const [invStock, setInvStock] = useState(0);
    const [invMovements, setInvMovements] = useState<any[]>([]);
    const [invAction, setInvAction] = useState<'add' | 'remove'>('add');
    const [invQty, setInvQty] = useState(0);
    const [invReason, setInvReason] = useState("");

    // Customers state
    const [customers, setCustomers] = useState<Customer[]>([]);

    // Get auth token
    useEffect(() => {
        supabaseBrowser.auth.getSession().then(({ data: { session } }) => {
            setToken(session?.access_token ?? null);
        });
    }, []);

    const authHeaders = useCallback(() => ({
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
    }), [token]);

    // ── Fetchers ──────────────────────────────────
    const fetchDashboard = useCallback(async () => {
        if (!token) return;
        setLoading(true);
        try {
            const res = await fetch('/api/admin/dashboard', { headers: authHeaders() });
            if (res.ok) setDashboard(await res.json());
        } catch (e) { console.error(e); }
        setLoading(false);
    }, [token, authHeaders]);

    const fetchOrders = useCallback(async () => {
        if (!token) return;
        setLoading(true);
        try {
            const params = new URLSearchParams({ limit: '100' });
            if (statusFilter !== 'all') params.set('status', statusFilter);
            const res = await fetch(`/api/admin/orders?${params}`, { headers: authHeaders() });
            if (res.ok) { const d = await res.json(); setOrders(d.orders || []); }
        } catch (e) { console.error(e); }
        setLoading(false);
    }, [token, statusFilter, authHeaders]);

    const fetchInventory = useCallback(async () => {
        if (!token) return;
        try {
            const res = await fetch('/api/admin/inventory', { headers: authHeaders() });
            if (res.ok) {
                const d = await res.json();
                setInvStock(d.current_stock);
                setInvMovements(d.movements || []);
            }
        } catch (e) { console.error(e); }
    }, [token, authHeaders]);

    const fetchCustomers = useCallback(async () => {
        if (!token) return;
        try {
            const res = await fetch('/api/admin/customers', { headers: authHeaders() });
            if (res.ok) { const d = await res.json(); setCustomers(d.customers || []); }
        } catch (e) { console.error(e); }
    }, [token, authHeaders]);

    // Load data on tab switch
    useEffect(() => {
        if (!token) return;
        if (activeTab === 'dashboard') fetchDashboard();
        if (activeTab === 'orders') fetchOrders();
        if (activeTab === 'inventory') fetchInventory();
        if (activeTab === 'customers') fetchCustomers();
    }, [activeTab, token, fetchDashboard, fetchOrders, fetchInventory, fetchCustomers]);

    // ── Actions ──────────────────────────────────
    const shipOrder = async (orderId: string) => {
        const tracking = trackingInput[orderId];
        const carrier = carrierInput[orderId] || 'GLS';
        if (!tracking) return;
        setUpdating(p => ({ ...p, [orderId]: true }));
        try {
            const res = await fetch('/api/admin/orders', {
                method: 'POST', headers: authHeaders(),
                body: JSON.stringify({ action: 'update-status', order_id: orderId, new_status: 'shipped', tracking_number: tracking, carrier }),
            });
            if (res.ok) fetchOrders();
        } catch (e) { console.error(e); }
        setUpdating(p => ({ ...p, [orderId]: false }));
    };

    const updateInventory = async () => {
        if (invQty <= 0) return;
        try {
            await fetch('/api/admin/inventory', {
                method: 'POST', headers: authHeaders(),
                body: JSON.stringify({ type: invAction, quantity: invQty, reason: invReason || undefined }),
            });
            setInvQty(0); setInvReason("");
            fetchInventory();
        } catch (e) { console.error(e); }
    };

    const filteredOrders = orders.filter(o =>
        o.reference_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (o.email && o.email.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    // ── Tabs ──────────────────────────────────
    const tabs: { id: TabId; label: string; icon: React.ReactNode }[] = [
        { id: 'dashboard', label: 'Dashboard', icon: <BarChart3 className="w-4 h-4" /> },
        { id: 'orders', label: 'Ordini', icon: <ShoppingCart className="w-4 h-4" /> },
        { id: 'inventory', label: 'Inventario', icon: <Boxes className="w-4 h-4" /> },
        { id: 'customers', label: 'Clienti', icon: <Users className="w-4 h-4" /> },
    ];

    return (
        <div className="max-w-7xl mx-auto flex flex-col gap-6">
            {/* Tab Navigation */}
            <div className="flex gap-1 bg-white/[0.02] border border-white/5 rounded-xl p-1">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm transition-all ${activeTab === tab.id
                                ? 'bg-brand-gold/10 text-brand-gold border border-brand-gold/20'
                                : 'text-white/50 hover:text-white/80 border border-transparent'
                            }`}
                    >
                        {tab.icon} {tab.label}
                    </button>
                ))}
                <div className="flex-1" />
                <button onClick={() => {
                    if (activeTab === 'dashboard') fetchDashboard();
                    if (activeTab === 'orders') fetchOrders();
                    if (activeTab === 'inventory') fetchInventory();
                    if (activeTab === 'customers') fetchCustomers();
                }} className="px-3 text-white/40 hover:text-brand-gold transition-colors">
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                </button>
            </div>

            {/* ══════════════ DASHBOARD TAB ══════════════ */}
            {activeTab === 'dashboard' && dashboard && (
                <div className="flex flex-col gap-6">
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <KpiCard label="Revenue Totale" value={fmt(dashboard.revenue.total)} sub={`Oggi: ${fmt(dashboard.revenue.today)}`} icon={<TrendingUp className="w-4 h-4" />} />
                        <KpiCard label="Questo Mese" value={fmt(dashboard.revenue.this_month)} sub={`Mese scorso: ${fmt(dashboard.revenue.last_month)}`} icon={<BarChart3 className="w-4 h-4" />} />
                        <KpiCard label="Ordini Totali" value={String(dashboard.orders.total)} sub={`Da evadere: ${dashboard.orders.to_ship}`} icon={<ShoppingCart className="w-4 h-4" />} accent="bg-blue-500/10 text-blue-400" />
                        <KpiCard label="Stock RET-KIT-1" value={String(dashboard.inventory.stock_quantity)} sub={dashboard.inventory.low_stock ? '⚠️ Scorte basse!' : 'Disponibile'} icon={<Boxes className="w-4 h-4" />} accent={dashboard.inventory.low_stock ? 'bg-red-500/10 text-red-400' : 'bg-green-500/10 text-green-400'} />
                    </div>

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <KpiCard label="Ordini Oggi" value={String(dashboard.orders.today)} icon={<ShoppingCart className="w-4 h-4" />} accent="bg-purple-500/10 text-purple-400" />
                        <KpiCard label="Questa Settimana" value={String(dashboard.orders.this_week)} sub={`Revenue: ${fmt(dashboard.revenue.this_week)}`} icon={<BarChart3 className="w-4 h-4" />} accent="bg-cyan-500/10 text-cyan-400" />
                        <KpiCard label="Questo Mese" value={String(dashboard.orders.this_month)} icon={<ShoppingCart className="w-4 h-4" />} accent="bg-emerald-500/10 text-emerald-400" />
                        <KpiCard label="Da Spedire" value={String(dashboard.orders.to_ship)} icon={<Package className="w-4 h-4" />} accent={dashboard.orders.to_ship > 0 ? 'bg-amber-500/10 text-amber-400' : 'bg-green-500/10 text-green-400'} />
                    </div>

                    {/* Recent Orders */}
                    <div className="bg-white/[0.02] border border-white/5 rounded-2xl overflow-hidden">
                        <div className="px-5 py-4 border-b border-white/5 flex justify-between items-center">
                            <span className="text-sm font-medium">Ultimi Ordini</span>
                            <button onClick={() => setActiveTab('orders')} className="text-xs text-brand-gold hover:underline">Vedi tutti →</button>
                        </div>
                        <table className="w-full text-left">
                            <tbody>
                                {dashboard.recent_orders.map(o => (
                                    <tr key={o.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                                        <td className="px-5 py-3 font-mono text-xs text-brand-gold">{o.reference_id?.substring(0, 8)}</td>
                                        <td className="px-5 py-3 text-xs text-white/60">{o.email || '-'}</td>
                                        <td className="px-5 py-3 text-sm">{fmt(o.fiat_amount)}</td>
                                        <td className="px-5 py-3"><StatusBadge status={o.status as OrderStatus} /></td>
                                        <td className="px-5 py-3 text-xs text-white/40">{new Date(o.created_at).toLocaleString('it-IT')}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {activeTab === 'dashboard' && !dashboard && !loading && (
                <div className="text-center text-white/30 py-20">Impossibile caricare i dati. Verifica la connessione.</div>
            )}

            {/* ══════════════ ORDERS TAB ══════════════ */}
            {activeTab === 'orders' && (
                <div className="flex flex-col gap-4">
                    <div className="flex flex-col sm:flex-row gap-3">
                        <div className="relative flex-1">
                            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                            <input type="text" placeholder="Cerca per ID, Email..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-brand-gold/50" />
                        </div>
                        <div className="relative">
                            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
                                className="bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm appearance-none pr-8 focus:outline-none focus:border-brand-gold/50 min-w-[140px]">
                                <option value="all">Tutti</option>
                                <option value="pending">In Attesa</option>
                                <option value="paid">Da Evadere</option>
                                <option value="shipped">Spediti</option>
                                <option value="delivered">Consegnati</option>
                                <option value="cancelled">Annullati</option>
                            </select>
                            <ChevronDown className="w-3 h-3 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-white/30" />
                        </div>
                    </div>

                    <div className="bg-white/[0.02] border border-white/5 rounded-2xl overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="border-b border-white/5 bg-white/[0.02]">
                                        <th className="p-4 text-xs font-medium text-white/40 uppercase tracking-wider">Ordine</th>
                                        <th className="p-4 text-xs font-medium text-white/40 uppercase tracking-wider">Pagamento</th>
                                        <th className="p-4 text-xs font-medium text-white/40 uppercase tracking-wider">Stato</th>
                                        <th className="p-4 text-xs font-medium text-white/40 uppercase tracking-wider">Fulfillment</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        <tr><td colSpan={4} className="p-8 text-center text-white/30 text-sm">Caricamento...</td></tr>
                                    ) : filteredOrders.length === 0 ? (
                                        <tr><td colSpan={4} className="p-8 text-center text-white/30 text-sm">Nessun ordine trovato.</td></tr>
                                    ) : filteredOrders.map(order => (
                                        <tr key={order.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                                            <td className="p-4">
                                                <div className="font-mono text-sm text-brand-gold">{order.reference_id.substring(0, 8)}...</div>
                                                <div className="text-xs text-white/50">{new Date(order.created_at).toLocaleString('it-IT')}</div>
                                                {order.email && <div className="text-xs text-white/70 mt-1">{order.email}</div>}
                                            </td>
                                            <td className="p-4">
                                                <div className="text-sm font-medium">{fmt(order.fiat_amount)}</div>
                                                <div className="text-xs text-white/40">{order.crypto_amount} {order.crypto_currency}</div>
                                                {order.items && order.items.length > 0 && (
                                                    <div className="text-xs text-blue-400 mt-1">{order.items.reduce((a, i) => a + (i.quantity || 1), 0)}x Kit</div>
                                                )}
                                            </td>
                                            <td className="p-4"><StatusBadge status={order.status} /></td>
                                            <td className="p-4">
                                                {order.status === 'paid' ? (
                                                    <div className="flex flex-col gap-2">
                                                        <div className="flex gap-2 items-center">
                                                            <select value={carrierInput[order.id] || 'GLS'} onChange={e => setCarrierInput({ ...carrierInput, [order.id]: e.target.value })}
                                                                className="bg-black/30 border border-white/10 rounded px-2 py-1 text-xs w-20 appearance-none">
                                                                {CARRIERS.map(c => <option key={c} value={c}>{c}</option>)}
                                                            </select>
                                                            <input type="text" placeholder="Tracking #" value={trackingInput[order.id] || ''}
                                                                onChange={e => setTrackingInput({ ...trackingInput, [order.id]: e.target.value })}
                                                                className="bg-black/30 border border-white/10 rounded px-2 py-1 text-xs flex-1 min-w-[100px] focus:border-brand-gold/50" />
                                                        </div>
                                                        <button onClick={() => shipOrder(order.id)} disabled={!trackingInput[order.id] || updating[order.id]}
                                                            className="bg-brand-gold/20 text-brand-gold disabled:opacity-30 px-3 py-1.5 rounded text-xs hover:bg-brand-gold/30 transition-colors w-full">
                                                            {updating[order.id] ? '...' : '📦 Evadi Ordine'}
                                                        </button>
                                                    </div>
                                                ) : order.status === 'shipped' ? (
                                                    <div className="text-xs text-white/50 flex items-center gap-1">
                                                        <CheckCircle className="w-3 h-3 text-brand-gold" />
                                                        {order.carrier} · {order.tracking_number}
                                                    </div>
                                                ) : <span className="text-xs text-white/20">—</span>}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* ══════════════ INVENTORY TAB ══════════════ */}
            {activeTab === 'inventory' && (
                <div className="flex flex-col gap-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="md:col-span-1">
                            <KpiCard label="Stock Attuale (RET-KIT-1)" value={String(invStock)} sub={invStock < 20 ? '⚠️ Scorte basse!' : 'Livello OK'} icon={<Boxes className="w-4 h-4" />} accent={invStock < 20 ? 'bg-red-500/10 text-red-400' : 'bg-green-500/10 text-green-400'} />
                        </div>
                        <div className="md:col-span-2 bg-white/[0.03] border border-white/8 rounded-2xl p-5">
                            <div className="text-xs text-white/40 uppercase tracking-wider mb-4">Aggiorna Inventario</div>
                            <div className="flex flex-col sm:flex-row gap-3">
                                <select value={invAction} onChange={e => setInvAction(e.target.value as 'add' | 'remove')}
                                    className="bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm appearance-none">
                                    <option value="add">➕ Aggiungi</option>
                                    <option value="remove">➖ Rimuovi</option>
                                </select>
                                <input type="number" min={0} value={invQty} onChange={e => setInvQty(parseInt(e.target.value) || 0)} placeholder="Quantità"
                                    className="bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm w-28 focus:outline-none focus:border-brand-gold/50" />
                                <input type="text" value={invReason} onChange={e => setInvReason(e.target.value)} placeholder="Motivazione (opz.)"
                                    className="bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm flex-1 focus:outline-none focus:border-brand-gold/50" />
                                <button onClick={updateInventory} disabled={invQty <= 0}
                                    className="bg-brand-gold text-black font-medium px-6 py-2.5 rounded-lg hover:bg-brand-gold/90 disabled:opacity-30 transition-colors text-sm">
                                    Conferma
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white/[0.02] border border-white/5 rounded-2xl overflow-hidden">
                        <div className="px-5 py-4 border-b border-white/5">
                            <span className="text-sm font-medium">Storico Movimenti</span>
                        </div>
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-white/5 bg-white/[0.02]">
                                    <th className="p-4 text-xs text-white/40 uppercase">Data</th>
                                    <th className="p-4 text-xs text-white/40 uppercase">Tipo</th>
                                    <th className="p-4 text-xs text-white/40 uppercase">Qty</th>
                                    <th className="p-4 text-xs text-white/40 uppercase">Stock</th>
                                    <th className="p-4 text-xs text-white/40 uppercase">Motivo</th>
                                    <th className="p-4 text-xs text-white/40 uppercase">Eseguito da</th>
                                </tr>
                            </thead>
                            <tbody>
                                {invMovements.length === 0 ? (
                                    <tr><td colSpan={6} className="p-8 text-center text-white/30 text-sm">Nessun movimento registrato.</td></tr>
                                ) : invMovements.map((m: any) => (
                                    <tr key={m.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                                        <td className="p-4 text-xs text-white/60">{new Date(m.created_at).toLocaleString('it-IT')}</td>
                                        <td className="p-4"><span className={`text-xs px-2 py-0.5 rounded ${m.type === 'add' ? 'bg-green-500/10 text-green-400' : m.type === 'remove' || m.type === 'sale' ? 'bg-red-500/10 text-red-400' : 'bg-blue-500/10 text-blue-400'}`}>{m.type}</span></td>
                                        <td className="p-4 text-sm font-mono">{m.quantity > 0 ? '+' : ''}{m.quantity}</td>
                                        <td className="p-4 text-xs text-white/50">{m.previous_quantity} → {m.new_quantity}</td>
                                        <td className="p-4 text-xs text-white/50">{m.reason || '—'}</td>
                                        <td className="p-4 text-xs text-white/50">{m.performed_by_name || '—'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* ══════════════ CUSTOMERS TAB ══════════════ */}
            {activeTab === 'customers' && (
                <div className="bg-white/[0.02] border border-white/5 rounded-2xl overflow-hidden">
                    <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
                        <span className="text-sm font-medium">Clienti per LTV</span>
                        <span className="text-xs text-white/40">{customers.length} clienti</span>
                    </div>
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-white/5 bg-white/[0.02]">
                                <th className="p-4 text-xs text-white/40 uppercase">Email</th>
                                <th className="p-4 text-xs text-white/40 uppercase">Ordini</th>
                                <th className="p-4 text-xs text-white/40 uppercase">Totale Speso (LTV)</th>
                                <th className="p-4 text-xs text-white/40 uppercase">Ultimo Acquisto</th>
                            </tr>
                        </thead>
                        <tbody>
                            {customers.length === 0 ? (
                                <tr><td colSpan={4} className="p-8 text-center text-white/30 text-sm">Nessun cliente registrato.</td></tr>
                            ) : customers.map(c => (
                                <tr key={c.email} className="border-b border-white/5 hover:bg-white/[0.02]">
                                    <td className="p-4 text-sm">{c.email}</td>
                                    <td className="p-4 text-sm font-mono">{c.order_count}</td>
                                    <td className="p-4 text-sm font-medium text-brand-gold">{fmt(c.total_spent)}</td>
                                    <td className="p-4 text-xs text-white/50">{c.last_purchase ? new Date(c.last_purchase).toLocaleDateString('it-IT') : '—'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {loading && activeTab !== 'dashboard' && (
                <div className="text-center py-12 text-white/30 text-sm">Caricamento...</div>
            )}
        </div>
    );
}
