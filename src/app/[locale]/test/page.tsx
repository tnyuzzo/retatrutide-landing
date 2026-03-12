"use client";

import { useState } from "react";
import Image from "next/image";
import { useLocale } from "next-intl";
import {
  FlaskConical,
  ShieldCheck,
  Truck,
  ChevronDown,
  ArrowRight,
  Check,
  FileText,
  Microscope,
  Package,
  Clock,
  Globe,
  Mail,
  ExternalLink,
} from "lucide-react";

/* ─────────────────────────────────────────────
   PALETTE  — warm clinical
   bg:       #FAFAF8  (warm white)
   surface:  #F3F4F1  (warm gray)
   border:   #E2E3DE  (soft edge)
   text:     #1B1F23  (near-black)
   muted:    #6B7280  (cool gray)
   accent:   #0B6E4F  (pharmaceutical teal)
   accent-l: #E8F5EF  (teal tint)
   blue:     #1E40AF  (data / links)
   ───────────────────────────────────────────── */

const ACCENT = "#0B6E4F";
const ACCENT_LIGHT = "#E8F5EF";
const SURFACE = "#F3F4F1";
const BORDER = "#E2E3DE";
const TEXT = "#1B1F23";
const MUTED = "#6B7280";
const BLUE = "#1E40AF";

/* ── Inline styles (scoped to this page, no global CSS pollution) ── */

const pageStyle: React.CSSProperties = {
  background: "#FAFAF8",
  color: TEXT,
  fontFamily: "var(--font-geist-sans), system-ui, sans-serif",
  WebkitFontSmoothing: "antialiased",
  minHeight: "100vh",
};

/* ── Shared small components ── */

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span
      style={{ background: ACCENT_LIGHT, color: ACCENT }}
      className="inline-flex items-center gap-1.5 text-xs font-semibold tracking-wide uppercase px-3 py-1 rounded-full"
    >
      {children}
    </span>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p
      style={{ color: ACCENT }}
      className="text-xs font-semibold tracking-[0.2em] uppercase mb-3"
    >
      {children}
    </p>
  );
}

function Divider() {
  return <hr style={{ borderColor: BORDER }} className="border-t my-0" />;
}

function FaqItem({
  q,
  a,
  open,
  onClick,
}: {
  q: string;
  a: string;
  open: boolean;
  onClick: () => void;
}) {
  return (
    <div style={{ borderBottom: `1px solid ${BORDER}` }}>
      <button
        onClick={onClick}
        className="w-full flex items-center justify-between py-5 text-left cursor-pointer"
      >
        <span className="text-[15px] font-medium pr-4" style={{ color: TEXT }}>
          {q}
        </span>
        <ChevronDown
          className={`w-4 h-4 shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          style={{ color: MUTED }}
        />
      </button>
      <div
        className={`overflow-hidden transition-all duration-200 ${open ? "max-h-96 pb-5" : "max-h-0"}`}
      >
        <p className="text-sm leading-relaxed" style={{ color: MUTED }}>
          {a}
        </p>
      </div>
    </div>
  );
}

/* ── Volume pricing data ── */
const PRICING = [
  { qty: "1–2", unit: "€197.00", discount: "—" },
  { qty: "3–4", unit: "€177.30", discount: "10%" },
  { qty: "5–9", unit: "€167.45", discount: "15%" },
  { qty: "10–19", unit: "€147.75", discount: "25%" },
  { qty: "20–29", unit: "€128.05", discount: "35%" },
  { qty: "30+", unit: "€98.50", discount: "50%" },
];

/* ── COA data ── */
const COA_DATA = [
  { label: "Compound", value: "Retatrutide (LY3437943)" },
  { label: "CAS Number", value: "2381089-83-2" },
  { label: "Format", value: "Lyophilized Powder" },
  { label: "Declared Content", value: "10.0 mg / vial" },
  { label: "Measured Content", value: "10.12 mg / vial" },
  { label: "Purity (HPLC)", value: "99.86%" },
  { label: "Endotoxin", value: "< 0.5 EU/mg — Pass" },
  { label: "Heavy Metals", value: "< 10 ppm — Pass" },
  { label: "Sterility", value: "No growth detected — Pass" },
  { label: "Testing Lab", value: "Janoshik Analytical (Prague, CZ)" },
  { label: "Method", value: "RP-HPLC + LC-MS/MS" },
];

/* ── Specs data ── */
const SPECS = [
  { label: "Format", value: "Lyophilized powder, sealed under argon" },
  { label: "Net Content", value: "10.0 mg per vial" },
  { label: "Purity", value: "≥ 99.8% (HPLC verified)" },
  { label: "Storage (sealed)", value: "−20 °C · Stable 3–5 years" },
  { label: "Storage (reconstituted)", value: "2–8 °C · Use within 30 days" },
  { label: "Reconstitution Solvent", value: "Bacteriostatic water (included)" },
  { label: "CAS", value: "2381089-83-2" },
  { label: "Molecular Weight", value: "4,767.44 Da" },
  { label: "Mechanism", value: "Triple agonist: GLP-1 / GIP / GCGR" },
];

/* ── FAQ data ── */
const FAQS = [
  {
    q: "Which countries do you ship to?",
    a: "We ship to all 27 EU member states. Orders are dispatched from within the European Union — no customs clearance, no import duties. Standard delivery is 2–5 business days.",
  },
  {
    q: "What payment methods do you accept?",
    a: "We accept cryptocurrency payments: USDT (TRC-20), USDC (ERC-20), Bitcoin, Ethereum, Solana, and Monero. This allows us to serve researchers across all EU jurisdictions without banking restrictions on research compounds.",
  },
  {
    q: "Can I verify the Certificate of Analysis independently?",
    a: "Yes. Every COA is issued by Janoshik Analytical, an independent testing laboratory based in Prague. You can contact them directly to verify any report. We also encourage customers to submit samples for independent third-party verification.",
  },
  {
    q: "What is your return and refund policy?",
    a: "Due to the temperature-sensitive nature of research compounds, we cannot accept returns of opened products. Unopened, sealed vials may be returned within 14 days. If your shipment is lost or arrives damaged, we offer free reshipment or a full refund.",
  },
  {
    q: "Are research peptides legal to purchase in the EU?",
    a: "Research peptides sold and labeled for in-vitro laboratory use are legal to purchase in most EU jurisdictions. Our products are not intended for human consumption and are sold strictly for research purposes. We recommend verifying your local regulations before ordering.",
  },
  {
    q: "How is my order packaged?",
    a: "Vials are shipped in insulated packaging with cold packs to maintain stability. External packaging is plain and unmarked — contents are not visible or identifiable from the outside.",
  },
];

/* ═══════════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════════ */

export default function TestPage() {
  const locale = useLocale();
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div style={pageStyle}>
      {/* ── NAV ── */}
      <nav
        style={{ borderBottom: `1px solid ${BORDER}` }}
        className="sticky top-0 z-50 backdrop-blur-md bg-[#FAFAF8]/90"
      >
        <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <FlaskConical className="w-5 h-5" style={{ color: ACCENT }} />
            <span className="text-[15px] font-semibold tracking-tight" style={{ color: TEXT }}>
              Aura Peptides
            </span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm" style={{ color: MUTED }}>
            <a href="#product" className="hover:opacity-70 transition-opacity">Product</a>
            <a href="#quality" className="hover:opacity-70 transition-opacity">Quality</a>
            <a href="#pricing" className="hover:opacity-70 transition-opacity">Pricing</a>
            <a href="#shipping" className="hover:opacity-70 transition-opacity">Shipping</a>
            <a href="#faq" className="hover:opacity-70 transition-opacity">FAQ</a>
          </div>
          <div className="flex items-center gap-3">
            <a
              href={`/${locale}/portal`}
              className="text-sm hidden sm:inline-flex items-center gap-1.5 hover:opacity-70 transition-opacity"
              style={{ color: MUTED }}
            >
              <FileText className="w-3.5 h-3.5" /> Order Lookup
            </a>
            <a
              href={`/${locale}/order`}
              style={{ background: ACCENT }}
              className="text-white text-sm font-medium px-4 py-2 rounded-lg hover:opacity-90 transition-opacity"
            >
              Order Now
            </a>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section id="product" className="max-w-6xl mx-auto px-5 pt-16 pb-20">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-start">
          {/* Left — Product image */}
          <div className="flex flex-col items-center">
            <div
              style={{ background: SURFACE, border: `1px solid ${BORDER}` }}
              className="rounded-2xl p-8 md:p-12 w-full flex items-center justify-center"
            >
              <Image
                src="/images/product_hero_v5.png"
                alt="Retatrutide 10mg research vial — Aura Peptides"
                width={340}
                height={450}
                className="w-auto h-64 md:h-80 object-contain drop-shadow-lg"
                priority
              />
            </div>
            <p className="text-xs mt-4 text-center" style={{ color: MUTED }}>
              Actual product photo. Bacteriostatic water included with every order.
            </p>
          </div>

          {/* Right — Product info */}
          <div className="flex flex-col gap-6">
            <div>
              <Badge>
                <ShieldCheck className="w-3 h-3" /> In Stock — Ships within 24h
              </Badge>
            </div>

            <div>
              <h1
                className="text-3xl md:text-4xl font-bold tracking-tight leading-tight"
                style={{ color: TEXT }}
              >
                Retatrutide 10mg
              </h1>
              <p className="text-lg mt-1" style={{ color: MUTED }}>
                Research Kit — Lyophilized Powder + Bacteriostatic Water
              </p>
            </div>

            <p className="text-[15px] leading-relaxed" style={{ color: MUTED }}>
              Third-generation triple agonist peptide (GLP-1 / GIP / GCGR) for advanced
              in-vitro research. Each vial is independently tested by Janoshik Analytical
              and ships with a Certificate of Analysis.
            </p>

            {/* Key specs inline */}
            <div
              style={{ background: SURFACE, border: `1px solid ${BORDER}` }}
              className="rounded-xl p-4 grid grid-cols-3 gap-4"
            >
              {[
                { label: "Purity", val: "≥ 99.8%" },
                { label: "Content", val: "10.0 mg" },
                { label: "CAS", val: "2381089-83-2" },
              ].map((s) => (
                <div key={s.label} className="text-center">
                  <p className="text-xs" style={{ color: MUTED }}>{s.label}</p>
                  <p className="text-sm font-semibold mt-0.5" style={{ color: TEXT }}>{s.val}</p>
                </div>
              ))}
            </div>

            {/* Price + CTA */}
            <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4 sm:gap-6">
              <div>
                <p className="text-xs" style={{ color: MUTED }}>Price per vial</p>
                <p className="text-3xl font-bold tracking-tight" style={{ color: TEXT }}>
                  €197<span className="text-base font-normal" style={{ color: MUTED }}>.00</span>
                </p>
                <p className="text-xs mt-1" style={{ color: ACCENT }}>
                  Volume discounts from 3+ units
                </p>
              </div>
              <a
                href={`/${locale}/order`}
                style={{ background: ACCENT }}
                className="inline-flex items-center gap-2 text-white font-medium px-6 py-3 rounded-lg hover:opacity-90 transition-opacity text-[15px]"
              >
                Place Order <ArrowRight className="w-4 h-4" />
              </a>
            </div>

            {/* Trust row */}
            <div className="flex flex-wrap gap-x-6 gap-y-2 pt-2">
              {[
                { icon: Truck, text: "Free EU shipping" },
                { icon: Package, text: "Plain packaging" },
                { icon: ShieldCheck, text: "Reshipment guarantee" },
              ].map((t) => (
                <span
                  key={t.text}
                  className="inline-flex items-center gap-1.5 text-xs"
                  style={{ color: MUTED }}
                >
                  <t.icon className="w-3.5 h-3.5" style={{ color: ACCENT }} />
                  {t.text}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-5"><Divider /></div>

      {/* ── FULL SPECS TABLE ── */}
      <section className="max-w-6xl mx-auto px-5 py-16">
        <SectionLabel>Specifications</SectionLabel>
        <h2 className="text-2xl font-bold tracking-tight mb-8" style={{ color: TEXT }}>
          Product Data Sheet
        </h2>
        <div
          style={{ border: `1px solid ${BORDER}` }}
          className="rounded-xl overflow-hidden"
        >
          {SPECS.map((row, i) => (
            <div
              key={row.label}
              className="flex"
              style={{
                background: i % 2 === 0 ? "#FAFAF8" : SURFACE,
                borderBottom: i < SPECS.length - 1 ? `1px solid ${BORDER}` : "none",
              }}
            >
              <div
                className="w-1/3 sm:w-1/4 px-4 py-3 text-sm font-medium shrink-0"
                style={{ color: TEXT }}
              >
                {row.label}
              </div>
              <div className="px-4 py-3 text-sm" style={{ color: MUTED }}>
                {row.value}
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-5"><Divider /></div>

      {/* ── COA / QUALITY ── */}
      <section id="quality" className="max-w-6xl mx-auto px-5 py-16">
        <SectionLabel>Quality Assurance</SectionLabel>
        <h2 className="text-2xl font-bold tracking-tight mb-3" style={{ color: TEXT }}>
          Certificate of Analysis
        </h2>
        <p className="text-sm mb-8 max-w-2xl" style={{ color: MUTED }}>
          Every batch is independently tested by Janoshik Analytical (Prague, Czech Republic).
          Full analytical reports are provided with each order and can be independently verified.
        </p>

        <div className="grid lg:grid-cols-5 gap-8">
          {/* COA data table — 3 cols */}
          <div className="lg:col-span-3">
            <div
              style={{ border: `1px solid ${BORDER}` }}
              className="rounded-xl overflow-hidden"
            >
              <div
                style={{ background: ACCENT, color: "white" }}
                className="px-4 py-3 text-xs font-semibold tracking-wide uppercase flex items-center gap-2"
              >
                <Microscope className="w-3.5 h-3.5" />
                Batch Analysis Report — Current Lot
              </div>
              {COA_DATA.map((row, i) => {
                const isPass = row.value.includes("Pass") || row.value === "99.86%";
                return (
                  <div
                    key={row.label}
                    className="flex"
                    style={{
                      background: i % 2 === 0 ? "#FAFAF8" : SURFACE,
                      borderBottom: i < COA_DATA.length - 1 ? `1px solid ${BORDER}` : "none",
                    }}
                  >
                    <div
                      className="w-2/5 px-4 py-2.5 text-sm font-medium shrink-0"
                      style={{ color: TEXT }}
                    >
                      {row.label}
                    </div>
                    <div
                      className="px-4 py-2.5 text-sm flex items-center gap-1.5"
                      style={{ color: isPass ? ACCENT : MUTED }}
                    >
                      {isPass && <Check className="w-3.5 h-3.5" />}
                      {row.value}
                    </div>
                  </div>
                );
              })}
            </div>

            <a
              href="/assets/janoshik-coa-retatrutide-10mg.png"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm font-medium mt-4 hover:opacity-70 transition-opacity"
              style={{ color: BLUE }}
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Download full COA report (PNG)
            </a>
          </div>

          {/* Quality process — 2 cols */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            <div
              style={{ background: SURFACE, border: `1px solid ${BORDER}` }}
              className="rounded-xl p-5"
            >
              <h3 className="text-sm font-semibold mb-4" style={{ color: TEXT }}>
                5-Step Analytical Pipeline
              </h3>
              {[
                { n: "01", title: "GMP Synthesis", desc: "Pharmaceutical-grade manufacturing conditions" },
                { n: "02", title: "HPLC Analysis", desc: "Purity verification via chromatography" },
                { n: "03", title: "Mass Spectrometry", desc: "Molecular identity confirmed (LC-MS/MS)" },
                { n: "04", title: "Sterility & Endotoxin", desc: "Contaminant and heavy metal screening" },
                { n: "05", title: "COA Published", desc: "Full report released before dispatch" },
              ].map((step, i) => (
                <div key={step.n} className="flex gap-3 mb-3 last:mb-0">
                  <div className="flex flex-col items-center">
                    <div
                      style={{ background: ACCENT, color: "white" }}
                      className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0"
                    >
                      {step.n}
                    </div>
                    {i < 4 && (
                      <div
                        style={{ background: BORDER }}
                        className="w-px flex-1 mt-1"
                      />
                    )}
                  </div>
                  <div className="pb-3">
                    <p className="text-sm font-medium" style={{ color: TEXT }}>{step.title}</p>
                    <p className="text-xs" style={{ color: MUTED }}>{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-5"><Divider /></div>

      {/* ── PRICING ── */}
      <section id="pricing" className="max-w-6xl mx-auto px-5 py-16">
        <SectionLabel>Pricing</SectionLabel>
        <h2 className="text-2xl font-bold tracking-tight mb-3" style={{ color: TEXT }}>
          Volume Discounts
        </h2>
        <p className="text-sm mb-8 max-w-xl" style={{ color: MUTED }}>
          All prices in EUR. Free shipping on every order. Bacteriostatic water included with each vial.
        </p>

        <div
          style={{ border: `1px solid ${BORDER}` }}
          className="rounded-xl overflow-hidden max-w-lg"
        >
          <div
            className="grid grid-cols-3 px-4 py-2.5 text-xs font-semibold tracking-wide uppercase"
            style={{ background: SURFACE, color: MUTED }}
          >
            <span>Quantity</span>
            <span>Price / Vial</span>
            <span>Discount</span>
          </div>
          {PRICING.map((row, i) => (
            <div
              key={row.qty}
              className="grid grid-cols-3 px-4 py-3 text-sm"
              style={{
                borderTop: `1px solid ${BORDER}`,
                background: i === 0 ? ACCENT_LIGHT : "transparent",
              }}
            >
              <span style={{ color: TEXT, fontWeight: i === 0 ? 600 : 400 }}>
                {row.qty}
              </span>
              <span style={{ color: i === 0 ? ACCENT : TEXT, fontWeight: 600 }}>
                {row.unit}
              </span>
              <span style={{ color: MUTED }}>{row.discount}</span>
            </div>
          ))}
        </div>

        <div className="mt-6 flex flex-col sm:flex-row gap-4 items-start">
          <a
            href={`/${locale}/order`}
            style={{ background: ACCENT }}
            className="inline-flex items-center gap-2 text-white font-medium px-6 py-3 rounded-lg hover:opacity-90 transition-opacity text-[15px]"
          >
            Place Order <ArrowRight className="w-4 h-4" />
          </a>
          <div className="flex items-start gap-2 text-xs" style={{ color: MUTED }}>
            <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" style={{ color: ACCENT }} />
            <span>
              Payment via cryptocurrency (USDT, BTC, ETH, USDC, SOL, XMR).
              <br />
              Need help?{" "}
              <a
                href={`/${locale}/crypto-guide`}
                className="underline hover:opacity-70"
                style={{ color: BLUE }}
              >
                See our payment guide
              </a>.
            </span>
          </div>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-5"><Divider /></div>

      {/* ── SHIPPING ── */}
      <section id="shipping" className="max-w-6xl mx-auto px-5 py-16">
        <SectionLabel>Logistics</SectionLabel>
        <h2 className="text-2xl font-bold tracking-tight mb-8" style={{ color: TEXT }}>
          Shipping & Handling
        </h2>

        <div className="grid sm:grid-cols-3 gap-6">
          {[
            {
              icon: Globe,
              title: "EU-Wide Coverage",
              desc: "Ships to all 27 EU member states. Dispatched from within the EU — no customs, no import fees.",
            },
            {
              icon: Clock,
              title: "Fast Processing",
              desc: "Orders confirmed before 12:00 CET ship same day. Standard delivery in 2–5 business days.",
            },
            {
              icon: Package,
              title: "Temperature-Controlled",
              desc: "Vials packed with insulated materials and cold packs. Plain, unmarked external packaging.",
            },
          ].map((card) => (
            <div
              key={card.title}
              style={{ background: SURFACE, border: `1px solid ${BORDER}` }}
              className="rounded-xl p-5"
            >
              <card.icon className="w-5 h-5 mb-3" style={{ color: ACCENT }} />
              <h3 className="text-sm font-semibold mb-2" style={{ color: TEXT }}>
                {card.title}
              </h3>
              <p className="text-sm leading-relaxed" style={{ color: MUTED }}>
                {card.desc}
              </p>
            </div>
          ))}
        </div>

        {/* Protection banner */}
        <div
          style={{ background: ACCENT_LIGHT, border: `1px solid ${ACCENT}30` }}
          className="rounded-xl p-5 mt-8 flex items-start gap-4"
        >
          <ShieldCheck className="w-6 h-6 shrink-0 mt-0.5" style={{ color: ACCENT }} />
          <div>
            <h3 className="text-sm font-semibold mb-1" style={{ color: TEXT }}>
              Delivery Guarantee
            </h3>
            <p className="text-sm leading-relaxed" style={{ color: MUTED }}>
              If your package is lost or arrives damaged, we reship at no cost or issue a full refund.
              No documentation required — contact us within 30 days of the expected delivery date.
            </p>
          </div>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-5"><Divider /></div>

      {/* ── FAQ ── */}
      <section id="faq" className="max-w-6xl mx-auto px-5 py-16">
        <SectionLabel>Support</SectionLabel>
        <h2 className="text-2xl font-bold tracking-tight mb-8" style={{ color: TEXT }}>
          Frequently Asked Questions
        </h2>

        <div className="max-w-2xl">
          <div style={{ borderTop: `1px solid ${BORDER}` }}>
            {FAQS.map((faq, i) => (
              <FaqItem
                key={i}
                q={faq.q}
                a={faq.a}
                open={openFaq === i}
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
              />
            ))}
          </div>
        </div>

        <div className="mt-8 flex items-center gap-2 text-sm" style={{ color: MUTED }}>
          <Mail className="w-4 h-4" />
          <span>
            Questions? Contact us at{" "}
            <a
              href="mailto:info@aurapep.eu"
              className="underline hover:opacity-70"
              style={{ color: BLUE }}
            >
              info@aurapep.eu
            </a>
            {" "}— we reply within 12 hours.
          </span>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer
        style={{ borderTop: `1px solid ${BORDER}`, background: SURFACE }}
        className="mt-8"
      >
        <div className="max-w-6xl mx-auto px-5 py-12">
          <div className="grid sm:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <FlaskConical className="w-4 h-4" style={{ color: ACCENT }} />
                <span className="text-sm font-semibold" style={{ color: TEXT }}>
                  Aura Peptides
                </span>
              </div>
              <p className="text-xs leading-relaxed" style={{ color: MUTED }}>
                Research-grade peptides for the European scientific community.
                All products are intended for in-vitro laboratory research only.
              </p>
            </div>
            <div>
              <h4 className="text-xs font-semibold tracking-wide uppercase mb-3" style={{ color: TEXT }}>
                Quick Links
              </h4>
              <div className="flex flex-col gap-2">
                {[
                  { label: "Place Order", href: `/${locale}/order` },
                  { label: "Dosage Calculator", href: `/${locale}/calculator` },
                  { label: "Payment Guide", href: `/${locale}/crypto-guide` },
                  { label: "Order Lookup", href: `/${locale}/portal` },
                ].map((link) => (
                  <a
                    key={link.label}
                    href={link.href}
                    className="text-xs hover:opacity-70 transition-opacity"
                    style={{ color: MUTED }}
                  >
                    {link.label}
                  </a>
                ))}
              </div>
            </div>
            <div>
              <h4 className="text-xs font-semibold tracking-wide uppercase mb-3" style={{ color: TEXT }}>
                Contact
              </h4>
              <div className="flex flex-col gap-2 text-xs" style={{ color: MUTED }}>
                <span>info@aurapep.eu</span>
                <span>Mon–Fri 9:00–17:00 CET</span>
                <span>EU Logistics & Distribution</span>
              </div>
            </div>
          </div>

          <div
            style={{ borderTop: `1px solid ${BORDER}` }}
            className="mt-8 pt-6 flex flex-col sm:flex-row justify-between gap-4"
          >
            <p className="text-[11px] leading-relaxed max-w-2xl" style={{ color: MUTED }}>
              All products are sold exclusively for laboratory research purposes and are not
              intended for human consumption. Statements on this website have not been evaluated
              by the EMA, FDA, or any other regulatory authority. Products are not intended to
              diagnose, treat, cure, or prevent any disease.
            </p>
            <p className="text-[11px] shrink-0" style={{ color: MUTED }}>
              &copy; 2026 Aura Peptides Europe
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
