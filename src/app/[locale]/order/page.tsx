"use client";

import { useState, useRef, useEffect } from "react";
import { ArrowLeft, Lock, Shield, ChevronRight, Minus, Plus, MapPin, User, Mail, Phone, Ban, Eye, CreditCard, ExternalLink } from "lucide-react";
import { PremiumButton } from "@/components/ui/PremiumButton";
import { useTranslations, useLocale } from "next-intl";
import { LanguageSwitcher } from "@/components/ui/LanguageSwitcher";
import { OrderStructuredData } from "@/components/seo/OrderStructuredData";

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
    const [quantity, setQuantity] = useState(1);
    const [selectedCrypto, setSelectedCrypto] = useState("USDT");
    const [isProcessing, setIsProcessing] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);

    // Shipping form state
    const [email, setEmail] = useState("");
    const [fullName, setFullName] = useState("");
    const [addressLine1, setAddressLine1] = useState("");
    const [addressLine2, setAddressLine2] = useState("");
    const [city, setCity] = useState("");
    const [postalCode, setPostalCode] = useState("");
    const [country, setCountry] = useState("");
    const [phone, setPhone] = useState("");
    const [phoneCountryCode, setPhoneCountryCode] = useState("+39");
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

            // Dark theme for autocomplete dropdown
            const style = document.createElement('style');
            style.textContent = `.pac-container{background:#0a0a14;border:1px solid rgba(255,255,255,0.1);border-radius:12px;margin-top:4px;box-shadow:0 8px 32px rgba(0,0,0,0.5);z-index:9999}.pac-item{color:rgba(255,255,255,0.7);border-top:1px solid rgba(255,255,255,0.05);padding:8px 12px;cursor:pointer;font-size:14px}.pac-item:hover{background:rgba(255,255,255,0.1)}.pac-item-query{color:#d4af37}.pac-icon{display:none}`;
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

    const discount = getDiscount(quantity);
    const unitPrice = Math.round(BASE_PRICE * (1 - discount / 100));
    const totalPrice = unitPrice * quantity;
    const savedAmount = (BASE_PRICE * quantity) - totalPrice;

    const validateForm = (): boolean => {
        if (!email || !email.includes('@')) {
            setFormError(t('order_error_email'));
            return false;
        }
        if (!fullName || fullName.length < 2) {
            setFormError(t('order_error_name'));
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

    const handleCheckout = async () => {
        if (!validateForm()) return;

        setIsProcessing(true);
        setFormError(null);

        try {
            const res = await fetch('/api/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email,
                    shipping_address: {
                        full_name: fullName,
                        address_line_1: addressLine1,
                        address_line_2: addressLine2,
                        city,
                        postal_code: postalCode,
                        country,
                        phone: `${phoneCountryCode} ${phone}`,
                    },
                    quantity,
                    crypto_currency: selectedCrypto
                })
            });
            const data = await res.json();

            if (data.reference_id) {
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
        <main className="min-h-screen bg-brand-void text-white font-sans flex flex-col overflow-x-hidden">
            {/* HEADER */}
            <header className="w-full py-6 px-6 md:px-12 flex justify-between items-center border-b border-white/5 bg-brand-void/50 backdrop-blur-md sticky top-0 z-50">
                <button onClick={() => window.location.href = `/${locale}`} className="flex items-center gap-2 text-white/50 hover:text-white transition-colors">
                    <ArrowLeft className="w-4 h-4" /> {t('order_back')}
                </button>
                <div className="flex items-center gap-4">
                    <LanguageSwitcher />
                    <div className="flex items-center gap-2">
                        <Lock className="w-4 h-4 text-green-400" />
                        <span className="text-xs text-green-400 font-medium tracking-wider uppercase">{t('order_secure')}</span>
                    </div>
                </div>
            </header>

            <div className="flex-1 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 p-6 md:p-12 relative">
                <div className="absolute top-1/2 left-1/3 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brand-gold/5 blur-[120px] rounded-full pointer-events-none"></div>

                {/* LEFT COLUMN */}
                <div className="lg:col-span-7 flex flex-col gap-8 relative z-10">
                    <div>
                        <h1 className="text-3xl md:text-5xl font-light mb-2">{t('order_select_title')} <span className="font-medium text-brand-gold">{t('order_select_highlight')}</span></h1>
                        <p className="text-white/50 text-sm">{t('order_select_desc')}</p>
                    </div>

                    {/* QUANTITY SELECTOR */}
                    <div className="glass-panel p-8 border-brand-gold/20">
                        <div className="flex flex-col sm:flex-row justify-between items-center gap-6">
                            <div className="flex flex-col gap-1">
                                <span className="text-sm text-white/50 uppercase tracking-widest">{t('order_quantity')}</span>
                                <span className="text-white/40 text-xs">Retatrutide 10mg</span>
                                <span className="text-green-400/70 text-xs">+ {t('order_free_bac_water')}</span>
                            </div>
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                    className="w-12 h-12 rounded-xl border border-white/20 flex items-center justify-center hover:border-brand-gold hover:bg-brand-gold/10 transition-all active:scale-95"
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
                                    className="w-20 h-12 text-center text-2xl font-light bg-transparent border border-white/20 rounded-xl focus:border-brand-gold focus:outline-none text-white"
                                />
                                <button
                                    onClick={() => setQuantity(Math.min(100, quantity + 1))}
                                    className="w-12 h-12 rounded-xl border border-white/20 flex items-center justify-center hover:border-brand-gold hover:bg-brand-gold/10 transition-all active:scale-95"
                                >
                                    <Plus className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        {/* LIVE PRICING BREAKDOWN */}
                        <div className="mt-6 pt-6 border-t border-white/10 grid grid-cols-3 gap-4 text-center">
                            <div className="flex flex-col">
                                <span className="text-xs text-white/40 uppercase tracking-wider">{t('order_unit_price')}</span>
                                <span className="text-2xl font-light text-white mt-1">{unitPrice}€</span>
                                {discount > 0 && (
                                    <span className="text-xs text-white/30 line-through">{BASE_PRICE}€</span>
                                )}
                            </div>
                            <div className="flex flex-col">
                                <span className="text-xs text-white/40 uppercase tracking-wider">{t('order_discount_label')}</span>
                                <span className={`text-2xl font-light mt-1 ${discount > 0 ? 'text-green-400' : 'text-white/30'}`}>
                                    {discount > 0 ? `-${discount}%` : '—'}
                                </span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-xs text-white/40 uppercase tracking-wider">{t('order_total')}</span>
                                <span className="text-2xl font-light text-brand-gold mt-1">{totalPrice}€</span>
                                {savedAmount > 0 && (
                                    <span className="text-xs text-green-400">{t('order_save')} {savedAmount}€</span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* DISCOUNT TIERS TABLE */}
                    <div className="glass-panel border-white/10 overflow-hidden">
                        <div className="px-6 py-4 border-b border-white/10 bg-white/5">
                            <h3 className="text-sm font-medium uppercase tracking-widest text-brand-gold">{t('order_volume_discounts')}</h3>
                        </div>
                        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {DISCOUNT_TIERS.map((tier, i) => {
                                const nextTier = DISCOUNT_TIERS[i + 1];
                                const isActive = discount === tier.discount;
                                const isNextTarget = nextTier && quantity < nextTier.min && quantity >= tier.min;
                                const tierPrice = Math.round(BASE_PRICE * (1 - tier.discount / 100));

                                return (
                                    <div
                                        key={tier.min}
                                        onClick={() => setQuantity(tier.min)}
                                        className={`relative flex flex-col p-4 rounded-xl border transition-all cursor-pointer overflow-hidden ${isActive
                                            ? 'bg-brand-gold/10 border-brand-gold shadow-[0_0_15px_rgba(212,175,55,0.15)]'
                                            : 'bg-white/5 border-white/10 hover:border-white/30 hover:bg-white/10'
                                            }`}
                                    >
                                        {isActive && <div className="absolute top-0 left-0 w-full h-1 bg-brand-gold"></div>}
                                        <div className="flex items-center justify-between mb-2">
                                            <span className={`text-sm font-medium ${isActive ? 'text-white' : 'text-white/70'}`}>
                                                {tier.min === 1 ? `1–2 ${t('order_pieces')}` :
                                                    nextTier ? `${tier.min}–${nextTier.min - 1} ${t('order_pieces')}` :
                                                        `${tier.min}+ ${t('order_pieces')}`}
                                            </span>
                                            {tier.discount > 0 ? (
                                                <span className={`text-sm font-bold ${isActive ? 'text-green-400' : 'text-green-400/70'}`}>-{tier.discount}%</span>
                                            ) : (
                                                <span className="text-sm text-white/30">—</span>
                                            )}
                                        </div>
                                        <div className="flex items-end justify-between">
                                            <span className={`text-[1.3rem] leading-none font-light ${isActive ? 'text-brand-gold' : 'text-white/60'}`}>{tierPrice}€<span className="text-xs text-white/40">/{t('order_piece_short')}</span></span>
                                        </div>
                                        {isNextTarget && nextTier && (
                                            <div className="mt-3 text-[10px] text-brand-gold bg-brand-gold/10 px-2 py-1.5 rounded text-center">
                                                +{nextTier.min - quantity} → -{nextTier.discount}%
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* SHIPPING FORM */}
                    <div className="glass-panel border-white/10 overflow-hidden">
                        <div className="px-6 py-4 border-b border-white/10 bg-white/5 flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-brand-gold" />
                            <h3 className="text-sm font-medium uppercase tracking-widest text-brand-gold">{t('order_shipping_details')}</h3>
                        </div>
                        <div className="p-6 flex flex-col gap-4">
                            {/* Contact Box (Group 1) */}
                            <div className="flex flex-col gap-3 p-4 bg-white/[0.02] rounded-xl border border-white/5">
                                <span className="text-[10px] uppercase tracking-widest text-brand-gold font-medium mb-1">Contact</span>
                                {/* Email */}
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                                    <input
                                        type="email"
                                        autoComplete="email"
                                        placeholder={t('order_field_email')}
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full h-12 bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 text-sm text-white placeholder:text-white/30 focus:border-brand-gold focus:outline-none transition-colors"
                                    />
                                </div>

                                {/* Full Name */}
                                <div className="relative">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                                    <input
                                        type="text"
                                        autoComplete="name"
                                        placeholder={t('order_field_name')}
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                        className="w-full h-12 bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 text-sm text-white placeholder:text-white/30 focus:border-brand-gold focus:outline-none transition-colors"
                                    />
                                </div>

                                {/* Phone with country code */}
                                <div className="flex gap-2">
                                    <div className="relative w-[88px] shrink-0">
                                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                                        <select
                                            autoComplete="tel-country-code"
                                            value={phoneCountryCode}
                                            onChange={(e) => setPhoneCountryCode(e.target.value)}
                                            className="w-full h-12 bg-white/5 border border-white/10 rounded-xl pl-9 pr-1 text-sm text-white appearance-none focus:border-brand-gold focus:outline-none transition-colors cursor-pointer"
                                        >
                                            {Object.entries(COUNTRY_PHONE_PREFIXES).map(([name, prefix]) => (
                                                <option key={name} value={prefix} className="bg-brand-void">{prefix}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <input
                                        type="tel"
                                        autoComplete="tel-national"
                                        placeholder={t('order_field_phone')}
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        className="flex-1 h-12 bg-white/5 border border-white/10 rounded-xl px-4 text-sm text-white placeholder:text-white/30 focus:border-brand-gold focus:outline-none transition-colors"
                                    />
                                </div>
                            </div>

                            {/* Shipping Box (Group 2) */}
                            <div className="flex flex-col gap-3 p-4 bg-white/[0.02] rounded-xl border border-white/5">
                                <span className="text-[10px] uppercase tracking-widest text-brand-gold font-medium mb-1">Destination</span>
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
                                        className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 text-sm text-white appearance-none focus:border-brand-gold focus:outline-none transition-colors cursor-pointer"
                                    >
                                        <option value="" className="bg-brand-void">{t('order_field_country')}</option>
                                        {EU_COUNTRIES.map(c => (
                                            <option key={c} value={c} className="bg-brand-void">{c}</option>
                                        ))}
                                    </select>
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-white/30 text-xs">▼</div>
                                </div>

                                {/* Address Line 1 */}
                                <input
                                    ref={addressInputRef}
                                    type="text"
                                    autoComplete="shipping street-address"
                                    placeholder={t('order_field_address1')}
                                    value={addressLine1}
                                    onChange={(e) => setAddressLine1(e.target.value)}
                                    className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 text-sm text-white placeholder:text-white/30 focus:border-brand-gold focus:outline-none transition-colors"
                                />

                                {/* Address Line 2 */}
                                <input
                                    type="text"
                                    autoComplete="shipping address-line2"
                                    placeholder={t('order_field_address2')}
                                    value={addressLine2}
                                    onChange={(e) => setAddressLine2(e.target.value)}
                                    className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 text-sm text-white placeholder:text-white/30 focus:border-brand-gold focus:outline-none transition-colors"
                                />

                                {/* City + Postal Code */}
                                <div className="grid grid-cols-2 gap-3">
                                    <input
                                        type="text"
                                        autoComplete="shipping address-level2"
                                        placeholder={t('order_field_city')}
                                        value={city}
                                        onChange={(e) => setCity(e.target.value)}
                                        className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 text-sm text-white placeholder:text-white/30 focus:border-brand-gold focus:outline-none transition-colors"
                                    />
                                    <input
                                        type="text"
                                        autoComplete="shipping postal-code"
                                        placeholder={t('order_field_postal')}
                                        value={postalCode}
                                        onChange={(e) => setPostalCode(e.target.value)}
                                        className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 text-sm text-white placeholder:text-white/30 focus:border-brand-gold focus:outline-none transition-colors"
                                    />
                                </div>
                            </div>
                            <p className="text-xs text-white/40 px-1">{t('order_privacy_note')}</p>
                        </div>
                    </div>

                    {/* GUARANTEE */}
                    <div className="flex items-start gap-4 p-6 glass-panel border-white/10">
                        <Shield className="w-8 h-8 text-brand-gold shrink-0" />
                        <div className="flex flex-col gap-1 text-sm text-white/70">
                            <span className="font-semibold text-white">{t('order_guarantee_title')}</span>
                            <p>{t('order_guarantee_desc')}</p>
                        </div>
                    </div>
                </div>

                {/* RIGHT COLUMN: Order Summary & Payment */}
                <div className="lg:col-span-5 relative z-10">
                    <div className="glass-panel border-brand-gold/20 p-8 flex flex-col gap-6 sticky top-24">
                        <h2 className="text-xl font-medium border-b border-white/10 pb-4">{t('order_summary')}</h2>

                        <div className="flex flex-col gap-3 text-sm">
                            <div className="flex justify-between text-white/70">
                                <span>{t('order_product')}</span>
                                <span>Retatrutide 10mg × {quantity}</span>
                            </div>
                            <div className="flex justify-between text-green-400/80 text-xs">
                                <span>{t('order_free_bac_water')}</span>
                                <span>× {quantity}</span>
                            </div>
                            <div className="flex justify-between text-white/70">
                                <span>{t('order_unit_price')}</span>
                                <span>{unitPrice}€ {discount > 0 && <span className="text-white/30 line-through ml-1">{BASE_PRICE}€</span>}</span>
                            </div>
                            <div className="flex justify-between text-white/70">
                                <span>{t('order_shipping')}</span>
                                <span className="text-green-400">{t('order_free_stealth')}</span>
                            </div>

                            {discount > 0 && (
                                <div className="flex justify-between text-green-400">
                                    <span>{t('order_bulk_discount')} ({discount}%)</span>
                                    <span>- {savedAmount}€</span>
                                </div>
                            )}
                        </div>

                        <div className="flex justify-between items-end border-t border-white/10 pt-4">
                            <span className="text-lg">{t('order_total')}</span>
                            <div className="flex flex-col items-end">
                                <span className="text-3xl font-light text-brand-gold">{totalPrice}€</span>
                            </div>
                        </div>

                        {/* WHY CRYPTO */}
                        <div className="mt-6 bg-white/5 rounded-xl p-4 border border-white/10">
                            <h3 className="flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-brand-gold mb-3">
                                <Shield className="w-3.5 h-3.5" />
                                {t('order_why_crypto')}
                            </h3>
                            <div className="flex flex-col gap-2 mb-4">
                                <div className="flex items-start gap-2">
                                    <Ban className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />
                                    <p className="text-[11px] text-white/50">{t('order_why_crypto_1')}</p>
                                </div>
                                <div className="flex items-start gap-2">
                                    <Eye className="w-3.5 h-3.5 text-brand-gold shrink-0 mt-0.5" />
                                    <p className="text-[11px] text-white/50">{t('order_why_crypto_2')}</p>
                                </div>
                                <div className="flex items-start gap-2">
                                    <Lock className="w-3.5 h-3.5 text-green-400 shrink-0 mt-0.5" />
                                    <p className="text-[11px] text-white/50">{t('order_why_crypto_3')}</p>
                                </div>
                            </div>
                            <div className="bg-brand-gold/5 border border-brand-gold/15 rounded-lg p-3">
                                <p className="text-[11px] text-white/60 mb-1 font-medium">{t('order_no_crypto_title')}</p>
                                <p className="text-[10px] text-white/40 mb-2">{t('order_no_crypto_desc')}</p>
                                <a
                                    href={`/${locale}/crypto-guide`}
                                    className="inline-flex items-center gap-1 text-[11px] text-brand-gold hover:text-brand-gold/80 font-medium transition-colors"
                                >
                                    {t('order_no_crypto_cta')} <ExternalLink className="w-3 h-3" />
                                </a>
                            </div>
                        </div>

                        {/* PAYMENT SELECTION */}
                        <div className="flex flex-col gap-4 mt-6">
                            <h3 className="text-sm font-medium text-white/70 uppercase tracking-widest">{t('order_payment_method')}</h3>

                            <div className="flex items-center gap-3 py-3 px-4 rounded-xl border bg-brand-gold/10 border-brand-gold text-brand-gold">
                                <Lock className="w-5 h-5" />
                                <span className="text-xs font-medium">{t('order_crypto_native')}</span>
                            </div>
                        </div>

                        {/* CRYPTO SELECTOR */}
                        <div className="bg-black/40 rounded-xl p-4 mt-2">
                            <div className="flex flex-col gap-3 animate-fade-in">
                                <p className="text-xs text-white/60">{t('order_crypto_desc')}</p>
                                <div className="relative h-10">
                                    <select
                                        value={selectedCrypto}
                                        onChange={(e) => setSelectedCrypto(e.target.value)}
                                        className="w-full h-full bg-brand-void/80 border border-brand-gold/30 text-white text-sm rounded-lg px-4 appearance-none focus:outline-none focus:border-brand-gold tracking-wider cursor-pointer font-medium"
                                    >
                                        <option value="BTC">Bitcoin (BTC)</option>
                                        <option value="ETH">Ethereum (ETH)</option>
                                        <option value="XMR">Monero (XMR)</option>
                                        <option value="SOL">Solana (SOL)</option>
                                        <option value="USDT">Tether USDT (TRC20)</option>
                                        <option value="USDC">USD Coin (ERC20)</option>
                                    </select>
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-brand-gold/50 text-xs">▼</div>
                                </div>
                            </div>
                        </div>

                        {/* ERROR */}
                        {formError && (
                            <div id="form-error" className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 animate-fade-in">
                                {formError}
                            </div>
                        )}

                        <PremiumButton
                            className="w-full justify-center group py-4 mt-4"
                            onClick={handleCheckout}
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]"></div>
                            <span className="relative z-10 flex items-center gap-2">
                                {isProcessing ? t('order_processing') : t('order_cta')} <ChevronRight className="w-4 h-4" />
                            </span>
                        </PremiumButton>

                        {/* TRUST SIGNALS UNDER PAY BUTTON (UX Improvement) */}
                        <div className="flex flex-col items-center justify-center gap-2 mt-4 text-center">
                            <div className="flex items-center gap-2 text-green-400">
                                <Shield className="w-4 h-4" />
                                <span className="text-[11px] font-medium tracking-wide">100% Secure & Anonymous Crypto Checkout</span>
                            </div>
                            <span className="text-[10px] text-white/40 max-w-xs leading-relaxed">Your transaction is fully encrypted. The next screen will guide you step-by-step through the payment.</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* MOBILE STICKY CHECKOUT BAR */}
            <div className="fixed bottom-0 left-0 w-full bg-brand-void/97 backdrop-blur-xl border-t border-brand-gold/20 z-50 lg:hidden shadow-[0_-10px_40px_rgba(0,0,0,0.6)]">
                {/* Crypto selector row */}
                <div className="flex items-center gap-2 px-4 pt-2.5 pb-1">
                    <span className="text-[10px] text-white/40 uppercase tracking-wider shrink-0">{t('order_payment_method')}:</span>
                    <select
                        value={selectedCrypto}
                        onChange={(e) => setSelectedCrypto(e.target.value)}
                        className="flex-1 h-7 bg-brand-void border border-brand-gold/30 text-white text-[11px] rounded-md px-2 appearance-none focus:outline-none focus:border-brand-gold cursor-pointer font-medium"
                    >
                        <option value="BTC">Bitcoin (BTC)</option>
                        <option value="ETH">Ethereum (ETH)</option>
                        <option value="XMR">Monero (XMR)</option>
                        <option value="SOL">Solana (SOL)</option>
                        <option value="USDT">USDT (TRC20)</option>
                        <option value="USDC">USDC (ERC20)</option>
                    </select>
                </div>
                {/* Price + CTA row */}
                <div className="flex items-center justify-between gap-3 px-4 pb-4 pt-1.5">
                    <div className="flex flex-col min-w-0">
                        <span className="text-[10px] text-white/50 uppercase tracking-widest">{t('order_total')}</span>
                        <span className="text-xl font-medium text-brand-gold leading-tight">{totalPrice}€</span>
                        {discount > 0 && (
                            <span className="text-[10px] text-green-400 leading-none">{t('order_bulk_discount')} -{discount}%</span>
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
