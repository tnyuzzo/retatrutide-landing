"use client";

import { useEffect, useState, useCallback } from "react";
import { supabaseBrowser } from "@/lib/supabase-browser";
import {
    RefreshCw, Search, CheckCircle, Clock, XCircle, Package,
    TrendingUp, ShoppingCart, BarChart3, Users, Boxes, ChevronDown,
    UserPlus, Shield, Settings, Trash2, ArrowLeft, DollarSign, AlertTriangle,
    X, Copy, ExternalLink, MapPin, Phone, Mail, Truck, Download, ChevronLeft, ChevronRight
} from "lucide-react";

// ── Types ──────────────────────────────────
type OrderStatus = 'pending' | 'paid' | 'underpaid' | 'expired' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded' | 'partially_refunded';
type TabId = 'dashboard' | 'orders' | 'inventory' | 'customers' | 'team' | 'settings';

type Order = {
    id: string; reference_id: string; order_number?: string;
    created_at: string; updated_at?: string;
    crypto_amount?: number; crypto_currency?: string; fiat_amount: number;
    status: OrderStatus; email?: string | null;
    shipping_address?: {
        full_name?: string; address_line_1?: string; address_line_2?: string;
        city?: string; postal_code?: string; country?: string; phone?: string;
    };
    tracking_number?: string; carrier?: string;
    items?: { sku?: string; quantity?: number; name?: string; price?: number }[];
    shipping_cost?: number; notes?: string;
    tracking_status?: string;
    tracking_events?: { date: string | null; description: string; location: string }[];
    shipped_at?: string; payment_url?: string; sent_by?: string;
};

type DashboardData = {
    revenue: { total: number; today: number; this_week: number; this_month: number; last_month: number };
    orders: { total: number; today: number; this_week: number; this_month: number; to_ship: number };
    inventory: { stock_quantity: number; low_stock: boolean };
    recent_orders: Order[];
    shipping_costs?: number;
    customers_total?: number;
    avg_order_value?: number;
};

type Customer = {
    email: string; full_name?: string; total_spent: number; order_count: number; last_purchase: string;
};

type TeamMember = {
    id: string; email: string; full_name: string; role: string; is_active: boolean;
    phone?: string; created_at: string; pending_removal?: boolean;
};

// ── Helpers ──────────────────────────────────
const fmt = (n: number) => new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(n);

const StatusBadge = ({ status }: { status: string }) => {
    const map: Record<string, { bg: string; text: string; icon: React.ReactNode; label: string }> = {
        paid: { bg: 'bg-green-500/10 border-green-500/20', text: 'text-green-400', icon: <CheckCircle className="w-3 h-3" />, label: 'Da Evadere' },
        underpaid: { bg: 'bg-orange-500/10 border-orange-500/20', text: 'text-orange-400', icon: <AlertTriangle className="w-3 h-3" />, label: 'Inc. Pagamento' },
        processing: { bg: 'bg-blue-500/10 border-blue-500/20', text: 'text-blue-400', icon: <Package className="w-3 h-3" />, label: 'In Lavorazione' },
        shipped: { bg: 'bg-brand-gold/10 border-brand-gold/20', text: 'text-brand-gold', icon: <Package className="w-3 h-3" />, label: 'Spedito' },
        delivered: { bg: 'bg-emerald-500/10 border-emerald-500/20', text: 'text-emerald-400', icon: <CheckCircle className="w-3 h-3" />, label: 'Consegnato' },
        pending: { bg: 'bg-white/5 border-white/10', text: 'text-white/50', icon: <Clock className="w-3 h-3" />, label: 'In Attesa' },
        expired: { bg: 'bg-zinc-500/10 border-zinc-500/20', text: 'text-zinc-400', icon: <Clock className="w-3 h-3" />, label: 'Scaduto' },
        cancelled: { bg: 'bg-red-500/10 border-red-500/20', text: 'text-red-400', icon: <XCircle className="w-3 h-3" />, label: 'Annullato' },
        refunded: { bg: 'bg-orange-500/10 border-orange-500/20', text: 'text-orange-400', icon: <DollarSign className="w-3 h-3" />, label: 'Rimborsato' },
        partially_refunded: { bg: 'bg-orange-500/10 border-orange-500/20', text: 'text-orange-400', icon: <DollarSign className="w-3 h-3" />, label: 'Rimb. Parziale' },
    };
    const s = map[status] || map.pending;
    return <span className={`px-2 py-1 text-xs rounded-full ${s.bg} ${s.text} border flex items-center w-fit gap-1`}>{s.icon} {s.label}</span>;
};

const RoleBadge = ({ role }: { role: string }) => {
    const map: Record<string, { bg: string; text: string; label: string }> = {
        super_admin: { bg: 'bg-red-500/10 border-red-500/20', text: 'text-red-400', label: 'Super Admin' },
        manager: { bg: 'bg-purple-500/10 border-purple-500/20', text: 'text-purple-400', label: 'Manager' },
        seller: { bg: 'bg-blue-500/10 border-blue-500/20', text: 'text-blue-400', label: 'Seller' },
        warehouse: { bg: 'bg-amber-500/10 border-amber-500/20', text: 'text-amber-400', label: 'Warehouse' },
    };
    const s = map[role] || { bg: 'bg-white/5 border-white/10', text: 'text-white/50', label: role };
    return <span className={`px-2 py-1 text-xs rounded-full ${s.bg} ${s.text} border`}>{s.label}</span>;
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

const CARRIER_TRACKING_URLS: Record<string, (num: string) => string> = {
    BRT: (num) => `https://vas.brt.it/vas/sped_det_show.hsm?referer=sped_numspe_search.htm&Ession_id=&ShipYear=2025&Spession_Num=${num}`,
    GLS: (num) => `https://www.gls-italy.com/?option=com_gls&view=track_e_trace&mode=search&numero_spedizione=${num}`,
    SDA: (num) => `https://www.sda.it/wps/portal/Servizi_online/dettaglio-spedizione?locale=it&tression_id=${num}`,
    DHL: (num) => `https://www.dhl.com/it-it/home/tracking/tracking-parcel.html?submit=1&tracking-id=${num}`,
    UPS: (num) => `https://www.ups.com/track?tracknum=${num}`,
    POSTE: (num) => `https://www.poste.it/cerca/index.html#/risultati-ricerca-702006/${num}`,
    FEDEX: (num) => `https://www.fedex.com/fedextrack/?trknbr=${num}`,
};

function buildTrackingUrl(carrier?: string, trackingNumber?: string): string | null {
    if (!carrier || !trackingNumber) return null;
    const builder = CARRIER_TRACKING_URLS[carrier.toUpperCase()];
    return builder ? builder(trackingNumber) : null;
}

// ── Sub-Components ──────────────────────────────────

const StatusTimeline = ({ order }: { order: Order }) => {
    const steps = [
        { label: 'Creato', reached: true, date: order.created_at },
        { label: 'Pagato', reached: ['paid', 'processing', 'shipped', 'delivered'].includes(order.status), date: null as string | null },
        { label: 'Spedito', reached: ['shipped', 'delivered'].includes(order.status), date: order.shipped_at || null },
        { label: 'Consegnato', reached: order.status === 'delivered', date: null as string | null },
    ];
    const isCancelled = ['cancelled', 'refunded', 'partially_refunded'].includes(order.status);

    return (
        <div className="bg-white/[0.03] border border-white/8 rounded-2xl p-5">
            <div className="text-xs text-white/40 uppercase tracking-wider mb-4">Timeline</div>
            <div className="flex flex-col">
                {steps.map((step, i) => (
                    <div key={i} className="flex gap-3 items-start">
                        <div className="flex flex-col items-center">
                            <div className={`w-3 h-3 rounded-full border-2 flex-shrink-0 ${step.reached ? 'bg-brand-gold border-brand-gold' : 'bg-transparent border-white/20'}`} />
                            {i < steps.length - 1 && <div className={`w-0.5 h-8 ${steps[i + 1].reached ? 'bg-brand-gold' : 'bg-white/10'}`} />}
                        </div>
                        <div className="pb-6">
                            <div className={`text-sm ${step.reached ? 'text-white' : 'text-white/30'}`}>{step.label}</div>
                            {step.date && <div className="text-xs text-white/40 mt-0.5">{new Date(step.date).toLocaleString('it-IT')}</div>}
                        </div>
                    </div>
                ))}
                {isCancelled && (
                    <div className="flex gap-3 items-start">
                        <div className="w-3 h-3 rounded-full border-2 bg-red-500 border-red-500 flex-shrink-0" />
                        <div className="text-sm text-red-400">
                            {order.status === 'cancelled' ? 'Annullato' : order.status === 'refunded' ? 'Rimborsato' : 'Rimb. Parziale'}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

const OrderDetailDrawer = ({ order, loading, onClose, onShip, onRefund, onCancel, onAccept, updating }: {
    order: Order | null; loading: boolean; onClose: () => void;
    onShip: () => void; onRefund: () => void; onCancel: () => void; onAccept: () => void;
    updating: boolean;
}) => {
    const [copied, setCopied] = useState(false);
    if (!order && !loading) return null;

    const copyText = (text: string) => {
        navigator.clipboard.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
    };

    const addr = order?.shipping_address;
    const trackingUrl = buildTrackingUrl(order?.carrier, order?.tracking_number);
    const canShip = order?.status === 'paid';
    const canRefund = order?.status && ['paid', 'processing', 'shipped'].includes(order.status);
    const canCancel = order?.status && ['pending', 'paid', 'processing', 'expired'].includes(order.status);
    const canAccept = order?.status && ['underpaid', 'expired'].includes(order.status);

    return (
        <div className="fixed inset-0 z-50 flex justify-end" onClick={onClose}>
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <div className="relative w-full max-w-2xl h-full bg-[#0C1017] border-l border-white/10 overflow-y-auto"
                onClick={e => e.stopPropagation()}>
                {loading && !order ? (
                    <div className="flex items-center justify-center h-full"><RefreshCw className="w-6 h-6 text-brand-gold animate-spin" /></div>
                ) : order ? (
                    <div className="flex flex-col gap-5 p-6">
                        {/* Header */}
                        <div className="flex items-start justify-between">
                            <div>
                                <div className="flex items-center gap-3 mb-1">
                                    <span className="font-mono text-lg text-brand-gold font-semibold">#{order.order_number || order.reference_id.substring(0, 8)}</span>
                                    <StatusBadge status={order.status} />
                                </div>
                                <div className="text-xs text-white/40">{new Date(order.created_at).toLocaleString('it-IT')}</div>
                            </div>
                            <button onClick={onClose} className="text-white/40 hover:text-white p-1"><X className="w-5 h-5" /></button>
                        </div>

                        {/* Action Bar */}
                        <div className="flex flex-wrap gap-2">
                            {canShip && (
                                <button onClick={onShip} disabled={updating}
                                    className="bg-brand-gold/20 text-brand-gold disabled:opacity-30 px-4 py-2 rounded-lg text-sm hover:bg-brand-gold/30 transition-colors flex items-center gap-2">
                                    <Truck className="w-4 h-4" /> Evadi Ordine
                                </button>
                            )}
                            {canAccept && (
                                <button onClick={onAccept} disabled={updating}
                                    className="bg-green-500/10 text-green-400 disabled:opacity-30 px-4 py-2 rounded-lg text-sm hover:bg-green-500/20 transition-colors flex items-center gap-2">
                                    <CheckCircle className="w-4 h-4" /> Accetta Pagamento
                                </button>
                            )}
                            {canRefund && (
                                <button onClick={onRefund} disabled={updating}
                                    className="bg-red-500/10 text-red-400 disabled:opacity-30 px-4 py-2 rounded-lg text-sm hover:bg-red-500/20 transition-colors">
                                    Rimborsa
                                </button>
                            )}
                            {canCancel && order.status !== 'expired' && (
                                <button onClick={onCancel} disabled={updating}
                                    className="bg-white/5 text-white/50 disabled:opacity-30 px-4 py-2 rounded-lg text-sm hover:bg-white/10 transition-colors">
                                    Annulla
                                </button>
                            )}
                        </div>

                        {/* Two-Column: Order Details + Customer */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            {/* Order Details */}
                            <div className="bg-white/[0.03] border border-white/8 rounded-2xl p-5">
                                <div className="text-xs text-white/40 uppercase tracking-wider mb-3">Dettagli Ordine</div>
                                <div className="flex flex-col gap-2 text-sm">
                                    {order.items?.map((item, i) => (
                                        <div key={i} className="flex justify-between">
                                            <span className="text-white/70">{item.quantity || 1}x {item.name || 'Kit'}</span>
                                            {item.price !== undefined && <span className="text-white/50">{fmt(item.price)}</span>}
                                        </div>
                                    ))}
                                    <div className="border-t border-white/5 pt-2 mt-1 flex justify-between font-medium">
                                        <span>Totale</span>
                                        <span className="text-brand-gold">{fmt(order.fiat_amount)}</span>
                                    </div>
                                    {order.shipping_cost ? (
                                        <div className="flex justify-between text-xs text-white/40">
                                            <span>Spedizione</span><span>{fmt(order.shipping_cost)}</span>
                                        </div>
                                    ) : null}
                                    {order.crypto_currency && (
                                        <div className="border-t border-white/5 pt-2 mt-1">
                                            <div className="text-xs text-white/40 mb-1">Pagamento Crypto</div>
                                            <div className="text-sm">{order.crypto_amount} {order.crypto_currency}</div>
                                            {order.payment_url && (
                                                <div className="font-mono text-xs text-white/30 mt-1 break-all">{order.payment_url}</div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Customer */}
                            <div className="bg-white/[0.03] border border-white/8 rounded-2xl p-5">
                                <div className="text-xs text-white/40 uppercase tracking-wider mb-3">Cliente</div>
                                <div className="flex flex-col gap-3">
                                    {addr?.full_name && (
                                        <div className="flex items-center gap-2 text-sm">
                                            <Users className="w-4 h-4 text-white/30 flex-shrink-0" />
                                            <span>{addr.full_name}</span>
                                        </div>
                                    )}
                                    {order.email && (
                                        <a href={`mailto:${order.email}`} className="flex items-center gap-2 text-sm text-brand-gold hover:underline">
                                            <Mail className="w-4 h-4 text-white/30 flex-shrink-0" />
                                            {order.email}
                                        </a>
                                    )}
                                    {addr?.phone && (
                                        <a href={`tel:${addr.phone}`} className="flex items-center gap-2 text-sm text-brand-gold hover:underline">
                                            <Phone className="w-4 h-4 text-white/30 flex-shrink-0" />
                                            {addr.phone}
                                        </a>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Shipping Address */}
                        {addr && (
                            <div className="bg-white/[0.03] border border-white/8 rounded-2xl p-5">
                                <div className="text-xs text-white/40 uppercase tracking-wider mb-3 flex items-center gap-2">
                                    <MapPin className="w-3.5 h-3.5" /> Indirizzo di Spedizione
                                </div>
                                <div className="text-sm text-white/80 leading-relaxed">
                                    {addr.full_name && <div className="font-medium">{addr.full_name}</div>}
                                    {addr.address_line_1 && <div>{addr.address_line_1}</div>}
                                    {addr.address_line_2 && <div>{addr.address_line_2}</div>}
                                    <div>
                                        {[addr.postal_code, addr.city].filter(Boolean).join(' ')}
                                        {addr.country ? `, ${addr.country}` : ''}
                                    </div>
                                    {addr.phone && (
                                        <a href={`tel:${addr.phone}`} className="text-brand-gold hover:underline mt-2 inline-flex items-center gap-1">
                                            <Phone className="w-3 h-3" /> {addr.phone}
                                        </a>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Tracking */}
                        {order.tracking_number && order.carrier && (
                            <div className="bg-white/[0.03] border border-white/8 rounded-2xl p-5">
                                <div className="text-xs text-white/40 uppercase tracking-wider mb-3 flex items-center gap-2">
                                    <Truck className="w-3.5 h-3.5" /> Tracking
                                </div>
                                <div className="flex items-center gap-3 mb-2">
                                    <span className="text-sm text-brand-gold font-medium">{order.carrier}</span>
                                    <span className="font-mono text-sm text-white/70">{order.tracking_number}</span>
                                    <button onClick={() => copyText(order.tracking_number || '')}
                                        className="text-white/30 hover:text-white/60 transition-colors">
                                        {copied ? <CheckCircle className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                                    </button>
                                </div>
                                {order.tracking_status && (
                                    <div className="text-xs text-cyan-400 mb-2">Stato: {order.tracking_status}</div>
                                )}
                                {trackingUrl && (
                                    <a href={trackingUrl} target="_blank" rel="noopener noreferrer"
                                        className="text-xs text-brand-gold hover:underline inline-flex items-center gap-1">
                                        Traccia Spedizione <ExternalLink className="w-3 h-3" />
                                    </a>
                                )}
                                {/* Tracking Events */}
                                {order.tracking_events && order.tracking_events.length > 0 && (
                                    <div className="mt-4 border-t border-white/5 pt-3 max-h-48 overflow-y-auto flex flex-col gap-2">
                                        {order.tracking_events.map((evt, i) => (
                                            <div key={i} className="flex gap-3 items-start text-xs">
                                                <div className={`w-2 h-2 rounded-full mt-1 flex-shrink-0 ${i === 0 ? 'bg-brand-gold' : 'bg-white/20'}`} />
                                                <div>
                                                    <div className="text-white/70">{evt.description}</div>
                                                    <div className="text-white/30">
                                                        {evt.date ? new Date(evt.date).toLocaleString('it-IT') : ''}
                                                        {evt.location ? ` · ${evt.location}` : ''}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Status Timeline */}
                        <StatusTimeline order={order} />

                        {/* Underpaid Info */}
                        {order.status === 'underpaid' && order.notes && (() => {
                            let n: { underpaid_received?: number; underpaid_expected?: number } = {};
                            try { n = JSON.parse(order.notes); } catch { /* empty */ }
                            return n.underpaid_received ? (
                                <div className="bg-orange-500/5 border border-orange-500/20 rounded-2xl p-5">
                                    <div className="text-xs text-orange-400 uppercase tracking-wider mb-2">Pagamento Incompleto</div>
                                    <div className="text-sm text-orange-400/80">
                                        Atteso: {n.underpaid_expected} {order.crypto_currency}<br />
                                        Ricevuto: {n.underpaid_received} {order.crypto_currency}
                                    </div>
                                </div>
                            ) : null;
                        })()}

                        {/* Notes */}
                        {order.notes && order.status !== 'underpaid' && (
                            <div className="bg-white/[0.03] border border-white/8 rounded-2xl p-5">
                                <div className="text-xs text-white/40 uppercase tracking-wider mb-2">Note</div>
                                <div className="text-sm text-white/60 whitespace-pre-line">{order.notes}</div>
                            </div>
                        )}
                    </div>
                ) : null}
            </div>
        </div>
    );
};

const ShipModal = ({ order, onClose, onConfirm, updating }: {
    order: Order | null; onClose: () => void;
    onConfirm: (carrier: string, trackingNumber: string, shippingCost?: number) => void;
    updating: boolean;
}) => {
    const [carrier, setCarrier] = useState('GLS');
    const [trackingNumber, setTrackingNumber] = useState('');
    const [shippingCost, setShippingCost] = useState('');
    if (!order) return null;

    const previewUrl = buildTrackingUrl(carrier, trackingNumber);

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center" onClick={onClose}>
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <div className="relative w-full max-w-md bg-[#0C1017] border border-white/10 rounded-2xl p-6" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-5">
                    <h3 className="text-lg font-medium">Evadi Ordine <span className="text-brand-gold">#{order.order_number || order.reference_id.substring(0, 8)}</span></h3>
                    <button onClick={onClose} className="text-white/40 hover:text-white"><X className="w-5 h-5" /></button>
                </div>

                {order.tracking_number && (
                    <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg px-3 py-2 text-xs text-orange-400 mb-4">
                        Attenzione: questo ordine ha già un tracking ({order.carrier} · {order.tracking_number})
                    </div>
                )}

                <div className="flex flex-col gap-4">
                    <div>
                        <label className="text-xs text-white/50 mb-1 block">Corriere</label>
                        <select value={carrier} onChange={e => setCarrier(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm appearance-none focus:outline-none focus:border-brand-gold/50">
                            {CARRIERS.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="text-xs text-white/50 mb-1 block">Numero Tracking *</label>
                        <input type="text" value={trackingNumber} onChange={e => setTrackingNumber(e.target.value)}
                            placeholder="es. 123456789"
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-brand-gold/50" />
                        {previewUrl && (
                            <a href={previewUrl} target="_blank" rel="noopener noreferrer"
                                className="text-xs text-brand-gold/60 hover:text-brand-gold mt-1 inline-flex items-center gap-1">
                                <ExternalLink className="w-3 h-3" /> Preview link tracking
                            </a>
                        )}
                    </div>
                    <div>
                        <label className="text-xs text-white/50 mb-1 block">Costo Spedizione (EUR)</label>
                        <input type="number" value={shippingCost} onChange={e => setShippingCost(e.target.value)}
                            placeholder="Opzionale"
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-brand-gold/50" />
                    </div>
                </div>

                <div className="flex gap-3 mt-6">
                    <button onClick={onClose} className="flex-1 bg-white/5 text-white/60 py-2.5 rounded-lg text-sm hover:bg-white/10 transition-colors">Annulla</button>
                    <button onClick={() => onConfirm(carrier, trackingNumber, shippingCost ? parseFloat(shippingCost) : undefined)}
                        disabled={!trackingNumber.trim() || updating}
                        className="flex-1 bg-brand-gold text-black font-medium py-2.5 rounded-lg text-sm hover:bg-brand-gold/90 disabled:opacity-30 transition-colors">
                        {updating ? '...' : 'Conferma Spedizione'}
                    </button>
                </div>
            </div>
        </div>
    );
};

const RefundModal = ({ order, onClose, onConfirm, updating }: {
    order: Order | null; onClose: () => void;
    onConfirm: (amount: number | undefined, reason: string) => void;
    updating: boolean;
}) => {
    const [refundType, setRefundType] = useState<'full' | 'partial'>('full');
    const [amount, setAmount] = useState('');
    const [reason, setReason] = useState('');
    if (!order) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center" onClick={onClose}>
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <div className="relative w-full max-w-md bg-[#0C1017] border border-white/10 rounded-2xl p-6" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-5">
                    <h3 className="text-lg font-medium">Rimborso <span className="text-brand-gold">#{order.order_number || order.reference_id.substring(0, 8)}</span></h3>
                    <button onClick={onClose} className="text-white/40 hover:text-white"><X className="w-5 h-5" /></button>
                </div>

                <div className="flex flex-col gap-4">
                    <div className="flex gap-3">
                        <button onClick={() => setRefundType('full')}
                            className={`flex-1 py-2.5 rounded-lg text-sm border transition-colors ${refundType === 'full' ? 'border-brand-gold/30 bg-brand-gold/10 text-brand-gold' : 'border-white/10 text-white/50'}`}>
                            Completo ({fmt(order.fiat_amount)})
                        </button>
                        <button onClick={() => setRefundType('partial')}
                            className={`flex-1 py-2.5 rounded-lg text-sm border transition-colors ${refundType === 'partial' ? 'border-brand-gold/30 bg-brand-gold/10 text-brand-gold' : 'border-white/10 text-white/50'}`}>
                            Parziale
                        </button>
                    </div>

                    {refundType === 'partial' && (
                        <div>
                            <label className="text-xs text-white/50 mb-1 block">Importo Rimborso (EUR) — max {fmt(order.fiat_amount)}</label>
                            <input type="number" value={amount} onChange={e => setAmount(e.target.value)}
                                max={order.fiat_amount} min={1}
                                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-brand-gold/50" />
                        </div>
                    )}

                    <div>
                        <label className="text-xs text-white/50 mb-1 block">Motivo *</label>
                        <textarea value={reason} onChange={e => setReason(e.target.value)}
                            placeholder="Motivo del rimborso..."
                            rows={3}
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-brand-gold/50 resize-none" />
                    </div>

                    <div className="text-xs text-white/30 bg-white/[0.02] border border-white/5 rounded-lg px-3 py-2">
                        Il rimborso crypto è manuale. Questa azione aggiorna lo stato dell&apos;ordine e ripristina l&apos;inventario.
                    </div>
                </div>

                <div className="flex gap-3 mt-6">
                    <button onClick={onClose} className="flex-1 bg-white/5 text-white/60 py-2.5 rounded-lg text-sm hover:bg-white/10 transition-colors">Annulla</button>
                    <button onClick={() => onConfirm(refundType === 'partial' ? parseFloat(amount) : undefined, reason)}
                        disabled={!reason.trim() || (refundType === 'partial' && (!amount || parseFloat(amount) <= 0)) || updating}
                        className="flex-1 bg-red-500/20 text-red-400 font-medium py-2.5 rounded-lg text-sm hover:bg-red-500/30 disabled:opacity-30 transition-colors">
                        {updating ? '...' : 'Conferma Rimborso'}
                    </button>
                </div>
            </div>
        </div>
    );
};

const CancelModal = ({ order, onClose, onConfirm, updating }: {
    order: Order | null; onClose: () => void;
    onConfirm: (notes: string) => void;
    updating: boolean;
}) => {
    const [notes, setNotes] = useState('');
    if (!order) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center" onClick={onClose}>
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <div className="relative w-full max-w-sm bg-[#0C1017] border border-white/10 rounded-2xl p-6" onClick={e => e.stopPropagation()}>
                <div className="flex flex-col items-center text-center gap-3 mb-5">
                    <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center">
                        <XCircle className="w-6 h-6 text-red-400" />
                    </div>
                    <h3 className="text-lg font-medium">Annullare l&apos;ordine?</h3>
                    <p className="text-xs text-white/40">
                        #{order.order_number || order.reference_id.substring(0, 8)}
                        {['paid', 'processing'].includes(order.status) && ' — L\'inventario verrà ripristinato.'}
                    </p>
                </div>

                <textarea value={notes} onChange={e => setNotes(e.target.value)}
                    placeholder="Note (opzionale)"
                    rows={2}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-brand-gold/50 resize-none mb-4" />

                <div className="flex gap-3">
                    <button onClick={onClose} className="flex-1 bg-white/5 text-white/60 py-2.5 rounded-lg text-sm hover:bg-white/10 transition-colors">Torna Indietro</button>
                    <button onClick={() => onConfirm(notes)} disabled={updating}
                        className="flex-1 bg-red-500/20 text-red-400 font-medium py-2.5 rounded-lg text-sm hover:bg-red-500/30 disabled:opacity-30 transition-colors">
                        {updating ? '...' : 'Annulla Ordine'}
                    </button>
                </div>
            </div>
        </div>
    );
};

// ── Main Component ──────────────────────────────────
export default function AdminDashboard() {
    const [activeTab, setActiveTab] = useState<TabId>('dashboard');
    const [token, setToken] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [userRole, setUserRole] = useState<string>('');

    // Dashboard state
    const [dashboard, setDashboard] = useState<DashboardData | null>(null);

    // Orders state
    const [orders, setOrders] = useState<Order[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [updating, setUpdating] = useState<Record<string, boolean>>({});
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalOrders, setTotalOrders] = useState(0);
    const ordersPerPage = 20;

    // Order detail + action modals
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [orderDetailLoading, setOrderDetailLoading] = useState(false);
    const [shipModalOrder, setShipModalOrder] = useState<Order | null>(null);
    const [refundModalOrder, setRefundModalOrder] = useState<Order | null>(null);
    const [cancelModalOrder, setCancelModalOrder] = useState<Order | null>(null);

    // Inventory state
    const [invStock, setInvStock] = useState(0);
    const [invMovements, setInvMovements] = useState<any[]>([]);
    const [invAction, setInvAction] = useState<'add' | 'remove'>('add');
    const [invQty, setInvQty] = useState(0);
    const [invReason, setInvReason] = useState("");

    // Customers state
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [customerSearch, setCustomerSearch] = useState("");
    const [customerDetail, setCustomerDetail] = useState<{ customer: any; orders: Order[] } | null>(null);
    const [customerAggregates, setCustomerAggregates] = useState<any>(null);

    // Team state
    const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
    const [inviteEmail, setInviteEmail] = useState("");
    const [inviteRole, setInviteRole] = useState("seller");
    const [inviteName, setInviteName] = useState("");
    const [invitePhone, setInvitePhone] = useState("");
    const [teamMessage, setTeamMessage] = useState("");

    // Settings state
    const [storeSettings, setStoreSettings] = useState<Record<string, any>>({});
    const [settingsMessage, setSettingsMessage] = useState("");

    // Get auth token + resolve role
    useEffect(() => {
        supabaseBrowser.auth.getSession().then(async ({ data: { session } }) => {
            setToken(session?.access_token ?? null);
            if (session?.user) {
                const jwtRole = session.user.app_metadata?.role as string;
                if (jwtRole && jwtRole !== 'customer') {
                    setUserRole(jwtRole);
                } else {
                    const { data: profile } = await supabaseBrowser
                        .from('profiles').select('role').eq('id', session.user.id).single();
                    setUserRole(profile?.role || '');
                }
            }
        });
    }, []);

    const authHeaders = useCallback(() => ({
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
    }), [token]);

    // ── Fetchers ──────────────────────────────────
    const handleFetchError = useCallback(async (res: Response, context: string) => {
        if (!res.ok) {
            const body = await res.json().catch(() => ({}));
            const msg = body.error || `Errore ${res.status} in ${context}`;
            setErrorMsg(msg);
            console.error(`${context}:`, msg);
            return false;
        }
        setErrorMsg(null);
        return true;
    }, []);

    const fetchDashboard = useCallback(async () => {
        if (!token) return;
        setLoading(true);
        try {
            const res = await fetch('/api/admin/dashboard', { headers: authHeaders() });
            if (await handleFetchError(res, 'Dashboard')) setDashboard(await res.json());
        } catch (e) { setErrorMsg('Errore di rete nel caricamento dashboard'); console.error(e); }
        setLoading(false);
    }, [token, authHeaders, handleFetchError]);

    const fetchOrders = useCallback(async () => {
        if (!token) return;
        setLoading(true);
        try {
            const params = new URLSearchParams({
                limit: String(ordersPerPage),
                page: String(currentPage),
            });
            if (statusFilter !== 'all') params.set('status', statusFilter);
            if (searchTerm) params.set('search', searchTerm);
            if (dateFrom) params.set('date_from', dateFrom);
            if (dateTo) params.set('date_to', dateTo);
            const res = await fetch(`/api/admin/orders?${params}`, { headers: authHeaders() });
            if (await handleFetchError(res, 'Ordini')) {
                const d = await res.json();
                setOrders(d.orders || []);
                setTotalOrders(d.total || 0);
            }
        } catch (e) { setErrorMsg('Errore di rete nel caricamento ordini'); console.error(e); }
        setLoading(false);
    }, [token, statusFilter, searchTerm, dateFrom, dateTo, currentPage, authHeaders, handleFetchError]);

    const fetchInventory = useCallback(async () => {
        if (!token) return;
        try {
            const res = await fetch('/api/admin/inventory', { headers: authHeaders() });
            if (await handleFetchError(res, 'Inventario')) {
                const d = await res.json();
                setInvStock(d.current_stock);
                setInvMovements(d.movements || []);
            }
        } catch (e) { setErrorMsg('Errore di rete nel caricamento inventario'); console.error(e); }
    }, [token, authHeaders, handleFetchError]);

    const fetchCustomers = useCallback(async () => {
        if (!token) return;
        try {
            const params = new URLSearchParams();
            if (customerSearch) params.set('search', customerSearch);
            const res = await fetch(`/api/admin/customers?${params}`, { headers: authHeaders() });
            if (await handleFetchError(res, 'Clienti')) {
                const d = await res.json();
                setCustomers(d.customers || []);
                setCustomerAggregates(d.aggregates || null);
            }
        } catch (e) { setErrorMsg('Errore di rete nel caricamento clienti'); console.error(e); }
    }, [token, customerSearch, authHeaders, handleFetchError]);

    const fetchTeam = useCallback(async () => {
        if (!token) return;
        try {
            const res = await fetch('/api/admin/team', { headers: authHeaders() });
            if (await handleFetchError(res, 'Team')) { const d = await res.json(); setTeamMembers(d.members || []); }
        } catch (e) { setErrorMsg('Errore di rete nel caricamento team'); console.error(e); }
    }, [token, authHeaders, handleFetchError]);

    const fetchSettings = useCallback(async () => {
        if (!token) return;
        try {
            const res = await fetch('/api/admin/settings', { headers: authHeaders() });
            if (await handleFetchError(res, 'Impostazioni')) { const d = await res.json(); setStoreSettings(d.settings || {}); }
        } catch (e) { setErrorMsg('Errore di rete nel caricamento impostazioni'); console.error(e); }
    }, [token, authHeaders, handleFetchError]);

    const fetchOrderDetail = useCallback(async (orderId: string) => {
        setOrderDetailLoading(true);
        try {
            const res = await fetch(`/api/admin/orders?id=${orderId}`, { headers: authHeaders() });
            if (await handleFetchError(res, 'Dettaglio ordine')) {
                setSelectedOrder((await res.json()).order || null);
            }
        } catch (e) { setErrorMsg('Errore caricamento dettaglio'); console.error(e); }
        setOrderDetailLoading(false);
    }, [authHeaders, handleFetchError]);

    // Load data on tab switch
    useEffect(() => {
        if (!token) return;
        if (activeTab === 'dashboard') fetchDashboard();
        if (activeTab === 'orders') fetchOrders();
        if (activeTab === 'inventory') fetchInventory();
        if (activeTab === 'customers') fetchCustomers();
        if (activeTab === 'team') fetchTeam();
        if (activeTab === 'settings') fetchSettings();
    }, [activeTab, token, fetchDashboard, fetchOrders, fetchInventory, fetchCustomers, fetchTeam, fetchSettings]);

    // ── Actions ──────────────────────────────────
    const shipOrder = async (orderId: string, carrier: string, trackingNumber: string, shippingCost?: number) => {
        setUpdating(p => ({ ...p, [orderId]: true }));
        try {
            const res = await fetch('/api/admin/orders', {
                method: 'POST', headers: authHeaders(),
                body: JSON.stringify({ action: 'update-status', order_id: orderId, new_status: 'shipped', tracking_number: trackingNumber, carrier, shipping_cost: shippingCost }),
            });
            if (res.ok) { fetchOrders(); setShipModalOrder(null); setSelectedOrder(null); }
            else { const d = await res.json(); alert(d.error || 'Errore'); }
        } catch (e) { console.error(e); }
        setUpdating(p => ({ ...p, [orderId]: false }));
    };

    const refundOrder = async (orderId: string, amount?: number, reason?: string) => {
        setUpdating(p => ({ ...p, [orderId]: true }));
        try {
            const res = await fetch('/api/admin/refund', {
                method: 'POST', headers: authHeaders(),
                body: JSON.stringify({ order_id: orderId, amount, reason: reason || 'Refund from admin panel' }),
            });
            if (res.ok) { fetchOrders(); setRefundModalOrder(null); setSelectedOrder(null); }
            else { const d = await res.json(); alert(d.error || 'Errore durante il rimborso'); }
        } catch (e) { console.error(e); }
        setUpdating(p => ({ ...p, [orderId]: false }));
    };

    const cancelOrder = async (orderId: string) => {
        setUpdating(p => ({ ...p, [orderId]: true }));
        try {
            const res = await fetch('/api/admin/orders', {
                method: 'POST', headers: authHeaders(),
                body: JSON.stringify({ action: 'update-status', order_id: orderId, new_status: 'cancelled' }),
            });
            if (res.ok) { fetchOrders(); setCancelModalOrder(null); setSelectedOrder(null); }
            else { const d = await res.json(); alert(d.error || 'Errore'); }
        } catch (e) { console.error(e); }
        setUpdating(p => ({ ...p, [orderId]: false }));
    };

    const acceptPayment = async (orderId: string) => {
        if (!confirm("Confermi di accettare il pagamento e procedere con l'evasione?")) return;
        setUpdating(p => ({ ...p, [orderId]: true }));
        try {
            const res = await fetch('/api/admin/orders', {
                method: 'POST', headers: authHeaders(),
                body: JSON.stringify({ action: 'update-status', order_id: orderId, new_status: 'paid' }),
            });
            if (res.ok) { fetchOrders(); setSelectedOrder(null); }
            else { const d = await res.json(); alert(d.error || 'Errore'); }
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

    const viewCustomerDetail = async (email: string) => {
        try {
            const res = await fetch(`/api/admin/customers?id=${encodeURIComponent(email)}`, { headers: authHeaders() });
            if (res.ok) { setCustomerDetail(await res.json()); }
        } catch (e) { console.error(e); }
    };

    const inviteTeamMember = async () => {
        if (!inviteEmail) return;
        setTeamMessage('');
        try {
            const res = await fetch('/api/admin/team', {
                method: 'POST', headers: authHeaders(),
                body: JSON.stringify({ action: 'invite', email: inviteEmail, role: inviteRole, fullName: inviteName, phone: invitePhone }),
            });
            const d = await res.json();
            setTeamMessage(d.message || d.error || 'Done');
            if (res.ok) { setInviteEmail(''); setInviteName(''); setInvitePhone(''); fetchTeam(); }
        } catch (e) { console.error(e); }
    };

    const revokeTeamMember = async (userId: string) => {
        if (!confirm('Revocare accesso a questo membro?')) return;
        try {
            const res = await fetch('/api/admin/team', {
                method: 'POST', headers: authHeaders(),
                body: JSON.stringify({ action: 'revoke', userId }),
            });
            const d = await res.json();
            setTeamMessage(d.message || d.error || 'Done');
            fetchTeam();
        } catch (e) { console.error(e); }
    };

    const approveRemoval = async (userId: string) => {
        try {
            await fetch('/api/admin/team', { method: 'POST', headers: authHeaders(), body: JSON.stringify({ action: 'approve-removal', userId }) });
            fetchTeam();
        } catch (e) { console.error(e); }
    };

    const rejectRemoval = async (userId: string) => {
        try {
            await fetch('/api/admin/team', { method: 'POST', headers: authHeaders(), body: JSON.stringify({ action: 'reject-removal', userId }) });
            fetchTeam();
        } catch (e) { console.error(e); }
    };

    const saveSettings = async () => {
        setSettingsMessage('');
        try {
            const res = await fetch('/api/admin/settings', {
                method: 'POST', headers: authHeaders(),
                body: JSON.stringify({ settings: storeSettings }),
            });
            const d = await res.json();
            if (res.ok) { setSettingsMessage('Impostazioni salvate!'); setStoreSettings(d.settings || storeSettings); }
            else setSettingsMessage(d.error || 'Errore');
        } catch (e) { console.error(e); }
    };

    // ── CSV Export ──────────────────────────────────
    const exportOrdersCSV = async () => {
        try {
            const params = new URLSearchParams({ limit: '10000', page: '1' });
            if (statusFilter !== 'all') params.set('status', statusFilter);
            if (searchTerm) params.set('search', searchTerm);
            if (dateFrom) params.set('date_from', dateFrom);
            if (dateTo) params.set('date_to', dateTo);
            const res = await fetch(`/api/admin/orders?${params}`, { headers: authHeaders() });
            if (!res.ok) return;
            const d = await res.json();
            const allOrders: Order[] = d.orders || [];

            const headers = ['Numero Ordine', 'Riferimento', 'Data', 'Email', 'Nome', 'Stato', 'Importo EUR', 'Crypto', 'Importo Crypto', 'Quantita', 'Corriere', 'Tracking', 'Costo Sped.', 'Citta', 'CAP', 'Paese', 'Telefono'];
            const rows = allOrders.map(o => [
                o.order_number || '', o.reference_id, new Date(o.created_at).toLocaleString('it-IT'),
                o.email || '', o.shipping_address?.full_name || '', o.status,
                String(o.fiat_amount || 0), o.crypto_currency || '', String(o.crypto_amount || ''),
                String(o.items?.reduce((a, i) => a + (i.quantity || 1), 0) || 1),
                o.carrier || '', o.tracking_number || '', String(o.shipping_cost || ''),
                o.shipping_address?.city || '', o.shipping_address?.postal_code || '',
                o.shipping_address?.country || '', o.shipping_address?.phone || '',
            ]);
            const csvContent = [headers, ...rows].map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
            const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `ordini_${new Date().toISOString().split('T')[0]}.csv`;
            link.click();
            URL.revokeObjectURL(url);
        } catch (e) { console.error('CSV export error:', e); setErrorMsg('Errore durante l\'esportazione CSV'); }
    };

    // ── Tabs ──────────────────────────────────
    const tabs: { id: TabId; label: string; icon: React.ReactNode }[] = [
        { id: 'dashboard', label: 'Dashboard', icon: <BarChart3 className="w-4 h-4" /> },
        { id: 'orders', label: 'Ordini', icon: <ShoppingCart className="w-4 h-4" /> },
        { id: 'inventory', label: 'Inventario', icon: <Boxes className="w-4 h-4" /> },
        { id: 'customers', label: 'Clienti', icon: <Users className="w-4 h-4" /> },
        { id: 'team', label: 'Team', icon: <Shield className="w-4 h-4" /> },
        { id: 'settings', label: 'Settings', icon: <Settings className="w-4 h-4" /> },
    ];

    const refreshCurrentTab = () => {
        if (activeTab === 'dashboard') fetchDashboard();
        if (activeTab === 'orders') fetchOrders();
        if (activeTab === 'inventory') fetchInventory();
        if (activeTab === 'customers') fetchCustomers();
        if (activeTab === 'team') fetchTeam();
        if (activeTab === 'settings') fetchSettings();
    };

    // ── Pagination Helpers ──────────────────────────────────
    const totalPages = Math.ceil(totalOrders / ordersPerPage);

    const getPageNumbers = () => {
        const pages: number[] = [];
        const maxVisible = 5;
        if (totalPages <= maxVisible) {
            for (let i = 1; i <= totalPages; i++) pages.push(i);
        } else if (currentPage <= 3) {
            for (let i = 1; i <= maxVisible; i++) pages.push(i);
        } else if (currentPage >= totalPages - 2) {
            for (let i = totalPages - maxVisible + 1; i <= totalPages; i++) pages.push(i);
        } else {
            for (let i = currentPage - 2; i <= currentPage + 2; i++) pages.push(i);
        }
        return pages;
    };

    // ── Inline action helpers for order table ──
    const orderActionLabel = (order: Order): string => {
        if (order.status === 'paid') return 'Evadi';
        if (order.status === 'underpaid' || order.status === 'expired') return 'Accetta';
        if (order.status === 'shipped') return `${order.carrier || ''} · ${order.tracking_number || ''}`;
        return '-';
    };

    return (
        <div className="max-w-7xl mx-auto flex flex-col gap-6">
            {/* Error Banner */}
            {errorMsg && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 flex items-center justify-between">
                    <span className="text-red-400 text-sm">{errorMsg}</span>
                    <button onClick={() => setErrorMsg(null)} className="text-red-400/50 hover:text-red-400 text-xs ml-4">✕</button>
                </div>
            )}
            {/* Tab Navigation */}
            <div className="flex gap-1 bg-white/[0.02] border border-white/5 rounded-xl p-1 overflow-x-auto">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm transition-all whitespace-nowrap ${activeTab === tab.id
                                ? 'bg-brand-gold/10 text-brand-gold border border-brand-gold/20'
                                : 'text-white/50 hover:text-white/80 border border-transparent'
                            }`}
                    >
                        {tab.icon} {tab.label}
                    </button>
                ))}
                <div className="flex-1" />
                <button onClick={refreshCurrentTab} className="px-3 text-white/40 hover:text-brand-gold transition-colors">
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
                        <KpiCard label="Stock RET-KIT-1" value={String(dashboard.inventory.stock_quantity)} sub={dashboard.inventory.low_stock ? 'Scorte basse!' : 'Disponibile'} icon={<Boxes className="w-4 h-4" />} accent={dashboard.inventory.low_stock ? 'bg-red-500/10 text-red-400' : 'bg-green-500/10 text-green-400'} />
                    </div>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <KpiCard label="Clienti Totali" value={String(dashboard.customers_total || 0)} icon={<Users className="w-4 h-4" />} accent="bg-purple-500/10 text-purple-400" />
                        <KpiCard label="Valore Medio Ordine" value={fmt(dashboard.avg_order_value || 0)} icon={<DollarSign className="w-4 h-4" />} accent="bg-cyan-500/10 text-cyan-400" />
                        <KpiCard label="Costi Spedizione" value={fmt(dashboard.shipping_costs || 0)} icon={<Package className="w-4 h-4" />} accent="bg-amber-500/10 text-amber-400" />
                        <KpiCard label="Da Spedire" value={String(dashboard.orders.to_ship)} icon={<Package className="w-4 h-4" />} accent={dashboard.orders.to_ship > 0 ? 'bg-amber-500/10 text-amber-400' : 'bg-green-500/10 text-green-400'} />
                    </div>
                    {/* Recent Orders */}
                    <div className="bg-white/[0.02] border border-white/5 rounded-2xl overflow-hidden">
                        <div className="px-5 py-4 border-b border-white/5 flex justify-between items-center">
                            <span className="text-sm font-medium">Ultimi Ordini</span>
                            <button onClick={() => setActiveTab('orders')} className="text-xs text-brand-gold hover:underline">Vedi tutti</button>
                        </div>
                        <table className="w-full text-left">
                            <tbody>
                                {dashboard.recent_orders.map(o => (
                                    <tr key={o.id} className="border-b border-white/5 hover:bg-white/[0.02] cursor-pointer" onClick={() => { setActiveTab('orders'); fetchOrderDetail(o.id); }}>
                                        <td className="px-5 py-3 font-mono text-xs text-brand-gold">{o.order_number || o.reference_id?.substring(0, 8)}</td>
                                        <td className="px-5 py-3 text-xs text-white/60">{o.email || '-'}</td>
                                        <td className="px-5 py-3 text-sm">{fmt(o.fiat_amount)}</td>
                                        <td className="px-5 py-3"><StatusBadge status={o.status} /></td>
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
                    {/* Filters */}
                    <div className="flex flex-col gap-3">
                        <div className="flex flex-col sm:flex-row gap-3">
                            <div className="relative flex-1">
                                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                                <input type="text" placeholder="Cerca per email, ID ordine, numero ordine..." value={searchTerm}
                                    onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                                    onKeyDown={e => e.key === 'Enter' && fetchOrders()}
                                    className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-brand-gold/50" />
                            </div>
                            <div className="flex gap-2 items-center">
                                <div className="relative">
                                    <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                                        className="bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm appearance-none pr-8 focus:outline-none focus:border-brand-gold/50 min-w-[140px]">
                                        <option value="all">Tutti</option>
                                        <option value="pending">In Attesa</option>
                                        <option value="paid">Da Evadere</option>
                                        <option value="underpaid">Inc. Pagamento</option>
                                        <option value="processing">In Lavorazione</option>
                                        <option value="shipped">Spediti</option>
                                        <option value="delivered">Consegnati</option>
                                        <option value="expired">Scaduti</option>
                                        <option value="cancelled">Annullati</option>
                                        <option value="refunded">Rimborsati</option>
                                    </select>
                                    <ChevronDown className="w-3 h-3 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-white/30" />
                                </div>
                                {userRole === 'super_admin' && (
                                    <button onClick={exportOrdersCSV} title="Esporta CSV"
                                        className="bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white/60 hover:text-brand-gold hover:border-brand-gold/30 transition-colors flex items-center gap-1.5 whitespace-nowrap">
                                        <Download className="w-4 h-4" /> CSV
                                    </button>
                                )}
                            </div>
                        </div>
                        {/* Date Range */}
                        <div className="flex flex-wrap gap-2 items-center">
                            <input type="date" value={dateFrom}
                                onChange={e => { setDateFrom(e.target.value); setCurrentPage(1); }}
                                className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-gold/50 [color-scheme:dark]" />
                            <span className="text-white/30 text-xs">—</span>
                            <input type="date" value={dateTo}
                                onChange={e => { setDateTo(e.target.value); setCurrentPage(1); }}
                                className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-gold/50 [color-scheme:dark]" />
                            {(dateFrom || dateTo) && (
                                <button onClick={() => { setDateFrom(''); setDateTo(''); setCurrentPage(1); }}
                                    className="text-white/30 hover:text-white/60 text-xs px-2">Resetta</button>
                            )}
                            <span className="text-xs text-white/30 ml-auto">{totalOrders} ordini</span>
                        </div>
                    </div>

                    <div className="bg-white/[0.02] border border-white/5 rounded-2xl overflow-hidden">
                        {/* Desktop Table */}
                        <div className="hidden md:block overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="border-b border-white/5 bg-white/[0.02]">
                                        <th className="p-4 text-xs font-medium text-white/40 uppercase tracking-wider">Ordine</th>
                                        <th className="p-4 text-xs font-medium text-white/40 uppercase tracking-wider">Pagamento</th>
                                        <th className="p-4 text-xs font-medium text-white/40 uppercase tracking-wider">Stato</th>
                                        <th className="p-4 text-xs font-medium text-white/40 uppercase tracking-wider">Azioni</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        <tr><td colSpan={4} className="p-8 text-center text-white/30 text-sm">Caricamento...</td></tr>
                                    ) : orders.length === 0 ? (
                                        <tr><td colSpan={4} className="p-8 text-center text-white/30 text-sm">Nessun ordine trovato.</td></tr>
                                    ) : orders.map(order => (
                                        <tr key={order.id} className="border-b border-white/5 hover:bg-white/[0.02] cursor-pointer"
                                            onClick={() => fetchOrderDetail(order.id)}>
                                            <td className="p-4">
                                                <div className="font-mono text-sm text-brand-gold">{order.order_number || order.reference_id.substring(0, 8)}</div>
                                                <div className="text-xs text-white/50">{new Date(order.created_at).toLocaleString('it-IT')}</div>
                                                {order.email && <div className="text-xs text-white/70 mt-1">{order.email}</div>}
                                            </td>
                                            <td className="p-4">
                                                <div className="text-sm font-medium">{fmt(order.fiat_amount)}</div>
                                                {order.crypto_amount !== undefined && <div className="text-xs text-white/40">{order.crypto_amount} {order.crypto_currency}</div>}
                                                {order.items && order.items.length > 0 && (
                                                    <div className="text-xs text-blue-400 mt-1">{order.items.reduce((a, i) => a + (i.quantity || 1), 0)}x Kit</div>
                                                )}
                                            </td>
                                            <td className="p-4"><StatusBadge status={order.status} /></td>
                                            <td className="p-4" onClick={e => e.stopPropagation()}>
                                                {order.status === 'paid' ? (
                                                    <div className="flex gap-2">
                                                        <button onClick={() => setShipModalOrder(order)}
                                                            className="bg-brand-gold/20 text-brand-gold px-3 py-1.5 rounded text-xs hover:bg-brand-gold/30 transition-colors">
                                                            Evadi
                                                        </button>
                                                        <button onClick={() => setRefundModalOrder(order)}
                                                            className="bg-red-500/10 text-red-400 px-3 py-1.5 rounded text-xs hover:bg-red-500/20 transition-colors">
                                                            Rimborsa
                                                        </button>
                                                    </div>
                                                ) : order.status === 'underpaid' ? (
                                                    <div className="flex gap-2">
                                                        <button onClick={() => acceptPayment(order.id)} disabled={updating[order.id]}
                                                            className="bg-orange-500/10 text-orange-400 disabled:opacity-30 px-3 py-1.5 rounded text-xs hover:bg-orange-500/20 transition-colors">
                                                            {updating[order.id] ? '...' : 'Accetta'}
                                                        </button>
                                                        <button onClick={() => setRefundModalOrder(order)}
                                                            className="bg-red-500/10 text-red-400 px-3 py-1.5 rounded text-xs hover:bg-red-500/20 transition-colors">
                                                            Rimborsa
                                                        </button>
                                                    </div>
                                                ) : order.status === 'expired' ? (
                                                    <div className="flex gap-2">
                                                        <button onClick={() => acceptPayment(order.id)} disabled={updating[order.id]}
                                                            className="bg-green-500/10 text-green-400 disabled:opacity-30 px-3 py-1.5 rounded text-xs hover:bg-green-500/20 transition-colors">
                                                            {updating[order.id] ? '...' : 'Accetta'}
                                                        </button>
                                                        <button onClick={() => setCancelModalOrder(order)}
                                                            className="bg-red-500/10 text-red-400 px-3 py-1.5 rounded text-xs hover:bg-red-500/20 transition-colors">
                                                            Cancella
                                                        </button>
                                                    </div>
                                                ) : order.status === 'shipped' ? (
                                                    <div className="text-xs text-white/50 flex items-center gap-1">
                                                        <CheckCircle className="w-3 h-3 text-brand-gold" />
                                                        {order.carrier} · {order.tracking_number}
                                                    </div>
                                                ) : order.status === 'processing' ? (
                                                    <button onClick={() => setRefundModalOrder(order)}
                                                        className="bg-red-500/10 text-red-400 px-3 py-1.5 rounded text-xs hover:bg-red-500/20 transition-colors">
                                                        Rimborsa
                                                    </button>
                                                ) : <span className="text-xs text-white/20">-</span>}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile Cards */}
                        <div className="md:hidden flex flex-col">
                            {loading ? (
                                <div className="p-8 text-center text-white/30 text-sm">Caricamento...</div>
                            ) : orders.length === 0 ? (
                                <div className="p-8 text-center text-white/30 text-sm">Nessun ordine trovato.</div>
                            ) : orders.map(order => (
                                <div key={order.id}
                                    onClick={() => fetchOrderDetail(order.id)}
                                    className="border-b border-white/5 p-4 cursor-pointer active:bg-white/[0.03] transition-colors">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <span className="font-mono text-sm text-brand-gold">{order.order_number || order.reference_id.substring(0, 8)}</span>
                                            <div className="text-xs text-white/40 mt-0.5">{new Date(order.created_at).toLocaleString('it-IT')}</div>
                                        </div>
                                        <StatusBadge status={order.status} />
                                    </div>
                                    {order.email && <div className="text-xs text-white/60 mb-1">{order.email}</div>}
                                    <div className="flex justify-between items-center">
                                        <div className="text-sm font-medium">{fmt(order.fiat_amount)}</div>
                                        {order.items && (
                                            <span className="text-xs text-blue-400">{order.items.reduce((a, i) => a + (i.quantity || 1), 0)}x Kit</span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="flex items-center justify-between px-4 py-3 border-t border-white/5">
                                <span className="text-xs text-white/40">
                                    {((currentPage - 1) * ordersPerPage) + 1}-{Math.min(currentPage * ordersPerPage, totalOrders)} di {totalOrders}
                                </span>
                                <div className="flex gap-1">
                                    <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}
                                        className="p-1.5 rounded-lg border border-white/10 text-white/50 hover:text-white disabled:opacity-30">
                                        <ChevronLeft className="w-4 h-4" />
                                    </button>
                                    {getPageNumbers().map(pageNum => (
                                        <button key={pageNum} onClick={() => setCurrentPage(pageNum)}
                                            className={`px-3 py-1.5 text-xs rounded-lg border ${currentPage === pageNum
                                                ? 'border-brand-gold/30 bg-brand-gold/10 text-brand-gold'
                                                : 'border-white/10 text-white/50 hover:text-white'}`}>
                                            {pageNum}
                                        </button>
                                    ))}
                                    <button disabled={currentPage >= totalPages} onClick={() => setCurrentPage(p => p + 1)}
                                        className="p-1.5 rounded-lg border border-white/10 text-white/50 hover:text-white disabled:opacity-30">
                                        <ChevronRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ══════════════ INVENTORY TAB ══════════════ */}
            {activeTab === 'inventory' && (
                <div className="flex flex-col gap-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="md:col-span-1">
                            <KpiCard label="Stock Attuale (RET-KIT-1)" value={String(invStock)} sub={invStock < 20 ? 'Scorte basse!' : 'Livello OK'} icon={<Boxes className="w-4 h-4" />} accent={invStock < 20 ? 'bg-red-500/10 text-red-400' : 'bg-green-500/10 text-green-400'} />
                        </div>
                        <div className="md:col-span-2 bg-white/[0.03] border border-white/8 rounded-2xl p-5">
                            <div className="text-xs text-white/40 uppercase tracking-wider mb-4">Aggiorna Inventario</div>
                            <div className="flex flex-col sm:flex-row gap-3">
                                <select value={invAction} onChange={e => setInvAction(e.target.value as 'add' | 'remove')}
                                    className="bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm appearance-none">
                                    <option value="add">Aggiungi</option>
                                    <option value="remove">Rimuovi</option>
                                </select>
                                <input type="number" min={0} value={invQty} onChange={e => setInvQty(parseInt(e.target.value) || 0)} placeholder="Quantita"
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
                        <div className="px-5 py-4 border-b border-white/5"><span className="text-sm font-medium">Storico Movimenti</span></div>
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
                                        <td className="p-4"><span className={`text-xs px-2 py-0.5 rounded ${m.type === 'add' ? 'bg-green-500/10 text-green-400' : m.type === 'remove' || m.type === 'sale' ? 'bg-red-500/10 text-red-400' : m.type === 'refund' ? 'bg-orange-500/10 text-orange-400' : 'bg-blue-500/10 text-blue-400'}`}>{m.type}</span></td>
                                        <td className="p-4 text-sm font-mono">{m.quantity > 0 ? '+' : ''}{m.quantity}</td>
                                        <td className="p-4 text-xs text-white/50">{m.previous_quantity} &rarr; {m.new_quantity}</td>
                                        <td className="p-4 text-xs text-white/50">{m.reason || '-'}</td>
                                        <td className="p-4 text-xs text-white/50">{m.performed_by_name || '-'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* ══════════════ CUSTOMERS TAB ══════════════ */}
            {activeTab === 'customers' && (
                <div className="flex flex-col gap-4">
                    {customerDetail ? (
                        <div className="flex flex-col gap-4">
                            <button onClick={() => setCustomerDetail(null)} className="flex items-center gap-2 text-sm text-brand-gold hover:underline w-fit">
                                <ArrowLeft className="w-4 h-4" /> Torna alla lista
                            </button>
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                <KpiCard label="Cliente" value={customerDetail.customer.full_name || customerDetail.customer.email} sub={customerDetail.customer.phone || ''} icon={<Users className="w-4 h-4" />} />
                                <KpiCard label="Totale Speso" value={fmt(customerDetail.customer.total_spent)} icon={<TrendingUp className="w-4 h-4" />} />
                                <KpiCard label="Ordini" value={String(customerDetail.customer.order_count)} icon={<ShoppingCart className="w-4 h-4" />} accent="bg-blue-500/10 text-blue-400" />
                                <KpiCard label="Ultimo Acquisto" value={customerDetail.customer.last_purchase ? new Date(customerDetail.customer.last_purchase).toLocaleDateString('it-IT') : '-'} icon={<Clock className="w-4 h-4" />} accent="bg-purple-500/10 text-purple-400" />
                            </div>
                            <div className="bg-white/[0.02] border border-white/5 rounded-2xl overflow-hidden">
                                <div className="px-5 py-4 border-b border-white/5"><span className="text-sm font-medium">Ordini del cliente</span></div>
                                <table className="w-full text-left">
                                    <tbody>
                                        {customerDetail.orders.map((o: Order) => (
                                            <tr key={o.id} className="border-b border-white/5 hover:bg-white/[0.02] cursor-pointer" onClick={() => fetchOrderDetail(o.id)}>
                                                <td className="px-5 py-3 font-mono text-xs text-brand-gold">{o.order_number || o.reference_id?.substring(0, 8)}</td>
                                                <td className="px-5 py-3 text-sm">{fmt(o.fiat_amount)}</td>
                                                <td className="px-5 py-3"><StatusBadge status={o.status} /></td>
                                                <td className="px-5 py-3 text-xs text-white/40">{new Date(o.created_at).toLocaleString('it-IT')}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ) : (
                        <>
                            {customerAggregates && (
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                    <KpiCard label="Clienti Totali" value={String(customerAggregates.total_customers || 0)} icon={<Users className="w-4 h-4" />} accent="bg-purple-500/10 text-purple-400" />
                                    <KpiCard label="LTV Medio" value={fmt(customerAggregates.avg_ltv || 0)} icon={<TrendingUp className="w-4 h-4" />} />
                                    <KpiCard label="Repeat Rate" value={`${customerAggregates.repeat_purchase_rate || 0}%`} icon={<BarChart3 className="w-4 h-4" />} accent="bg-cyan-500/10 text-cyan-400" />
                                    <KpiCard label="Ordini/Cliente" value={String(customerAggregates.avg_orders_per_customer || 0)} icon={<ShoppingCart className="w-4 h-4" />} accent="bg-amber-500/10 text-amber-400" />
                                </div>
                            )}
                            <div className="relative">
                                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                                <input type="text" placeholder="Cerca per email o nome..." value={customerSearch}
                                    onChange={e => setCustomerSearch(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && fetchCustomers()}
                                    className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-brand-gold/50" />
                            </div>
                            <div className="bg-white/[0.02] border border-white/5 rounded-2xl overflow-hidden">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="border-b border-white/5 bg-white/[0.02]">
                                            <th className="p-4 text-xs text-white/40 uppercase">Email</th>
                                            <th className="p-4 text-xs text-white/40 uppercase">Nome</th>
                                            <th className="p-4 text-xs text-white/40 uppercase">Ordini</th>
                                            <th className="p-4 text-xs text-white/40 uppercase">Totale Speso</th>
                                            <th className="p-4 text-xs text-white/40 uppercase">Ultimo Acquisto</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {customers.length === 0 ? (
                                            <tr><td colSpan={5} className="p-8 text-center text-white/30 text-sm">Nessun cliente trovato.</td></tr>
                                        ) : customers.map(c => (
                                            <tr key={c.email} className="border-b border-white/5 hover:bg-white/[0.02] cursor-pointer" onClick={() => viewCustomerDetail(c.email)}>
                                                <td className="p-4 text-sm text-brand-gold">{c.email}</td>
                                                <td className="p-4 text-sm text-white/70">{c.full_name || '-'}</td>
                                                <td className="p-4 text-sm font-mono">{c.order_count}</td>
                                                <td className="p-4 text-sm font-medium text-brand-gold">{fmt(c.total_spent)}</td>
                                                <td className="p-4 text-xs text-white/50">{c.last_purchase ? new Date(c.last_purchase).toLocaleDateString('it-IT') : '-'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* ══════════════ TEAM TAB ══════════════ */}
            {activeTab === 'team' && (
                <div className="flex flex-col gap-6">
                    <div className="bg-white/[0.03] border border-white/8 rounded-2xl p-5">
                        <div className="text-xs text-white/40 uppercase tracking-wider mb-4 flex items-center gap-2"><UserPlus className="w-4 h-4" /> Invita Membro</div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                            <input type="email" placeholder="Email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)}
                                className="bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-brand-gold/50" />
                            <input type="text" placeholder="Nome completo" value={inviteName} onChange={e => setInviteName(e.target.value)}
                                className="bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-brand-gold/50" />
                            <input type="text" placeholder="Telefono" value={invitePhone} onChange={e => setInvitePhone(e.target.value)}
                                className="bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-brand-gold/50" />
                            <select value={inviteRole} onChange={e => setInviteRole(e.target.value)}
                                className="bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm appearance-none">
                                <option value="seller">Seller</option>
                                <option value="warehouse">Warehouse</option>
                                <option value="manager">Manager</option>
                            </select>
                            <button onClick={inviteTeamMember} disabled={!inviteEmail}
                                className="bg-brand-gold text-black font-medium px-6 py-2.5 rounded-lg hover:bg-brand-gold/90 disabled:opacity-30 transition-colors text-sm">
                                Invita
                            </button>
                        </div>
                        {teamMessage && <div className="mt-3 text-xs text-brand-gold">{teamMessage}</div>}
                    </div>
                    <div className="bg-white/[0.02] border border-white/5 rounded-2xl overflow-hidden">
                        <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
                            <span className="text-sm font-medium">Team ({teamMembers.length})</span>
                        </div>
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-white/5 bg-white/[0.02]">
                                    <th className="p-4 text-xs text-white/40 uppercase">Membro</th>
                                    <th className="p-4 text-xs text-white/40 uppercase">Ruolo</th>
                                    <th className="p-4 text-xs text-white/40 uppercase">Stato</th>
                                    <th className="p-4 text-xs text-white/40 uppercase">Aggiunto</th>
                                    <th className="p-4 text-xs text-white/40 uppercase">Azioni</th>
                                </tr>
                            </thead>
                            <tbody>
                                {teamMembers.length === 0 ? (
                                    <tr><td colSpan={5} className="p-8 text-center text-white/30 text-sm">Nessun membro nel team.</td></tr>
                                ) : teamMembers.map(m => (
                                    <tr key={m.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                                        <td className="p-4">
                                            <div className="text-sm font-medium">{m.full_name || '-'}</div>
                                            <div className="text-xs text-white/50">{m.email}</div>
                                            {m.phone && <div className="text-xs text-white/30">{m.phone}</div>}
                                        </td>
                                        <td className="p-4"><RoleBadge role={m.role} /></td>
                                        <td className="p-4">
                                            {m.pending_removal ? (
                                                <span className="px-2 py-1 text-xs rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400">Rimozione Pendente</span>
                                            ) : m.is_active ? (
                                                <span className="px-2 py-1 text-xs rounded-full bg-green-500/10 border border-green-500/20 text-green-400">Attivo</span>
                                            ) : (
                                                <span className="px-2 py-1 text-xs rounded-full bg-white/5 border border-white/10 text-white/40">Inattivo</span>
                                            )}
                                        </td>
                                        <td className="p-4 text-xs text-white/40">{new Date(m.created_at).toLocaleDateString('it-IT')}</td>
                                        <td className="p-4">
                                            <div className="flex gap-2">
                                                {m.pending_removal ? (
                                                    <>
                                                        <button onClick={() => approveRemoval(m.id)} className="bg-green-500/10 text-green-400 px-3 py-1 rounded text-xs hover:bg-green-500/20">Approva</button>
                                                        <button onClick={() => rejectRemoval(m.id)} className="bg-white/5 text-white/50 px-3 py-1 rounded text-xs hover:bg-white/10">Rigetta</button>
                                                    </>
                                                ) : m.role !== 'super_admin' && m.is_active ? (
                                                    <button onClick={() => revokeTeamMember(m.id)} className="bg-red-500/10 text-red-400 px-3 py-1 rounded text-xs hover:bg-red-500/20 flex items-center gap-1">
                                                        <Trash2 className="w-3 h-3" /> Rimuovi
                                                    </button>
                                                ) : null}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* ══════════════ SETTINGS TAB ══════════════ */}
            {activeTab === 'settings' && (
                <div className="flex flex-col gap-6">
                    <div className="bg-white/[0.03] border border-white/8 rounded-2xl p-6">
                        <div className="text-xs text-white/40 uppercase tracking-wider mb-6 flex items-center gap-2"><Settings className="w-4 h-4" /> Impostazioni Store</div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs text-white/50 mb-1 block">Nome Store</label>
                                <input type="text" value={storeSettings.store_name || ''} onChange={e => setStoreSettings({ ...storeSettings, store_name: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-brand-gold/50" />
                            </div>
                            <div>
                                <label className="text-xs text-white/50 mb-1 block">Email Store</label>
                                <input type="email" value={storeSettings.store_email || ''} onChange={e => setStoreSettings({ ...storeSettings, store_email: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-brand-gold/50" />
                            </div>
                            <div>
                                <label className="text-xs text-white/50 mb-1 block">Soglia Scorte Basse</label>
                                <input type="number" value={storeSettings.low_stock_threshold || 20} onChange={e => setStoreSettings({ ...storeSettings, low_stock_threshold: parseInt(e.target.value) || 20 })}
                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-brand-gold/50" />
                            </div>
                            <div>
                                <label className="text-xs text-white/50 mb-1 block">Corrieri Disponibili (separati da virgola)</label>
                                <input type="text" value={Array.isArray(storeSettings.available_carriers) ? storeSettings.available_carriers.join(', ') : (storeSettings.available_carriers || '')}
                                    onChange={e => setStoreSettings({ ...storeSettings, available_carriers: e.target.value.split(',').map((s: string) => s.trim()).filter(Boolean) })}
                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-brand-gold/50" />
                            </div>
                        </div>
                        <div className="mt-6 flex items-center gap-4">
                            <button onClick={saveSettings}
                                className="bg-brand-gold text-black font-medium px-6 py-2.5 rounded-lg hover:bg-brand-gold/90 transition-colors text-sm">
                                Salva Impostazioni
                            </button>
                            {settingsMessage && <span className="text-xs text-brand-gold">{settingsMessage}</span>}
                        </div>
                    </div>
                </div>
            )}

            {loading && !['dashboard'].includes(activeTab) && orders.length === 0 && teamMembers.length === 0 && (
                <div className="text-center py-12 text-white/30 text-sm">Caricamento...</div>
            )}

            {/* ══════════════ MODALS & DRAWERS ══════════════ */}
            {(selectedOrder || orderDetailLoading) && (
                <OrderDetailDrawer
                    order={selectedOrder}
                    loading={orderDetailLoading}
                    onClose={() => { setSelectedOrder(null); setOrderDetailLoading(false); }}
                    onShip={() => setShipModalOrder(selectedOrder)}
                    onRefund={() => setRefundModalOrder(selectedOrder)}
                    onCancel={() => setCancelModalOrder(selectedOrder)}
                    onAccept={() => { if (selectedOrder) acceptPayment(selectedOrder.id); }}
                    updating={!!selectedOrder && !!updating[selectedOrder.id]}
                />
            )}

            <ShipModal
                order={shipModalOrder}
                onClose={() => setShipModalOrder(null)}
                onConfirm={(carrier, trackingNumber, shippingCost) => {
                    if (shipModalOrder) shipOrder(shipModalOrder.id, carrier, trackingNumber, shippingCost);
                }}
                updating={!!shipModalOrder && !!updating[shipModalOrder.id]}
            />

            <RefundModal
                order={refundModalOrder}
                onClose={() => setRefundModalOrder(null)}
                onConfirm={(amount, reason) => {
                    if (refundModalOrder) refundOrder(refundModalOrder.id, amount, reason);
                }}
                updating={!!refundModalOrder && !!updating[refundModalOrder.id]}
            />

            <CancelModal
                order={cancelModalOrder}
                onClose={() => setCancelModalOrder(null)}
                onConfirm={() => {
                    if (cancelModalOrder) cancelOrder(cancelModalOrder.id);
                }}
                updating={!!cancelModalOrder && !!updating[cancelModalOrder.id]}
            />
        </div>
    );
}
