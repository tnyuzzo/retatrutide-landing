"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowUpRight,
  ArrowRight,
  CheckCircle2,
  Users,
  ShieldCheck,
  Shield,
  Truck,
  FlaskConical,
  BarChart3,
  Atom,
  PenTool,
  FileText,
  ChevronDown,
  AlertTriangle,
  Package,
  BookOpen,
  Send,
  Check,
} from "lucide-react";
import { useTranslations, useLocale } from "next-intl";
import { usePostHog } from "posthog-js/react";
import { useStock } from "@/components/ui/useStock";

/* ─── palette (light-only, no dependency on dark tokens) ─── */
const C = {
  bg:       "#FFFFFF",
  bgAlt:    "#F5F3EF",
  navy:     "#1A2744",
  navyHov:  "#243456",
  text:     "#1A2744",
  text2:    "#475569",
  text3:    "#8C919A",
  text4:    "#A8ABB3",
  border:   "#E0DDD6",
  borderLt: "#ECEAE4",
  accent:   "#C09B2D",
  success:  "#1B6B40",
  successDim: "rgba(27,107,64,0.08)",
};

export function LightPage() {
  const t = useTranslations("Index");
  const locale = useLocale();
  const posthog = usePostHog();
  const stock = useStock();
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [showCoaModal, setShowCoaModal] = useState(false);
  const [showStickyBar, setShowStickyBar] = useState(false);
  const [tickerIndex, setTickerIndex] = useState(0);
  const [blogEmail, setBlogEmail] = useState("");
  const [blogEmailStatus, setBlogEmailStatus] = useState<"idle" | "sending" | "sent">("idle");
  const blogEmailRef = useRef<HTMLInputElement>(null);

  const goto = (path: string) => { window.location.href = `/${locale}${path}`; };
  const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  const clarity = (k: string, v: string) => (window as any).clarity?.("set", k, v);

  // Blog locale mapping (glp1journal.eu supports: it, en, de, fr, es)
  const blogLocale = ["it", "en", "de", "fr", "es"].includes(locale) ? locale : "en";
  const blogUrl = `https://glp1journal.eu/${blogLocale}?utm_source=aurapep&utm_medium=landing&utm_campaign=blog_cta&utm_content=${locale}`;

  const handleBlogEmail = async () => {
    if (!blogEmail || !blogEmail.includes("@") || blogEmailStatus !== "idle") return;
    setBlogEmailStatus("sending");
    try {
      await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: blogEmail, locale }),
      });
      posthog?.capture("blog_email_captured", { locale });
      clarity("blog_email", "captured");
    } catch { /* silent */ }
    setBlogEmailStatus("sent");
  };

  // Sticky bar on scroll
  useEffect(() => {
    const handleScroll = () => setShowStickyBar(window.scrollY > 400);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Trust ticker rotation
  useEffect(() => {
    const interval = setInterval(() => setTickerIndex(prev => (prev + 1) % 4), 2500);
    return () => clearInterval(interval);
  }, []);

  /* ────────────────────────────── HERO ────────────────────────────── */
  const hero = (
    <section style={{ background: C.bg }}>
      <div className="max-w-[1140px] mx-auto px-6 pt-32 pb-14">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 items-center">
          {/* Copy */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="flex flex-col gap-5">
            {/* Badge pill */}
            <span
              className="inline-flex items-center self-start text-[11px] uppercase tracking-[0.14em] font-medium rounded-full px-4 py-1.5"
              style={{ color: C.text2, background: C.bg, border: `1px solid ${C.border}` }}
            >
              {t("hero_badge")}
            </span>

            {/* Heading */}
            <h1 className="text-[2.75rem] md:text-[3.5rem] lg:text-[4rem] leading-[1.05] tracking-tight font-bold" style={{ color: C.navy }}>
              {t("hero_title")}<br />Retatrutide
            </h1>

            {/* Subtitle */}
            <p className="text-[15px] md:text-base leading-[1.7] font-light max-w-[480px]" style={{ color: C.text2 }}>
              {t("hero_subtitle")}
            </p>

            {/* Live inventory badge */}
            <div className="flex items-center gap-2 rounded-lg px-3 py-2 w-fit" style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)" }}>
              <AlertTriangle className="w-3.5 h-3.5 text-red-500 animate-pulse shrink-0" />
              <span className="text-xs font-medium text-red-600 leading-tight">
                {t("inventory_high_demand")} <strong className="tabular-nums" style={{ color: C.text }}>{stock}</strong> {t("inventory_kits_remaining")}
              </span>
            </div>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => { posthog?.capture("cta_clicked", { location: "hero_light", locale }); clarity("cta_clicked", "hero_light"); goto("/order"); }}
                className="inline-flex items-center justify-center gap-2 px-7 py-3 rounded-lg font-medium text-[15px] transition-colors"
                style={{ background: C.navy, color: "#fff" }}
                onMouseEnter={e => (e.currentTarget.style.background = C.navyHov)}
                onMouseLeave={e => (e.currentTarget.style.background = C.navy)}
              >
                {t("hero_cta_hook")} <ArrowUpRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => setShowCoaModal(true)}
                className="inline-flex items-center justify-center gap-2 px-7 py-3 rounded-lg font-medium text-[15px] transition-colors"
                style={{ color: C.text, border: `1px solid ${C.border}`, background: "transparent" }}
              >
                {t("light_view_research")}
              </button>
            </div>

            {/* Trust checkmarks — single row like mockup */}
            <div className="flex items-start gap-5 mt-1">
              {[
                { main: `${t("feature_eu")} ${t("feature_eu_sub")}`, sub: undefined },
                { main: t("feature_crypto"), sub: `(${t("feature_crypto_sub")})` },
                { main: `${t("feature_guarantee")}`, sub: `(${t("feature_guarantee_sub")})` },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-1.5">
                  <svg className="w-5 h-5 mt-0.5 shrink-0" viewBox="0 0 20 20" fill="none">
                    <circle cx="10" cy="10" r="9" stroke={C.navy} strokeWidth="1.5" fill={C.navy} />
                    <path d="M6 10.5l2.5 2.5L14 8" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <div className="flex flex-col">
                    <span className="text-[13px] font-semibold leading-tight" style={{ color: C.text }}>{item.main}</span>
                    {item.sub && <span className="text-[11px] leading-tight mt-0.5" style={{ color: C.text3 }}>{item.sub}</span>}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Vial */}
          <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.7, delay: 0.1 }} className="flex items-center justify-center lg:justify-end">
            <Image src="/images/vial_v7_white.webp" alt="Retatrutide 10mg research peptide vial" width={420} height={520} className="w-auto h-[300px] md:h-[380px] lg:h-[440px] object-contain" priority />
          </motion.div>
        </div>
      </div>

      {/* Stats strip */}
      <div style={{ background: C.bgAlt, borderTop: `1px solid ${C.borderLt}`, borderBottom: `1px solid ${C.borderLt}` }}>
        <div className="max-w-[1140px] mx-auto px-6 py-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
            {([
              { icon: <Users className="w-7 h-7" />, value: "2500+", label: t("light_stat_reviews") },
              { icon: <ShieldCheck className="w-7 h-7" />, value: "99.8%", label: t("light_stat_purity") },
              { icon: <Truck className="w-7 h-7" />, value: "3-5 Day", label: t("light_stat_delivery") },
              { icon: <ArrowRight className="w-7 h-7" />, value: "3 Steps", label: t("light_stat_support") },
            ] as const).map((s, i) => (
              <div key={i} className="flex items-center gap-3.5 justify-center">
                <div style={{ color: C.text2 }}>{s.icon}</div>
                <div>
                  <div className="text-[22px] font-bold leading-none" style={{ color: C.text }}>{s.value}</div>
                  <div className="text-[12.5px] font-medium mt-0.5" style={{ color: C.text2 }}>{s.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );

  /* ──────────────────────── FEATURES (3 CARDS) ──────────────────────── */
  const features = (
    <section id="science" className="py-14 px-6" style={{ background: C.bg }}>
      <div className="max-w-[1140px] mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-[1.65rem] md:text-[1.85rem] tracking-tight mb-3" style={{ color: C.text }}>
            <span className="font-light">{t("section_science_title_1")}</span>{" "}
            <span className="font-medium" style={{ color: C.accent }}>{t("section_science_title_2")}</span>
          </h2>
          <p className="text-[14px] max-w-lg mx-auto" style={{ color: C.text3 }}>{t("section_science_desc")}</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { icon: <Shield className="w-6 h-6" />, title: t("card1_title"), desc: t("card1_desc"), highlight: false },
            { icon: <ShieldCheck className="w-6 h-6" />, title: t("card2_title"), desc: t("card2_desc"), highlight: true },
            { icon: <Truck className="w-6 h-6" />, title: t("card3_title"), desc: t("card3_desc"), highlight: false },
          ].map((card, i) => (
            <motion.div
              key={i}
              whileInView={{ opacity: 1, y: 0 }} initial={{ opacity: 0, y: 20 }} viewport={{ once: true, amount: 0.05 }} transition={{ duration: 0.5, delay: i * 0.1 }}
              className="rounded-xl p-6 relative overflow-hidden"
              style={{
                background: C.bgAlt,
                border: `1px solid ${card.highlight ? C.accent : C.borderLt}`,
              }}
            >
              {card.highlight && <div className="absolute top-0 left-0 w-full h-0.5" style={{ background: C.accent }} />}
              <div
                className="w-11 h-11 rounded-lg flex items-center justify-center mb-4"
                style={{ background: card.highlight ? "rgba(192,155,45,0.1)" : C.bg, color: card.highlight ? C.accent : C.text3 }}
              >
                {card.icon}
              </div>
              <h3 className="text-[15px] font-semibold mb-2" style={{ color: C.text }}>{card.title}</h3>
              <p className="text-[13px] leading-relaxed" style={{ color: C.text3 }}>{card.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );

  /* ──────────────────────── TRUST TICKER ──────────────────────────── */
  const tickerItems = [
    { icon: <ShieldCheck className="w-5 h-5" />, label: t("ticker_purity") },
    { icon: <FlaskConical className="w-5 h-5" />, label: t("ticker_lab") },
    { icon: <Package className="w-5 h-5" />, label: t("ticker_stealth") },
    { icon: <Truck className="w-5 h-5" />, label: t("ticker_guarantee") },
  ];

  const trustTicker = (
    <>
      {/* Mobile: rotating */}
      <section className="md:hidden py-5" style={{ background: C.bgAlt, borderTop: `1px solid ${C.borderLt}`, borderBottom: `1px solid ${C.borderLt}` }}>
        <div className="relative h-7 flex items-center justify-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={tickerIndex}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.35 }}
              className="absolute flex items-center gap-2.5"
            >
              <span style={{ color: C.accent }}>{tickerItems[tickerIndex].icon}</span>
              <span className="font-medium text-sm tracking-wide" style={{ color: C.text }}>{tickerItems[tickerIndex].label}</span>
            </motion.div>
          </AnimatePresence>
        </div>
        <div className="flex justify-center gap-1.5 mt-2.5">
          {tickerItems.map((_, i) => (
            <div key={i} className="w-1 h-1 rounded-full transition-colors duration-300" style={{ background: i === tickerIndex ? C.accent : C.text4 }} />
          ))}
        </div>
      </section>

      {/* Desktop: infinite scroll */}
      <section className="hidden md:block py-6 overflow-hidden" style={{ background: C.bgAlt, borderTop: `1px solid ${C.borderLt}`, borderBottom: `1px solid ${C.borderLt}` }}>
        <div className="relative flex w-full">
          <div className="absolute top-0 left-0 w-32 h-full z-10" style={{ background: `linear-gradient(to right, ${C.bgAlt}, transparent)` }} />
          <div className="absolute top-0 right-0 w-32 h-full z-10" style={{ background: `linear-gradient(to left, ${C.bgAlt}, transparent)` }} />
          <motion.div
            animate={{ x: ["0%", "-50%"] }}
            transition={{ duration: 25, ease: "linear", repeat: Infinity }}
            className="flex gap-16 min-w-max items-center pr-16"
          >
            {[0, 1].map(rep => (
              <div key={rep} className="flex gap-16 items-center">
                {tickerItems.map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span style={{ color: C.accent }}>{item.icon}</span>
                    <span className="font-medium text-sm tracking-wide" style={{ color: C.text }}>{item.label}</span>
                    {i < tickerItems.length - 1 && <div className="w-1.5 h-1.5 rounded-full ml-16" style={{ background: C.text4 }} />}
                  </div>
                ))}
                <div className="w-1.5 h-1.5 rounded-full" style={{ background: C.text4 }} />
              </div>
            ))}
          </motion.div>
        </div>
      </section>
    </>
  );

  /* ──────────────────────── QUALITY PIPELINE ──────────────────────── */
  const qaSteps = [
    { icon: <FlaskConical className="w-5 h-5" />, key: "qa_step1" },
    { icon: <BarChart3 className="w-5 h-5" />, key: "qa_step2" },
    { icon: <Atom className="w-5 h-5" />, key: "qa_step3" },
    { icon: <PenTool className="w-5 h-5" />, key: "qa_step4" },
    { icon: <FileText className="w-5 h-5" />, key: "qa_step5" },
  ];

  const qualityPipeline = (
    <section className="py-14 px-6" style={{ background: C.bg }}>
      <div className="max-w-[1140px] mx-auto">
        <h2 className="text-[1.65rem] md:text-[1.85rem] text-center mb-2 tracking-tight" style={{ color: C.text }}>
          <span className="font-light">{t("qa_title")}</span>{" "}
          <span className="font-medium">{t("qa_subtitle")}</span>
        </h2>
        <p className="text-[14.5px] text-center mb-10 max-w-[520px] mx-auto leading-relaxed font-medium" style={{ color: C.text2 }}>
          {t("qa_description")}
        </p>

        <div className="flex flex-col md:flex-row items-start md:items-start justify-center gap-8 md:gap-0">
          {qaSteps.map((step, i) => (
            <div key={i} className="flex items-start">
              <div className="flex flex-col items-center text-center gap-2.5 w-[160px]">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center"
                  style={{ border: `1px solid ${C.border}`, background: C.bgAlt, color: C.text3 }}
                >
                  {step.icon}
                </div>
                <div className="flex flex-col items-center">
                  <p className="text-[13px] font-semibold mt-1" style={{ color: C.text }}>{t(`${step.key}_title`)}</p>
                  <p className="text-[11px] mt-1 leading-relaxed max-w-[150px]" style={{ color: C.text3 }}>
                    {t(`${step.key}_desc`)}
                  </p>
                </div>
              </div>
              {i < qaSteps.length - 1 && (
                <div className="hidden md:flex items-center pt-4 px-1" style={{ color: C.text4 }}>
                  <ArrowRight className="w-5 h-5" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );

  /* ────────────────────── PRODUCT SPECIFICATIONS ──────────────────── */
  const specs = [
    { label: t("specs_format"), value: t("specs_format_val") },
    { label: t("specs_purity"), value: t("specs_purity_val") },
    { label: t("specs_storage"), value: t("specs_storage_val") },
    { label: t("specs_reconstituted"), value: t("specs_reconstituted_val") },
    { label: t("specs_solvent"), value: t("specs_solvent_val") },
    { label: t("specs_cas"), value: t("specs_cas_val") },
  ];

  const productSpecs = (
    <section id="product-specs" className="py-14 px-6" style={{ background: C.bgAlt }}>
      <div className="max-w-[1000px] mx-auto">
        <div className="rounded-2xl p-8 md:p-10" style={{ background: C.bg, border: `1px solid ${C.borderLt}`, boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
          <h2 className="text-[1.55rem] md:text-[1.75rem] font-semibold mb-6 tracking-tight" style={{ color: C.text }}>
            {t("specs_title")}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-14">
            {specs.map((row, i) => (
              <div key={i} className="flex justify-between items-baseline py-3.5" style={{ borderBottom: `1px solid ${C.borderLt}` }}>
                <span className="text-[13.5px] font-semibold" style={{ color: C.text }}>{row.label}</span>
                <span className="text-[13.5px] font-medium" style={{ color: C.text2 }}>{row.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );

  /* ──────────────────────── TESTIMONIALS ──────────────────────────── */
  const testimonials = (
    <section className="py-14" style={{ background: C.bg }}>
      <div className="max-w-[1140px] mx-auto px-6">
        <h2 className="text-[1.55rem] md:text-[1.75rem] text-center mb-8 tracking-tight" style={{ color: C.text }}>
          <span className="font-light">{t("trust_earned")}</span>{" "}
          <span className="font-medium italic">{t("trust_earned_gold")}</span>
        </h2>
      </div>

      {/* Horizontal scroll container */}
      <div className="overflow-x-auto scrollbar-hide">
        <div className="flex gap-5 px-6 md:px-[max(1.5rem,calc((100%-1140px)/2+1.5rem))] pb-4" style={{ minWidth: "min-content" }}>
          {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
            <div
              key={num}
              className="rounded-xl p-5 flex flex-col gap-3 shrink-0 w-[300px]"
              style={{ border: `1px solid ${C.borderLt}`, background: C.bgAlt, boxShadow: "0 1px 2px rgba(0,0,0,0.04)" }}
            >
              <div className="flex justify-between items-center">
                <span className="text-[13px] tracking-wide" style={{ color: C.accent }}>★★★★★</span>
                <span
                  className="inline-flex items-center gap-1 text-[10px] font-medium rounded-full px-2 py-0.5"
                  style={{ color: C.success, background: C.successDim }}
                >
                  <Shield className="w-2.5 h-2.5" /> {t("verified_buyer")}
                </span>
              </div>
              <p className="text-[13px] leading-[1.65] italic" style={{ color: C.text2 }}>
                {t(`review_${num}_desc`)}
              </p>
              <div className="pt-3 mt-auto" style={{ borderTop: `1px solid ${C.borderLt}` }}>
                <span className="text-[13px] font-medium" style={{ color: C.text }}>{t(`review_${num}_name`)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );

  /* ──────────────────────── CALCULATOR CTA ──────────────────────────── */
  const calculatorCta = (
    <section className="py-12 px-6" style={{ background: C.bg, borderTop: `1px solid ${C.borderLt}` }}>
      <div className="max-w-3xl mx-auto rounded-xl p-7 flex flex-col md:flex-row items-center justify-between gap-6" style={{ background: C.bgAlt, border: `1px solid ${C.borderLt}` }}>
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full flex items-center justify-center shrink-0" style={{ border: `1px solid ${C.accent}`, background: C.bg }}>
            <FlaskConical className="w-7 h-7" style={{ color: C.accent }} />
          </div>
          <div>
            <h3 className="text-lg font-semibold" style={{ color: C.text }}>{t("calculator_title")}</h3>
            <p className="text-[13px] mt-1" style={{ color: C.text3 }}>{t("calculator_desc")}</p>
          </div>
        </div>
        <button
          onClick={() => goto("/calculator")}
          className="shrink-0 px-6 py-2.5 rounded-lg font-medium text-[14px] transition-colors"
          style={{ border: `1px solid ${C.navy}`, color: C.navy, background: "transparent" }}
          onMouseEnter={e => { e.currentTarget.style.background = C.navy; e.currentTarget.style.color = "#fff"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = C.navy; }}
        >
          {t("calculator_cta")}
        </button>
      </div>
    </section>
  );

  /* ──────────────────────── BUYER PROTECTION ──────────────────────── */
  const buyerProtection = (
    <section className="py-12 px-6" style={{ background: C.bg }}>
      <div className="max-w-3xl mx-auto rounded-xl p-7 relative overflow-hidden" style={{ background: C.successDim, border: `1px solid rgba(27,107,64,0.15)` }}>
        <div className="absolute top-0 left-0 w-full h-0.5" style={{ background: C.success }} />
        <div className="flex items-start gap-5">
          <div className="w-12 h-12 rounded-full flex items-center justify-center shrink-0" style={{ background: "rgba(27,107,64,0.1)", border: "1px solid rgba(27,107,64,0.2)" }}>
            <ShieldCheck className="w-6 h-6" style={{ color: C.success }} />
          </div>
          <div className="flex flex-col gap-2.5">
            <h2 className="text-lg font-semibold" style={{ color: C.text }}>{t("buyer_protection_title")}</h2>
            <p className="text-[13px] leading-relaxed" style={{ color: C.text2 }}>{t("buyer_protection_desc")}</p>
            <div className="flex flex-col gap-1.5 mt-1">
              {["buyer_protection_item1", "buyer_protection_item2", "buyer_protection_item3"].map((key) => (
                <div key={key} className="flex items-center gap-2 text-[13px]" style={{ color: C.success }}>
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: C.success }} />
                  {t(key)}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );

  /* ──────────────────────── BLOG CTA ─────────────────────────────── */
  const blogCta = (
    <section className="py-14 px-6" style={{ background: C.bg, borderTop: `1px solid ${C.borderLt}` }}>
      <div className="max-w-3xl mx-auto">
        <motion.div
          whileInView={{ opacity: 1, y: 0 }} initial={{ opacity: 0, y: 20 }} viewport={{ once: true, amount: 0.2 }} transition={{ duration: 0.5 }}
          className="rounded-2xl p-8 md:p-10 relative overflow-hidden"
          style={{ background: C.bgAlt, border: `1px solid ${C.borderLt}` }}
        >
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0"
              style={{ background: `${C.accent}12`, border: `1px solid ${C.accent}25` }}>
              <BookOpen className="w-7 h-7" style={{ color: C.accent }} />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-semibold mb-1.5" style={{ color: C.text }}>{t("blog_cta_title")}</h3>
              <p className="text-[14px] leading-relaxed" style={{ color: C.text2 }}>{t("blog_cta_desc")}</p>
            </div>
            <a
              href={blogUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => { posthog?.capture("blog_cta_clicked", { locale }); clarity("blog_cta", "clicked"); }}
              className="shrink-0 inline-flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium text-[14px] transition-colors"
              style={{ background: C.navy, color: "#fff" }}
              onMouseEnter={e => (e.currentTarget.style.background = C.navyHov)}
              onMouseLeave={e => (e.currentTarget.style.background = C.navy)}
            >
              {t("blog_cta_button")} <ArrowUpRight className="w-4 h-4" />
            </a>
          </div>

          {/* Optional email capture */}
          <div className="mt-6 pt-6" style={{ borderTop: `1px solid ${C.borderLt}` }}>
            <p className="text-[13px] mb-3" style={{ color: C.text3 }}>{t("blog_cta_email_label")}</p>
            <div className="flex gap-2 max-w-md">
              {blogEmailStatus === "sent" ? (
                <div className="flex items-center gap-2 text-[13px] font-medium" style={{ color: C.success }}>
                  <Check className="w-4 h-4" /> {t("blog_cta_email_thanks")}
                </div>
              ) : (
                <>
                  <input
                    ref={blogEmailRef}
                    type="email"
                    value={blogEmail}
                    onChange={e => setBlogEmail(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handleBlogEmail()}
                    placeholder={t("blog_cta_email_placeholder")}
                    className="flex-1 px-4 py-2 rounded-lg text-[13px] outline-none transition-colors"
                    style={{ background: C.bg, border: `1px solid ${C.border}`, color: C.text }}
                  />
                  <button
                    onClick={handleBlogEmail}
                    disabled={blogEmailStatus === "sending"}
                    className="px-4 py-2 rounded-lg text-[13px] font-medium transition-colors flex items-center gap-1.5 shrink-0 disabled:opacity-50"
                    style={{ background: C.accent, color: "#fff" }}
                  >
                    <Send className="w-3.5 h-3.5" /> {t("blog_cta_email_send")}
                  </button>
                </>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );

  /* ─────────────────────────── FAQ ────────────────────────────────── */
  const faq = (
    <section className="py-14 px-6" id="faq" style={{ background: C.bgAlt }}>
      <div className="max-w-[1000px] mx-auto">
        <h2 className="text-[1.55rem] md:text-[1.75rem] font-semibold text-center mb-10 tracking-tight" style={{ color: C.text }}>
          {t("faq_title")}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => {
            const isOpen = openFaq === num;
            return (
              <div key={num} style={{ borderBottom: `1px solid ${C.borderLt}` }}>
                <button
                  onClick={() => {
                    if (!isOpen) { posthog?.capture("faq_opened", { question: num }); clarity("faq_opened", String(num)); }
                    setOpenFaq(isOpen ? null : num);
                  }}
                  className="w-full flex justify-between items-center py-3.5 text-left group"
                >
                  <span className="text-[13px] font-medium pr-4 transition-colors" style={{ color: C.text }}>
                    {t(`faq_q${num}`)}
                  </span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 shrink-0 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                    style={{ color: C.text4 }}
                  />
                </button>
                <div
                  className={`text-[13px] leading-[1.7] transition-all duration-300 ease-in-out overflow-hidden ${isOpen ? "max-h-[500px] pb-4 opacity-100" : "max-h-0 opacity-0"}`}
                  style={{ color: C.text2 }}
                >
                  {t(`faq_a${num}`)}
                </div>
              </div>
            );
          })}
        </div>

        <p className="mt-10 text-center text-[13px]" style={{ color: C.text4 }}>
          {t("faq_contact_pre")}{" "}
          <a href="mailto:info@aurapep.eu" className="font-medium underline underline-offset-4 transition-colors" style={{ color: C.text2, textDecorationColor: C.border }}>
            {t("faq_contact_link")}
          </a>
        </p>
      </div>
    </section>
  );

  /* ─────────────────────────── FOOTER ─────────────────────────────── */
  const footer = (
    <footer className="py-10 px-6" style={{ background: C.bg, borderTop: `1px solid ${C.borderLt}` }}>
      <div className="max-w-[1140px] mx-auto grid grid-cols-1 md:grid-cols-3 gap-12 text-sm mb-12" style={{ color: C.text4 }}>
        <div className="flex flex-col gap-4">
          <span className="text-lg font-medium tracking-widest uppercase" style={{ color: C.text }}>
            {t("title")}
          </span>
          <p>{t("footer_description")}</p>
        </div>
        <div className="flex flex-col gap-3">
          <h4 className="font-medium uppercase tracking-widest text-xs mb-1" style={{ color: C.text }}>{t("footer_office_title")}</h4>
          <p>📍 {t("footer_office_address")}</p>
        </div>
        <div className="flex flex-col gap-3">
          <a href="mailto:info@aurapep.eu" className="font-medium underline underline-offset-4" style={{ color: C.text2 }}>info@aurapep.eu</a>
          <p>⏱️ {t("footer_office_hours")}</p>
        </div>
      </div>
      <div className="max-w-[1140px] mx-auto text-xs leading-relaxed mb-8 pt-6" style={{ color: C.text4, borderTop: `1px solid ${C.borderLt}` }}>
        <p>{t("footer_disclaimer")}</p>
      </div>
      <div className="max-w-[1140px] mx-auto flex flex-col md:flex-row justify-between items-center gap-6 text-sm pt-8" style={{ color: C.text4, borderTop: `1px solid ${C.border}` }}>
        <p>{t("footer_copy")}</p>
        <span className="uppercase tracking-widest text-xs flex items-center gap-2">
          <ShieldCheck className="w-3 h-3" style={{ color: C.accent }} /> {t("footer_secure")}
        </span>
      </div>
    </footer>
  );

  /* ─────────────────────────── COA MODAL ─────────────────────────── */
  const coaModal = showCoaModal && (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowCoaModal(false)} />
      <div className="relative rounded-2xl p-6 md:p-8 max-w-4xl w-full max-h-[85vh] overflow-y-auto" style={{ background: C.bg, border: `1px solid ${C.border}`, boxShadow: "0 25px 60px rgba(0,0,0,0.15)" }}>
        <div className="flex justify-between items-center border-b pb-4 mb-6" style={{ borderColor: C.borderLt }}>
          <h3 className="text-xl md:text-2xl font-light flex items-center gap-3" style={{ color: C.text }}>
            <FlaskConical className="w-6 h-6" style={{ color: C.accent }} />
            {t("lab_title")}
          </h3>
          <button onClick={() => setShowCoaModal(false)} className="transition-colors text-lg" style={{ color: C.text3 }}>✕</button>
        </div>

        <div className="flex flex-col md:flex-row gap-8">
          <div className="w-full md:w-1/2 rounded-xl overflow-hidden relative group cursor-pointer" style={{ border: `1px solid ${C.borderLt}` }}
            onClick={() => window.open("/assets/janoshik-coa-retatrutide-10mg.png", "_blank")}
          >
            <Image
              src="/assets/janoshik-coa-retatrutide-10mg.png"
              alt="Certificate of Analysis - Retatrutide 10mg purity verification 99.86% HPLC tested"
              width={800}
              height={1000}
              className="w-full h-auto object-cover"
            />
          </div>

          <div className="w-full md:w-1/2 flex flex-col justify-center gap-6">
            <div className="flex flex-col gap-2 border-b pb-4" style={{ borderColor: C.borderLt }}>
              <span className="text-sm tracking-widest uppercase" style={{ color: C.accent }}>{t("lab_compound")}</span>
              <span className="text-xl font-medium" style={{ color: C.text }}>Retatrutide (LY3437943)</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col"><span className="text-xs" style={{ color: C.text3 }}>{t("lab_declared")}</span><span className="font-medium" style={{ color: C.text }}>10.0 mg</span></div>
              <div className="flex flex-col"><span className="text-xs" style={{ color: C.text3 }}>{t("lab_measured")}</span><span className="font-medium" style={{ color: C.text }}>10.12 mg</span></div>
              <div className="flex flex-col"><span className="text-xs" style={{ color: C.text3 }}>{t("lab_purity")}</span><span className="font-medium" style={{ color: C.accent }}>99.86%</span></div>
              <div className="flex flex-col"><span className="text-xs" style={{ color: C.text3 }}>{t("lab_status")}</span><span className="font-medium flex items-center gap-1" style={{ color: C.success }}><ShieldCheck className="w-3 h-3" /> {t("lab_pass")}</span></div>
            </div>
            <button
              onClick={() => window.open("/assets/janoshik-coa-retatrutide-10mg.png", "_blank")}
              className="mt-4 px-6 py-2.5 rounded-lg font-medium text-[14px] transition-colors self-start"
              style={{ background: C.navy, color: "#fff" }}
              onMouseEnter={e => (e.currentTarget.style.background = C.navyHov)}
              onMouseLeave={e => (e.currentTarget.style.background = C.navy)}
            >
              {t("lab_download")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  /* ─────────────────────────── STICKY BAR (mobile) ──────────────── */
  const stickyBar = showStickyBar && (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 lg:hidden px-4 py-3 flex items-center justify-between gap-4"
      style={{ background: "rgba(255,255,255,0.95)", backdropFilter: "blur(12px)", borderTop: `1px solid ${C.borderLt}`, boxShadow: "0 -4px 20px rgba(0,0,0,0.08)" }}
    >
      <div className="flex flex-col min-w-0">
        <div className="flex items-baseline gap-1.5">
          <span className="text-xs leading-none" style={{ color: C.text4 }}>{t("hero_cta_starting")}</span>
          <span className="text-2xl font-bold leading-none" style={{ color: C.accent }}>99€</span>
        </div>
        <div className="flex items-center gap-1 mt-1">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse shrink-0" />
          <span className="text-xs text-red-600 leading-none whitespace-nowrap">
            {t("inventory_high_demand")} <strong className="tabular-nums" style={{ color: C.text }}>{stock}</strong> {t("inventory_kits_remaining")}
          </span>
        </div>
      </div>
      <button
        onClick={() => { posthog?.capture("cta_clicked", { location: "sticky_bar_light", locale }); clarity("cta_clicked", "sticky_bar_light"); goto("/order"); }}
        className="shrink-0 py-2.5 px-8 rounded-lg font-medium text-sm flex items-center gap-2 transition-colors"
        style={{ background: C.navy, color: "#fff" }}
      >
        {t("hero_cta_hook")} <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );

  /* ─────────────────────────── RENDER ─────────────────────────────── */
  return (
    <>
      {hero}
      {features}
      {trustTicker}
      {qualityPipeline}
      {productSpecs}
      {testimonials}
      {calculatorCta}
      {buyerProtection}
      {blogCta}
      {faq}
      {footer}
      {coaModal}
      {stickyBar}
    </>
  );
}
