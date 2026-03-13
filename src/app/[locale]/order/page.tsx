"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { ArrowLeft, Lock, Shield, ChevronRight, ChevronDown, Minus, Plus, MapPin, User, Mail, Phone, Eye, CreditCard, ExternalLink, ArrowRight, CheckCircle2, Zap, Clock } from "lucide-react";
import Link from "next/link";
import { PremiumButton } from "@/components/ui/PremiumButton";
import { useTranslations, useLocale } from "next-intl";
import { usePostHog } from "posthog-js/react";
import { LanguageSwitcher } from "@/components/ui/LanguageSwitcher";
import { OrderStructuredData } from "@/components/seo/OrderStructuredData";
import { sendFbEvent, sendFbEventBeacon, updateVisitor, getVisitorId } from '@/lib/fb-tracking';

const BASE_PRICE = 197;

const DISCOUNT_TIERS = [
    { min: 1, discount: 0 },
    { min: 3, discount: 10 },
    { min: 5, discount: 15 },
    { min: 10, discount: 25 },
    { min: 20, discount: 35 },
    { min: 30, discount: 50 },
];

function getDiscount(qty: number): number {
    let discount = 0;
    for (const tier of DISCOUNT_TIERS) {
        if (qty >= tier.min) discount = tier.discount;
    }
    return discount;
}

const EU_COUNTRIES = [
    "Austria", "Belgium", "Bulgaria", "Croatia", "Cyprus", "Czech Republic",
    "Denmark", "Estonia", "Finland", "France", "Germany", "Greece", "Hungary",
    "Ireland", "Italy", "Latvia", "Lithuania", "Luxembourg", "Malta", "Netherlands",
    "Poland", "Portugal", "Romania", "Slovakia", "Slovenia", "Spain", "Sweden"
];

const COUNTRY_PHONE_PREFIXES: Record<string, string> = {
    "Austria": "+43", "Belgium": "+32", "Bulgaria": "+359", "Croatia": "+385",
    "Cyprus": "+357", "Czech Republic": "+420", "Denmark": "+45", "Estonia": "+372",
    "Finland": "+358", "France": "+33", "Germany": "+49", "Greece": "+30",
    "Hungary": "+36", "Ireland": "+353", "Italy": "+39", "Latvia": "+371",
    "Lithuania": "+370", "Luxembourg": "+352", "Malta": "+356", "Netherlands": "+31",
    "Poland": "+48", "Portugal": "+351", "Romania": "+40", "Slovakia": "+421",
    "Slovenia": "+386", "Spain": "+34", "Sweden": "+46",
};

const ISO_TO_COUNTRY: Record<string, string> = {
    'AT': 'Austria', 'BE': 'Belgium', 'BG': 'Bulgaria', 'HR': 'Croatia',
    'CY': 'Cyprus', 'CZ': 'Czech Republic', 'DK': 'Denmark', 'EE': 'Estonia',
    'FI': 'Finland', 'FR': 'France', 'DE': 'Germany', 'GR': 'Greece',
    'HU': 'Hungary', 'IE': 'Ireland', 'IT': 'Italy', 'LV': 'Latvia',
    'LT': 'Lithuania', 'LU': 'Luxembourg', 'MT': 'Malta', 'NL': 'Netherlands',
    'PL': 'Poland', 'PT': 'Portugal', 'RO': 'Romania', 'SK': 'Slovakia',
    'SI': 'Slovenia', 'ES': 'Spain', 'SE': 'Sweden',
};

const EU_COUNTRY_CODES = ['at', 'be', 'bg', 'hr', 'cy', 'cz', 'dk', 'ee', 'fi', 'fr', 'de', 'gr', 'hu', 'ie', 'it', 'lv', 'lt', 'lu', 'mt', 'nl', 'pl', 'pt', 'ro', 'sk', 'si', 'es', 'se'];

const COUNTRY_TO_ISO: Record<string, string> = Object.fromEntries(
    Object.entries(ISO_TO_COUNTRY).map(([iso, name]) => [name, iso.toLowerCase()])
);

export default function OrderPage() {
    const t = useTranslations('Index');
    const locale = useLocale();
    const posthog = usePostHog();
    const [quantity, setQuantity] = useState(1);
    const [selectedCrypto, setSelectedCrypto] = useState("USDT");
    const [isProcessing, setIsProcessing] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);

    // Shipping form state
    const [email, setEmail] = useState("");
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [addressLine1, setAddressLine1] = useState("");
    const [addressLine2, setAddressLine2] = useState("");
    const [city, setCity] = useState("");
    const [postalCode, setPostalCode] = useState("");
    const [country, setCountry] = useState("");
    const [phone, setPhone] = useState("");
    const [phoneCountryCode, setPhoneCountryCode] = useState("+39");
    const [isDiscountOpen, setIsDiscountOpen] = useState(false);
    const [pendingOrder, setPendingOrder] = useState<{
        reference_id: string;
        order_number: string | null;
        crypto_currency: string;
        fiat_amount: number;
        created_at: string;
    } | null>(null);
    const addressInputRef = useRef<HTMLInputElement>(null);
    const autocompleteRef = useRef<any>(null);

    // Google Places Autocomplete (graceful degradation if API key missing or blocked)
    useEffect(() => {
        const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
        if (!apiKey || typeof window === 'undefined') return;

        const initAutocomplete = () => {
            const g = (window as /* eslint-disable-line */ any).google;
            if (!g?.maps?.places || !addressInputRef.current) return;

            const autocomplete = new g.maps.places.Autocomplete(addressInputRef.current, {
                types: ['address'],
                componentRestrictions: { country: EU_COUNTRY_CODES },
                fields: ['address_components'],
            });
            autocompleteRef.current = autocomplete;

            autocomplete.addListener('place_changed', () => {
                const place = autocomplete.getPlace();
                if (!place.address_components) return;

                let street = '', streetNumber = '', newCity = '', newPostalCode = '', countryIso = '';
                for (const comp of place.address_components) {
                    const type = comp.types[0];
                    if (type === 'street_number') streetNumber = comp.long_name;
                    else if (type === 'route') street = comp.long_name;
                    else if (type === 'locality' || type === 'administrative_area_level_3') newCity = newCity || comp.long_name;
                    else if (type === 'postal_code') newPostalCode = comp.long_name;
                    else if (type === 'country') countryIso = comp.short_name;
                }

                const fullStreet = streetNumber ? `${street} ${streetNumber}` : street;
                if (fullStreet) setAddressLine1(fullStreet);
                if (newCity) setCity(newCity);
                if (newPostalCode) setPostalCode(newPostalCode);
                if (countryIso) {
                    const countryName = ISO_TO_COUNTRY[countryIso];
                    if (countryName) {
                        setCountry(countryName);
                        const prefix = COUNTRY_PHONE_PREFIXES[countryName];
                        if (prefix) setPhoneCountryCode(prefix);
                    }
                }
            });
        };

        if ((window as /* eslint-disable-line */ any).google?.maps?.places) {
            initAutocomplete();
        } else if (!document.getElementById('google-maps-script')) {
            const script = document.createElement('script');
            script.id = 'google-maps-script';
            script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
            script.async = true;
            script.defer = true;
            script.addEventListener('load', initAutocomplete);
            document.head.appendChild(script);

            // Theme-aware autocomplete dropdown
            const isLight = document.documentElement.dataset.theme === 'light';
            const style = document.createElement('style');
            style.textContent = isLight
                ? `.pac-container{background:#FFFFFF;border:1px solid #E0DDD6;border-radius:12px;margin-top:4px;box-shadow:0 8px 32px rgba(0,0,0,0.1);z-index:9999}.pac-item{color:#475569;border-top:1px solid #ECEAE4;padding:8px 12px;cursor:pointer;font-size:14px}.pac-item:hover{background:#F8F7F4}.pac-item-query{color:#1A2744}.pac-icon{display:none}`
                : `.pac-container{background:#0a0a14;border:1px solid rgba(255,255,255,0.1);border-radius:12px;margin-top:4px;box-shadow:0 8px 32px rgba(0,0,0,0.5);z-index:9999}.pac-item{color:rgba(255,255,255,0.7);border-top:1px solid rgba(255,255,255,0.05);padding:8px 12px;cursor:pointer;font-size:14px}.pac-item:hover{background:rgba(255,255,255,0.1)}.pac-item-query{color:#d4af37}.pac-icon{display:none}`;
            document.head.appendChild(style);
        }
    }, []);

    // Update autocomplete restrictions when country changes
    useEffect(() => {
        if (!autocompleteRef.current) return;
        if (country) {
            const iso = COUNTRY_TO_ISO[country];
            if (iso) {
                autocompleteRef.current.setComponentRestrictions({ country: [iso] });
            }
        } else {
            autocompleteRef.current.setComponentRestrictions({ country: EU_COUNTRY_CODES });
        }
    }, [country]);

    // Persistenza form: carica dati salvati al primo render
    useEffect(() => {
        try {
            const saved = localStorage.getItem('aura_order_form_v1');
            if (!saved) return;
            const d = JSON.parse(saved);
            if (d.email)           setEmail(d.email);
            if (d.firstName)       setFirstName(d.firstName);
            if (d.lastName)        setLastName(d.lastName);
            // Legacy migration
            if (d.fullName && !d.firstName) {
                const parts = d.fullName.trim().split(/\s+/);
                setFirstName(parts[0] || '');
                setLastName(parts.slice(1).join(' ') || '');
            }
            if (d.addressLine1)    setAddressLine1(d.addressLine1);
            if (d.addressLine2)    setAddressLine2(d.addressLine2);
            if (d.city)            setCity(d.city);
            if (d.postalCode)      setPostalCode(d.postalCode);
            if (d.country)         setCountry(d.country);
            if (d.phone)           setPhone(d.phone);
            if (d.phoneCountryCode) setPhoneCountryCode(d.phoneCountryCode);
            if (d.selectedCrypto)  setSelectedCrypto(d.selectedCrypto);
            if (d.quantity)        setQuantity(d.quantity);
        } catch {}
    }, []);

    // Persistenza form: salva ad ogni modifica
    useEffect(() => {
        try {
            localStorage.setItem('aura_order_form_v1', JSON.stringify({
                email, firstName, lastName, addressLine1, addressLine2, city,
                postalCode, country, phone, phoneCountryCode, selectedCrypto, quantity
            }));
        } catch {}
    }, [email, firstName, lastName, addressLine1, addressLine2, city, postalCode, country, phone, phoneCountryCode, selectedCrypto, quantity]);

    const discount = getDiscount(quantity);
    const unitPrice = Math.round(BASE_PRICE * (1 - discount / 100));
    const totalPrice = unitPrice * quantity;
    const savedAmount = (BASE_PRICE * quantity) - totalPrice;

    // Facebook CAPI: ViewContent on page load
    useEffect(() => {
        sendFbEvent('ViewContent', null, {
            content_name: 'Order Page',
            content_category: 'checkout',
            content_ids: ['RET-KIT-1'],
            value: 197,
            currency: 'EUR',
        }, 'order');
    }, []);

    // Facebook CAPI: abandonment detection on tab hide
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.hidden && email && email.includes('@')) {
                const visitorId = getVisitorId();
                sendFbEventBeacon('InitiateCheckout', `${visitorId}_InitiateCheckout`, {
                    email,
                    phone: phone ? `${phoneCountryCode} ${phone}` : undefined,
                    first_name: firstName || undefined,
                    last_name: lastName || undefined,
                }, {
                    content_ids: ['RET-KIT-1'],
                    num_items: quantity,
                    value: totalPrice,
                    currency: 'EUR',
                });
            }
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, [email, phone, phoneCountryCode, firstName, lastName, quantity, totalPrice]);

    // Progressive lead capture: send data to /api/leads on field blur
    const leadSentRef = useRef<string>(''); // tracks last sent payload hash
    const sendLead = useCallback(() => {
        if (!email || !email.includes('@')) return;
        const payload = { email, firstName, lastName, phone: phone ? `${phoneCountryCode}${phone}` : '', country, city, locale };
        const hash = JSON.stringify(payload);
        if (hash === leadSentRef.current) return; // no change
        leadSentRef.current = hash;
        fetch('/api/leads', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: hash }).catch(() => {});

        // PostHog: identify user + set person properties
        if (email && email.includes('@')) {
            posthog?.identify(email, {
                email,
                ...(firstName && { first_name: firstName }),
                ...(lastName && { last_name: lastName }),
                ...(country && { country }),
                ...(city && { city }),
                locale,
            });
        }

        // Facebook CAPI: progressive visitor enrichment
        const visitorData: Record<string, string | undefined> = {};
        if (email) visitorData.email = email;
        if (firstName) visitorData.first_name = firstName;
        if (lastName) visitorData.last_name = lastName;
        if (phone && phone.length > 5) visitorData.phone = `${phoneCountryCode} ${phone}`;
        updateVisitor(visitorData);
    }, [email, firstName, lastName, phone, phoneCountryCode, country, city, locale]);

    const validateForm = (): boolean => {
        if (!email || !email.includes('@')) {
            setFormError(t('order_error_email'));
            return false;
        }
        if (!firstName || firstName.length < 2) {
            setFormError(t('order_error_first_name'));
            return false;
        }
        if (!lastName || lastName.length < 2) {
            setFormError(t('order_error_last_name'));
            return false;
        }
        if (!addressLine1 || addressLine1.length < 3) {
            setFormError(t('order_error_address'));
            return false;
        }
        if (!city) {
            setFormError(t('order_error_city'));
            return false;
        }
        if (!postalCode) {
            setFormError(t('order_error_postal'));
            return false;
        }
        if (!country) {
            setFormError(t('order_error_country'));
            return false;
        }
        const phoneDigits = phone.replace(/\D/g, '');
        if (!phone || phoneDigits.length < 6) {
            setFormError(t('order_error_phone'));
            return false;
        }
        setFormError(null);
        return true;
    };

    const handleCheckout = async (skipPendingCheck = false) => {
        if (!validateForm()) return;

        setIsProcessing(true);
        setFormError(null);

        // Idempotency check: look for an existing pending order with the same email
        if (!skipPendingCheck && email.includes('@')) {
            try {
                const pendingRes = await fetch(`/api/checkout/pending?email=${encodeURIComponent(email.toLowerCase().trim())}`);
                const pendingData = await pendingRes.json();
                if (pendingData.order) {
                    setPendingOrder(pendingData.order);
                    setIsProcessing(false);
                    setTimeout(() => {
                        document.getElementById('pending-order-alert')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }, 100);
                    return;
                }
            } catch {
                // API error — proceed with new order creation
            }
        }

        try {
            // Facebook CAPI: InitiateCheckout (dedup by email)
            sendFbEvent('InitiateCheckout', {
                email,
                phone: `${phoneCountryCode} ${phone}`,
                first_name: firstName,
                last_name: lastName,
                city,
                postal_code: postalCode,
                country_code: COUNTRY_TO_ISO[country] || '',
            }, {
                content_ids: ['RET-KIT-1'],
                num_items: quantity,
                value: totalPrice,
                currency: 'EUR',
            }, email);

            const res = await fetch('/api/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email,
                    shipping_address: {
                        full_name: `${firstName} ${lastName}`.trim(),
                        address_line_1: addressLine1,
                        address_line_2: addressLine2,
                        city,
                        postal_code: postalCode,
                        country,
                        phone: `${phoneCountryCode} ${phone}`,
                    },
                    quantity,
                    crypto_currency: selectedCrypto,
                    visitor_id: getVisitorId(),
                })
            });
            const data = await res.json();

            if (data.reference_id) {
                posthog?.capture('order_submitted', {
                    locale,
                    quantity,
                    crypto: selectedCrypto,
                    total_eur: totalPrice,
                    discount_pct: discount,
                    country,
                    reference_id: data.reference_id,
                });
                (window as any).clarity?.("set", "order_submitted", "true");
                (window as any).clarity?.("set", "crypto", selectedCrypto);
                (window as any).clarity?.("set", "country", country);

                // Facebook CAPI: AddPaymentInfo on successful order creation
                sendFbEvent('AddPaymentInfo', {
                    email,
                    phone: `${phoneCountryCode} ${phone}`,
                    first_name: firstName,
                    last_name: lastName,
                    city,
                    postal_code: postalCode,
                    country_code: COUNTRY_TO_ISO[country] || '',
                }, {
                    content_ids: ['RET-KIT-1'],
                    num_items: quantity,
                    value: totalPrice,
                    currency: 'EUR',
                    crypto_currency: selectedCrypto,
                }, data.reference_id);

                window.location.href = `/${locale}/checkout/${data.reference_id}`;
            } else {
                setFormError(data.error || 'Checkout failed');
                setIsProcessing(false);
            }
        } catch (err) {
            console.error("Checkout Error:", err);
            setFormError('Network error. Please try again.');
            setIsProcessing(false);
        }
    };

    return (
        <main className="min-h-screen bg-t-bg text-t-text font-sans flex flex-col overflow-x-hidden">
            {/* HEADER */}
            <header className="w-full py-6 px-6 md:px-12 flex justify-between items-center border-b border-t-border-subtle bg-t-bg/50 backdrop-blur-md sticky top-0 z-50">
                <div className="flex items-center gap-3">
                    <button onClick={() => window.location.href = `/${locale}`} className="text-t-text-3 hover:text-t-text transition-colors">
                        <ArrowLeft className="w-4 h-4" />
                    </button>
                    <div className="flex items-center gap-1.5">
                        <Lock className="w-3.5 h-3.5 text-t-success" />
                        <span className="text-xs text-t-success font-medium tracking-wider uppercase whitespace-nowrap">{t('order_secure')}</span>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <LanguageSwitcher />
                </div>
            </header>

            <div className="flex-1 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 p-6 md:p-12 pb-28 lg:pb-12 relative">
                <div className="absolute top-1/2 left-1/3 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-t-accent/5 blur-[120px] rounded-full pointer-events-none"></div>

                {/* LEFT COLUMN */}
                <div className="lg:col-span-7 flex flex-col gap-8 relative z-10">
                    {/* Step indicator */}
                    <div className="flex items-center gap-2 text-xs text-t-text-4">
                        <span className="w-5 h-5 rounded-full bg-t-accent/20 border border-t-accent/40 flex items-center justify-center text-t-accent text-[10px] font-semibold">1</span>
                        <span>{t('order_step_indicator')}</span>
                    </div>

                    <div>
                        <h1 className="text-3xl md:text-5xl font-light mb-2">{t('order_select_title')} <span className="font-medium text-t-accent">{t('order_select_highlight')}</span></h1>
                        <p className="text-t-text-3 text-sm">{t('order_select_desc')}</p>
                    </div>

                    {/* QUANTITY SELECTOR */}
                    <div className="glass-panel p-8 border-t-accent/20">
                        <div className="flex flex-col sm:flex-row justify-between items-center gap-6">
                            <div className="flex flex-col gap-1">
                                <span className="text-sm text-t-text-3 uppercase tracking-widest">{t('order_quantity')}</span>
                                <span className="text-t-text-4 text-xs">Retatrutide 10mg</span>
                                <span className="text-t-success/70 text-xs">+ {t('order_free_bac_water')}</span>
                            </div>
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={() => { const q = Math.max(1, quantity - 1); setQuantity(q); posthog?.capture('quantity_changed', { quantity: q }); }}
                                    className="w-12 h-12 rounded-xl border border-t-border flex items-center justify-center hover:border-t-accent hover:bg-t-accent/10 transition-all active:scale-95"
                                >
                                    <Minus className="w-5 h-5" />
                                </button>
                                <input
                                    type="number"
                                    min="1"
                                    max="100"
                                    value={quantity}
                                    onChange={(e) => {
                                        const val = parseInt(e.target.value) || 1;
                                        setQuantity(Math.max(1, Math.min(100, val)));
                                    }}
                                    className="w-20 h-12 text-center text-2xl font-light bg-transparent border border-t-border rounded-xl focus:border-t-accent focus:outline-none text-t-text"
                                />
                                <button
                                    onClick={() => { const q = Math.min(100, quantity + 1); setQuantity(q); posthog?.capture('quantity_changed', { quantity: q }); }}
                                    className="w-12 h-12 rounded-xl border border-t-border flex items-center justify-center hover:border-t-accent hover:bg-t-accent/10 transition-all active:scale-95"
                                >
                                    <Plus className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        {/* LIVE PRICING BREAKDOWN */}
                        <div className="mt-6 pt-6 border-t border-t-border grid grid-cols-3 gap-4 text-center">
                            <div className="flex flex-col">
                                <span className="text-xs text-t-text-4 uppercase tracking-wider">{t('order_unit_price')}</span>
                                <span className="text-2xl font-light text-t-text mt-1">{unitPrice}€</span>
                                {discount > 0 && (
                                    <span className="text-xs text-t-text-4 line-through">{BASE_PRICE}€</span>
                                )}
                            </div>
                            <div className="flex flex-col">
                                <span className="text-xs text-t-text-4 uppercase tracking-wider">{t('order_discount_label')}</span>
                                <span className={`text-2xl font-light mt-1 ${discount > 0 ? 'text-t-success' : 'text-t-text-4'}`}>
                                    {discount > 0 ? `-${discount}%` : '—'}
                                </span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-xs text-t-text-4 uppercase tracking-wider">{t('order_total')}</span>
                                <span className="text-2xl font-light text-t-accent mt-1">{totalPrice}€</span>
                                {savedAmount > 0 && (
                                    <span className="text-xs text-t-success">{t('order_save')} {savedAmount}€</span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* DISCOUNT TIERS TABLE */}
                    <div className="glass-panel border-t-border overflow-hidden">
                        <button
                            type="button"
                            onClick={() => setIsDiscountOpen(prev => !prev)}
                            className="w-full px-6 py-4 border-b border-t-border bg-t-bg-subtle flex items-center justify-between hover:bg-t-bg-subtle transition-colors"
                        >
                            <h3 className="text-sm font-medium uppercase tracking-widest text-t-accent">{t('order_volume_discounts')}</h3>
                            <ChevronDown className={`w-4 h-4 text-t-accent/60 transition-transform duration-200 ${isDiscountOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {isDiscountOpen && (<>
                        {/* Upsell banner */}
                        {(() => {
                            const nextTierData = DISCOUNT_TIERS.find(tier => tier.min > quantity);
                            const nextTierPrice = nextTierData ? Math.round(BASE_PRICE * (1 - nextTierData.discount / 100)) : null;
                            if (nextTierData && nextTierPrice !== null) {
                                return (
                                    <div
                                        className="mx-4 mt-4 flex items-center gap-2 bg-t-accent/5 border border-t-accent/20 rounded-xl px-4 py-3 cursor-pointer hover:bg-t-accent/10 transition-colors"
                                        onClick={() => setQuantity(nextTierData.min)}
                                    >
                                        <ArrowRight className="w-4 h-4 text-t-accent shrink-0" />
                                        <span className="text-sm text-t-text-2">
                                            {t('order_upsell_msg', { qty: nextTierData.min - quantity, price: nextTierPrice, discount: nextTierData.discount })}
                                        </span>
                                    </div>
                                );
                            }
                            return (
                                <div className="mx-4 mt-4 flex items-center gap-2 bg-t-success-dim border border-green-500/20 rounded-xl px-4 py-3">
                                    <CheckCircle2 className="w-4 h-4 text-t-success shrink-0" />
                                    <span className="text-sm text-t-success">
                                        {t('order_max_discount', { save: savedAmount })}
                                    </span>
                                </div>
                            );
                        })()}

                        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {DISCOUNT_TIERS.map((tier, i) => {
                                const nextTier = DISCOUNT_TIERS[i + 1];
                                const isActive = discount === tier.discount;
                                const tierPrice = Math.round(BASE_PRICE * (1 - tier.discount / 100));
                                const tierSavingPerUnit = Math.round(BASE_PRICE * tier.discount / 100);
                                const isPopular = tier.min === 3;
                                const isBestValue = !nextTier;

                                return (
                                    <div
                                        key={tier.min}
                                        onClick={() => setQuantity(tier.min)}
                                        className={`relative flex flex-col p-4 rounded-xl border transition-all cursor-pointer overflow-hidden ${isActive
                                            ? 'bg-t-accent/10 border-t-accent shadow-[0_0_15px_rgba(212,175,55,0.15)]'
                                            : 'bg-t-bg-subtle border-t-border hover:border-t-border hover:bg-t-bg-subtle'
                                            }`}
                                    >
                                        {isActive && <div className="absolute top-0 left-0 w-full h-1 bg-t-accent"></div>}

                                        {/* Range label + badge + sconto % — tutto inline, nessuna sovrapposizione */}
                                        <div className="flex items-center gap-1.5 mb-2">
                                            <span className={`text-sm font-medium flex-1 ${isActive ? 'text-t-text' : 'text-t-text-2'}`}>
                                                {tier.min === 1 ? `1–2 ${t('order_pieces')}` :
                                                    nextTier ? `${tier.min}–${nextTier.min - 1} ${t('order_pieces')}` :
                                                        `${tier.min}+ ${t('order_pieces')}`}
                                            </span>
                                            {isPopular && (
                                                <span className="text-[9px] bg-t-btn text-t-btn-text px-1.5 py-0.5 rounded font-bold tracking-wide uppercase shrink-0">
                                                    {t('order_popular')}
                                                </span>
                                            )}
                                            {isBestValue && !isPopular && (
                                                <span className="text-[9px] bg-t-success-dim text-t-success border border-green-500/30 px-1.5 py-0.5 rounded font-bold tracking-wide uppercase shrink-0">
                                                    {t('order_best_value')}
                                                </span>
                                            )}
                                            {tier.discount > 0 ? (
                                                <span className={`text-sm font-bold shrink-0 ${isActive ? 'text-t-success' : 'text-t-success/70'}`}>-{tier.discount}%</span>
                                            ) : (
                                                <span className="text-sm text-t-text-4 shrink-0">—</span>
                                            )}
                                        </div>

                                        {/* Prezzo unitario */}
                                        <span className={`text-[1.3rem] leading-none font-light ${isActive ? 'text-t-accent' : 'text-t-text-2'}`}>
                                            {tierPrice}€<span className="text-xs text-t-text-4">/{t('order_piece_short')}</span>
                                        </span>

                                        {/* Risparmio per unità (card inattive) */}
                                        {tierSavingPerUnit > 0 && (
                                            <span className={`text-xs mt-1 ${isActive ? 'text-t-success' : 'text-t-success/60'}`}>
                                                {t('order_save')} €{tierSavingPerUnit}/{t('order_piece_short')}
                                            </span>
                                        )}

                                        {/* Totale (solo card attiva) */}
                                        {isActive && (
                                            <div className="mt-2 pt-2 border-t border-t-border flex items-center justify-between">
                                                <span className="text-xs text-t-text-4">{t('order_total')}</span>
                                                <span className="text-sm font-medium text-t-text">€{totalPrice}</span>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                        </>)}
                    </div>

                    {/* SHIPPING FORM */}
                    <div className="glass-panel border-t-border overflow-hidden">
                        <div className="px-6 py-4 border-b border-t-border bg-t-bg-subtle flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-t-accent" />
                            <h3 className="text-sm font-medium uppercase tracking-widest text-t-accent">{t('order_shipping_details')}</h3>
                        </div>
                        <div className="p-6 flex flex-col gap-4">
                            {/* Contact Box (Group 1) */}
                            <div className="flex flex-col gap-3 p-4 bg-t-bg-subtle rounded-xl border border-t-border-subtle">
                                <span className="text-[10px] uppercase tracking-widest text-t-accent font-medium mb-1">{t('order_form_contact')}</span>
                                {/* Email */}
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-t-text-4" />
                                    <input
                                        type="email"
                                        autoComplete="email"
                                        placeholder={t('order_field_email')}
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        onBlur={sendLead}
                                        className="w-full h-12 bg-t-bg-subtle border border-t-border rounded-xl pl-11 pr-4 text-sm text-t-text placeholder:text-t-text-4 focus:border-t-accent focus:outline-none transition-colors"
                                    />
                                </div>

                                {/* First Name + Last Name */}
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="relative">
                                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-t-text-4" />
                                        <input
                                            type="text"
                                            autoComplete="given-name"
                                            placeholder={t('order_field_first_name')}
                                            value={firstName}
                                            onChange={(e) => setFirstName(e.target.value)}
                                            onBlur={sendLead}
                                            className="w-full h-12 bg-t-bg-subtle border border-t-border rounded-xl pl-11 pr-4 text-sm text-t-text placeholder:text-t-text-4 focus:border-t-accent focus:outline-none transition-colors"
                                        />
                                    </div>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            autoComplete="family-name"
                                            placeholder={t('order_field_last_name')}
                                            value={lastName}
                                            onChange={(e) => setLastName(e.target.value)}
                                            onBlur={sendLead}
                                            className="w-full h-12 bg-t-bg-subtle border border-t-border rounded-xl pl-4 pr-4 text-sm text-t-text placeholder:text-t-text-4 focus:border-t-accent focus:outline-none transition-colors"
                                        />
                                    </div>
                                </div>

                                {/* Phone with country code */}
                                <div className="flex gap-2 w-full items-center">
                                    {/* Prefix selector — visual overlay trick: display shows only "+39", options show "IT +39" */}
                                    <div className="relative w-[88px] shrink-0 h-12">
                                        {/* Visual layer (pointer-events-none) */}
                                        <div className="absolute inset-0 flex items-center rounded-xl bg-t-bg-subtle border border-t-border pointer-events-none">
                                            <Phone className="ml-3 w-4 h-4 text-t-text-4 shrink-0" />
                                            <span className="ml-2 text-sm text-t-text flex-1 truncate">{phoneCountryCode}</span>
                                            <ChevronDown className="mr-2 w-3 h-3 text-t-text-4 shrink-0" />
                                        </div>
                                        {/* Invisible native select on top — opens with full "IT +39" options */}
                                        <select
                                            autoComplete="tel-country-code"
                                            value={phoneCountryCode}
                                            onChange={(e) => setPhoneCountryCode(e.target.value)}
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                        >
                                            {Object.entries(COUNTRY_PHONE_PREFIXES).map(([name, prefix]) => (
                                                <option key={name} value={prefix}>{COUNTRY_TO_ISO[name]?.toUpperCase()} {prefix}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <input
                                        type="tel"
                                        autoComplete="tel-national"
                                        placeholder={t('order_field_phone')}
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        onBlur={sendLead}
                                        className="flex-1 min-w-0 h-12 bg-t-bg-subtle border border-t-border rounded-xl px-4 text-sm text-t-text placeholder:text-t-text-4 focus:border-t-accent focus:outline-none transition-colors"
                                    />
                                </div>
                            </div>

                            {/* Shipping Box (Group 2) */}
                            <div className="flex flex-col gap-3 p-4 bg-t-bg-subtle rounded-xl border border-t-border-subtle">
                                <span className="text-[10px] uppercase tracking-widest text-t-accent font-medium mb-1">{t('order_form_destination')}</span>
                                {/* Country */}
                                <div className="relative">
                                    <select
                                        autoComplete="country-name"
                                        value={country}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            setCountry(val);
                                            const prefix = COUNTRY_PHONE_PREFIXES[val];
                                            if (prefix) setPhoneCountryCode(prefix);
                                        }}
                                        onBlur={sendLead}
                                        className="w-full h-12 bg-t-bg-subtle border border-t-border rounded-xl px-4 text-sm text-t-text appearance-none focus:border-t-accent focus:outline-none transition-colors cursor-pointer"
                                    >
                                        <option value="" className="bg-t-bg">{t('order_field_country')}</option>
                                        {EU_COUNTRIES.map(c => (
                                            <option key={c} value={c} className="bg-t-bg">{c}</option>
                                        ))}
                                    </select>
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-t-text-4 text-xs">▼</div>
                                </div>

                                {/* Address Line 1 */}
                                <input
                                    ref={addressInputRef}
                                    type="text"
                                    autoComplete="shipping street-address"
                                    placeholder={t('order_field_address1')}
                                    value={addressLine1}
                                    onChange={(e) => setAddressLine1(e.target.value)}
                                    className="w-full h-12 bg-t-bg-subtle border border-t-border rounded-xl px-4 text-sm text-t-text placeholder:text-t-text-4 focus:border-t-accent focus:outline-none transition-colors"
                                />

                                {/* Address Line 2 */}
                                <input
                                    type="text"
                                    autoComplete="shipping address-line2"
                                    placeholder={t('order_field_address2')}
                                    value={addressLine2}
                                    onChange={(e) => setAddressLine2(e.target.value)}
                                    className="w-full h-12 bg-t-bg-subtle border border-t-border rounded-xl px-4 text-sm text-t-text placeholder:text-t-text-4 focus:border-t-accent focus:outline-none transition-colors"
                                />

                                {/* City + Postal Code */}
                                <div className="grid grid-cols-2 gap-3">
                                    <input
                                        type="text"
                                        autoComplete="shipping address-level2"
                                        placeholder={t('order_field_city')}
                                        value={city}
                                        onChange={(e) => setCity(e.target.value)}
                                        onBlur={sendLead}
                                        className="w-full h-12 bg-t-bg-subtle border border-t-border rounded-xl px-4 text-sm text-t-text placeholder:text-t-text-4 focus:border-t-accent focus:outline-none transition-colors"
                                    />
                                    <input
                                        type="text"
                                        autoComplete="shipping postal-code"
                                        placeholder={t('order_field_postal')}
                                        value={postalCode}
                                        onChange={(e) => setPostalCode(e.target.value)}
                                        className="w-full h-12 bg-t-bg-subtle border border-t-border rounded-xl px-4 text-sm text-t-text placeholder:text-t-text-4 focus:border-t-accent focus:outline-none transition-colors"
                                    />
                                </div>
                            </div>
                            <p className="text-xs text-t-text-4 px-1">{t('order_privacy_note')}</p>
                        </div>
                    </div>

                    {/* GUARANTEE */}
                    <div className="flex items-start gap-4 p-6 glass-panel border-t-border">
                        <Shield className="w-8 h-8 text-t-accent shrink-0" />
                        <div className="flex flex-col gap-1 text-sm text-t-text-2">
                            <span className="font-semibold text-t-text">{t('order_guarantee_title')}</span>
                            <p>{t('order_guarantee_desc')}</p>
                        </div>
                    </div>
                </div>

                {/* RIGHT COLUMN: Order Summary & Payment */}
                <div className="lg:col-span-5 relative z-10">
                    <div className="glass-panel border-t-accent/20 p-8 flex flex-col gap-6 sticky top-24">
                        <h2 className="text-xl font-medium border-b border-t-border pb-4">{t('order_summary')}</h2>

                        <div className="flex flex-col gap-3 text-sm">
                            <div className="flex justify-between text-t-text-2">
                                <span>{t('order_product')}</span>
                                <span>Retatrutide 10mg × {quantity}</span>
                            </div>
                            <div className="flex justify-between text-t-success/80 text-xs">
                                <span>{t('order_free_bac_water')}</span>
                                <span>× {quantity}</span>
                            </div>
                            <div className="flex justify-between text-t-text-2">
                                <span>{t('order_unit_price')}</span>
                                <span className="flex items-baseline gap-1.5">
                                    {discount > 0 && <span className="text-t-text-4 line-through text-xs">{BASE_PRICE}€</span>}
                                    <span>{unitPrice}€</span>
                                </span>
                            </div>
                            <div className="flex justify-between text-t-text-2">
                                <span>{t('order_shipping')}</span>
                                <span className="flex items-baseline gap-2">
                                    <span className="text-t-text-4 text-xs">{t('order_free_stealth')}</span>
                                    <span className="text-t-text-2">0€</span>
                                </span>
                            </div>

                            {discount > 0 && (
                                <div className="flex justify-between text-t-success">
                                    <span>{t('order_bulk_discount')} ({discount}%)</span>
                                    <span>- {savedAmount}€</span>
                                </div>
                            )}
                        </div>

                        <div className="flex justify-between items-end border-t border-t-border pt-4">
                            <span className="text-lg">{t('order_total')}</span>
                            <div className="flex flex-col items-end">
                                <span className="text-3xl font-light text-t-accent">{totalPrice}€</span>
                            </div>
                        </div>

                        {/* NO CRYPTO CARD - Prominent, right after total */}
                        <div className="rounded-xl p-4 border border-t-accent/40 bg-t-accent/5">
                            <div className="flex items-center gap-2 mb-2">
                                <CreditCard className="w-4 h-4 text-t-accent shrink-0" />
                                <p className="text-sm font-semibold text-t-text">{t('order_no_crypto_title')}</p>
                            </div>
                            <p className="text-xs text-t-text-2 leading-relaxed mb-3">{t('order_no_crypto_desc')}</p>
                            <a
                                href={`/${locale}/crypto-guide`}
                                className="w-full flex items-center justify-center gap-2 text-xs font-semibold bg-t-accent/15 hover:bg-t-accent/25 border border-t-accent/40 text-t-accent py-3 px-4 rounded-lg transition-colors"
                            >
                                {t('order_no_crypto_cta')} <ArrowRight className="w-3.5 h-3.5" />
                            </a>
                        </div>

                        {/* PAYMENT SELECTION + CRYPTO SELECTOR */}
                        <div className="flex flex-col gap-4 mt-4">
                            <h3 className="text-sm font-medium text-t-text-2 uppercase tracking-widest">{t('order_payment_method')}</h3>

                            <div className="bg-t-bg-subtle rounded-xl p-4 border border-t-border">
                                <div className="flex items-center gap-3 mb-3">
                                    <Lock className="w-4 h-4 text-t-accent" />
                                    <span className="text-xs font-medium text-t-accent">{t('order_crypto_native')}</span>
                                </div>
                                <p className="text-xs text-t-text-3 mb-3">{t('order_crypto_desc')}</p>
                                <div className="relative h-10">
                                    <select
                                        value={selectedCrypto}
                                        onChange={(e) => { setSelectedCrypto(e.target.value); posthog?.capture('crypto_selected', { crypto: e.target.value }); (window as any).clarity?.("set", "crypto_selected", e.target.value); }}
                                        className="w-full h-full bg-t-bg/80 border border-t-accent/30 text-t-text text-sm rounded-lg px-4 appearance-none focus:outline-none focus:border-t-accent tracking-wider cursor-pointer font-medium"
                                    >
                                        <option value="USDT">USDT — Stablecoin (TRC20) ✓</option>
                                        <option value="BTC">Bitcoin (BTC)</option>
                                        <option value="ETH">Ethereum (ETH)</option>
                                        <option value="USDC">USDC — Stablecoin (ERC20)</option>
                                        <option value="SOL">Solana (SOL)</option>
                                        <option value="XMR">Monero (XMR)</option>
                                    </select>
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-t-accent/50 text-xs">▼</div>
                                </div>
                            </div>
                        </div>

                        {/* WHY CRYPTO — collapsed accordion */}
                        <details className="bg-t-bg-subtle rounded-xl border border-t-border overflow-hidden">
                            <summary className="flex items-center gap-2 px-4 py-3 cursor-pointer text-xs font-medium uppercase tracking-widest text-t-accent hover:bg-t-bg-subtle transition-colors">
                                <Zap className="w-3.5 h-3.5" />
                                {t('order_why_crypto')}
                            </summary>
                            <div className="px-4 pb-4 flex flex-col gap-3">
                                <div className="flex items-start gap-3">
                                    <div className="w-6 h-6 rounded-full bg-t-accent/10 flex items-center justify-center shrink-0 mt-0.5">
                                        <Zap className="w-3 h-3 text-t-accent" />
                                    </div>
                                    <p className="text-xs text-t-text-2 leading-relaxed">{t('order_why_crypto_1')}</p>
                                </div>
                                <div className="flex items-start gap-3">
                                    <div className="w-6 h-6 rounded-full bg-t-accent/10 flex items-center justify-center shrink-0 mt-0.5">
                                        <Eye className="w-3 h-3 text-t-accent" />
                                    </div>
                                    <p className="text-xs text-t-text-2 leading-relaxed">{t('order_why_crypto_2')}</p>
                                </div>
                                <div className="flex items-start gap-3">
                                    <div className="w-6 h-6 rounded-full bg-t-success-dim flex items-center justify-center shrink-0 mt-0.5">
                                        <Shield className="w-3 h-3 text-t-success" />
                                    </div>
                                    <p className="text-xs text-t-text-2 leading-relaxed">{t('order_why_crypto_3')}</p>
                                </div>
                            </div>
                        </details>

                        {/* ERROR */}
                        {formError && (
                            <div id="form-error" className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 animate-fade-in">
                                {formError}
                            </div>
                        )}

                        <PremiumButton
                            className="w-full justify-center group py-4 mt-4"
                            onClick={() => handleCheckout()}
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]"></div>
                            <span className="relative z-10 flex items-center gap-2">
                                {isProcessing ? t('order_processing') : t('order_cta')} <ChevronRight className="w-4 h-4" />
                            </span>
                        </PremiumButton>

                        {/* Pending Order Alert */}
                        {pendingOrder && (
                            <div id="pending-order-alert" className="mt-4 rounded-2xl border border-amber-400/40 bg-amber-500/[0.07] p-4 flex flex-col gap-4">
                                <div className="flex items-start gap-3">
                                    <div className="relative shrink-0">
                                        <div className="w-9 h-9 rounded-full bg-amber-400/10 flex items-center justify-center mt-0.5">
                                            <Clock className="w-4.5 h-4.5 text-amber-400" />
                                        </div>
                                        <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-sm font-semibold text-t-text">{t('order_pending_banner_title')}</h3>
                                        <p className="text-xs text-amber-200/60 mt-0.5 leading-relaxed">
                                            {t('order_pending_banner_desc', {
                                                number: pendingOrder.order_number || pendingOrder.reference_id.slice(-8).toUpperCase(),
                                                fiat: pendingOrder.fiat_amount,
                                                crypto: pendingOrder.crypto_currency,
                                            })}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex flex-col sm:flex-row gap-2">
                                    <Link
                                        href={`/${locale}/checkout/${pendingOrder.reference_id}`}
                                        className="flex-1 flex items-center justify-center gap-2 bg-t-btn text-t-btn-text font-semibold py-3 rounded-xl hover:bg-t-accent-hover transition-colors text-sm"
                                    >
                                        {t('order_pending_resume_cta')}
                                    </Link>
                                    <button
                                        onClick={() => { setPendingOrder(null); handleCheckout(true); }}
                                        className="flex-1 flex items-center justify-center gap-2 bg-t-bg-subtle border border-t-border text-t-text-2 hover:text-t-text hover:border-t-border py-3 rounded-xl transition-colors text-sm"
                                    >
                                        {t('order_pending_new_cta')}
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* TRUST SIGNALS UNDER PAY BUTTON */}
                        <div className="flex flex-col items-center justify-center gap-2 mt-4 text-center">
                            <div className="flex items-center gap-2 text-t-success">
                                <Shield className="w-4 h-4" />
                                <span className="text-[11px] font-medium tracking-wide">{t('order_trust_headline')}</span>
                            </div>
                            <span className="text-[10px] text-t-text-4 max-w-xs leading-relaxed">{t('order_trust_subtext')}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* MOBILE STICKY CHECKOUT BAR */}
            <div className="fixed bottom-0 left-0 w-full bg-t-bg/97 backdrop-blur-xl border-t border-t-accent/20 z-50 lg:hidden shadow-[0_-10px_40px_rgba(0,0,0,0.6)]">
                {/* Crypto selector row */}
                <div className="flex items-center gap-2 px-4 pt-2.5 pb-1">
                    <span className="text-[10px] text-t-text-4 uppercase tracking-wider shrink-0">{t('order_payment_method')}:</span>
                    <select
                        value={selectedCrypto}
                        onChange={(e) => { setSelectedCrypto(e.target.value); posthog?.capture('crypto_selected', { crypto: e.target.value }); (window as any).clarity?.("set", "crypto_selected", e.target.value); }}
                        className="flex-1 h-7 bg-t-bg border border-t-accent/30 text-t-text text-[11px] rounded-md px-2 appearance-none focus:outline-none focus:border-t-accent cursor-pointer font-medium"
                    >
                        <option value="USDT">USDT ✓</option>
                        <option value="BTC">Bitcoin</option>
                        <option value="ETH">Ethereum</option>
                        <option value="USDC">USDC</option>
                        <option value="SOL">Solana</option>
                        <option value="XMR">Monero</option>
                    </select>
                </div>
                {/* Price + CTA row */}
                <div className="flex items-center justify-between gap-3 px-4 pb-4 pt-1.5">
                    <div className="flex flex-col min-w-0">
                        <span className="text-[10px] text-t-text-3 uppercase tracking-widest">{t('order_total')}</span>
                        <span className="text-xl font-medium text-t-accent leading-tight">{totalPrice}€</span>
                        {discount > 0 && (
                            <span className="text-[10px] text-t-success leading-none">{t('order_bulk_discount')} -{discount}%</span>
                        )}
                    </div>
                    <PremiumButton
                        className="px-6 py-2.5 shrink-0"
                        onClick={() => {
                            handleCheckout();
                            setTimeout(() => {
                                const err = document.getElementById('form-error');
                                if (err) err.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            }, 100);
                        }}
                    >
                        {isProcessing ? t('order_processing') : t('order_cta')}
                    </PremiumButton>
                </div>
            </div>

            {/* SEO: Structured Data */}
            <OrderStructuredData />
        </main>
    );
}
