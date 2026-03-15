# Project Status — aurapep.eu

> **File condiviso tra Claude Code e Gemini.** Leggere SEMPRE prima di lavorare sul progetto.
> Aggiornare dopo ogni modifica significativa.
> Per il changelog dettagliato vedi `PROJECT_HISTORY.md`.

---

## Current State

- **Last deploy**: 2026-03-15 (commit `43f393a`)
- **Branch**: main (up to date with origin/main)
- **Build**: 99 static pages + 24 API routes, zero errors
- **Theming**: CSS variable-based light/dark theme system. Dark = default. Light attivato da cookie `theme=light` → `data-theme="light"` su `<html>`
- **Analytics**: Microsoft Clarity (`vn1xc3jub1`) session replay + heatmaps; PostHog eventi custom (session replay OFF); Sentry error tracking (`aurapep-eu` su EU server, org `neurosoft-af`); **Ahrefs** site verification + analytics (`ECL265EZNoHAwvuR19Pwaw`)
- **IndexNow**: configurato e inviato (50 URL → Bing/Yandex/Seznam/Naver)
- **Sitemap**: 50 URLs (5 pages × 10 locales) con hreflang cross-references
- **Domain**: aurapep.eu (Vercel, auto-deploy on push to main)

---

## Business Model

**Aura Peptides** — E-commerce crypto-native per la vendita di peptidi di ricerca in Europa.

- **Prodotto**: Retatrutide 10mg Research Kit (SKU: `RET-KIT-1`)
- **Include**: Retatrutide 10mg lyophilized powder + Bacteriostatic Water gratuita
- **Target**: Ricercatori e acquirenti EU (27 paesi)
- **Pagamenti**: Solo criptovalute (nessun metodo tradizionale)
- **Spedizione**: Free stealth shipping in tutta l'UE
- **Posizionamento**: Premium quality, privacy-first, trust-focused (HPLC ≥99.8%, Janoshik tested)

---

## Prodotto & Pricing

**Prezzo base**: €197 per kit (`BASE_PRICE = 197` in `src/app/[locale]/order/page.tsx:12`)

**Volume Discount (6 tier)**:

| Quantità | Sconto | Prezzo/unità (prod) |
|----------|--------|---------------------|
| 1-2      | 0%     | €197                |
| 3-4      | 10%    | €177.30             |
| 5-9      | 15%    | €167.45             |
| 10-19    | 25%    | €147.75             |
| 20-29    | 35%    | €128.05             |
| 30+      | 50%    | €98.50              |

**27 paesi EU serviti**: Austria, Belgium, Bulgaria, Croatia, Cyprus, Czech Republic, Denmark, Estonia, Finland, France, Germany, Greece, Hungary, Ireland, Italy, Latvia, Lithuania, Luxembourg, Malta, Netherlands, Poland, Portugal, Romania, Slovakia, Slovenia, Spain, Sweden

---

## Payment System (Solo Crypto)

**Gateway**: CryptAPI (`https://api.cryptapi.io/`)

**Criptovalute supportate**:

| Crypto | Network | Wallet |
|--------|---------|--------|
| BTC    | Bitcoin | `bc1qcwpmw65ucscvgstppgty03n4xufmsztvr6mx3j` |
| ETH    | ERC20   | `0x0605C80Fc5bB9e65264bD562B528b1f3cB3432C0` |
| XMR    | Monero  | `44AFFq5kSiGBoZ4...RVGQBEP3A` |
| SOL    | Solana  | `5fmrMg776oUFyX71Yi9qzqcwPcEU3AvaL7e6nUK8kQaR` |
| USDT   | TRC20   | `TUjXYc8uJ85FGJs2QCqv9Co5SV9bFhebdC` |
| USDC   | ERC20   | `0x0605C80Fc5bB9e65264bD562B528b1f3cB3432C0` |
| XRP    | BEP20   | **NON CONFIGURATO** |

**Payment flow**:
1. Customer seleziona crypto → `POST /api/checkout` → CryptAPI genera indirizzo unico
2. Email immediata con indirizzo, importo crypto, link checkout
3. QR code + indirizzo mostrati nella checkout page → customer invia crypto
4. CryptAPI webhook conferma → status "paid" → email receipt + admin alert + warehouse SMS
5. Buffer volatilità 1%. Recovery email a 1h/12h/48h. Dopo 72h → "expired" (pagamenti tardivi accettati)

**Status possibili**: `pending → paid → processing → shipped → delivered` | `cancelled`, `expired`, `refunded`, `partially_refunded`, `underpaid`

---

## Stack & Dependencies

| Tech | Versione | Scopo |
|------|----------|-------|
| Next.js | 16.1.6 | Framework (App Router, Turbopack) |
| React | 19.2.3 | UI library |
| Tailwind CSS | 4 | Styling (@theme block, postcss) |
| next-intl | 4.8.3 | i18n (10 locales, RTL Arabic) |
| Framer Motion | 12.34.2 | Animazioni |
| Supabase JS | 2.97.0 | Database + Auth |
| Resend | 6.9.2 | Email transazionali |
| Zod | 4.3.6 | Validazione input |

---

## i18n

- **10 locales**: en (default), it, fr, de, es, pt, pl, ru, uk, ar
- **Routing**: `src/i18n/routing.ts` — `localePrefix: 'always'` (tutte le lingue con prefisso)
- **Traduzioni**: `messages/{locale}.json` — tutto sotto namespace `"Index"`
- **Arabic (ar)**: RTL gestito in root layout `dir` attribute
- **SEO keys per locale**: keyword transazionali (buy/kaufen/acheter/comprare/comprar/kupić/купить)

---

## Design System

**Theme system** (CSS variables in `src/app/globals.css`):
- Dark theme = default (`:root`), Light theme = `[data-theme="light"]` su `<html>`
- Attivazione: cookie `theme=light` letto in `layout.tsx` via `cookies()` next/headers
- Admin pages escluse (usano `brand-*` colors direttamente)

**Semantic color tokens** (usare `t-*` nelle classi Tailwind):
| Token | Dark | Light | Uso |
|-------|------|-------|-----|
| `t-bg` | `#0A0F16` | `#FFFFFF` | Page background |
| `t-bg-alt` | `#0A0F16` | `#F8F7F4` | Sezioni alternate |
| `t-bg-card` | `rgba(20,30,45,0.6)` | `#FFFFFF` | Card/pannelli |
| `t-bg-subtle` | `rgba(255,255,255,0.05)` | `rgba(0,0,0,0.03)` | Bg sottile |
| `t-text` | `#ffffff` | `#1A2744` | Testo primario |
| `t-text-2` | `rgba(255,255,255,0.7)` | `#475569` | Testo secondario |
| `t-text-3` | `rgba(255,255,255,0.5)` | `#8C919A` | Testo muted |
| `t-accent` | `#D4AF37` | `#C09B2D` | Accent gold |
| `t-border` | `rgba(255,255,255,0.1)` | `#E0DDD6` | Bordi standard |
| `t-btn` | `#D4AF37` | `#1A2744` | Bottone primario bg |
| `t-btn-text` | `#0A0F16` | `#FFFFFF` | Bottone primario text |
| `t-success` | `#4ade80` | `#1B6B40` | Colore successo |

**Utility CSS custom**: `.glass-panel`, `.gold-glow`, `.text-gradient-gold`, `.theme-dark-only`/`.theme-light-only`
**Tipografia**: Geist Sans (Google Font), pesi: 200-600

---

## Landing Page Sections (in ordine)

1. **Header/Nav** — Logo "RETATRUTIDE", nav links, LanguageSwitcher, Portal CTA
2. **Hero** — Badge, heading con gradiente, LiveInventoryBadge, CTA, prezzo "Starting at 97€", trust elements, vial image
3. **Features** (#science) — 3 card: Premium Quality, Crypto Checkout (gold), Next-Day Shipping
4. **Trust Ticker** — Scrolling infinito: 99.8% HPLC, Lab Verified, Stealth Packaging, 2-day Guarantee
5. **Quality Pipeline** (#quality) — 5 step + View COA button
6. **Testimonials** (#testimonials) — 3 review cards + trust micro-badges
7. **Why Aura** — 2×2 grid, 4 benefit cards
8. **Product Specs** — Tabella 6 righe (Format, Purity, Storage, ecc.)
9. **Calculator CTA** — Link alla pagina calculator
10. **Buyer Protection** — 3 garanzie
11. **FAQ** (#faq) — 2 categorie expand/collapse: Ordering & Payment (6+1 Q), Policy & Legal (3 Q)
12. **Footer** — Logo, office info, disclaimer, copyright, language switcher
13. **Modali** — COA image viewer + download, RecentSalesPopup auto-trigger

---

## Pagine Secondarie

| Pagina | Path | Descrizione |
|--------|------|-------------|
| Calculator | `/calculator` | Calcolatore dosaggio peptide, siringa visuale animata, 3 siringhe |
| Crypto Guide | `/crypto-guide` | Guida pagamenti crypto per senior, ChangeHero flow |
| Order | `/order` | Form completo + volume discount + crypto selector + Google Places |
| Portal | `/portal` | Lookup ordine (email + ref ID), status tracker 5 fasi |
| Checkout | `/checkout/[id]` | QR code + indirizzo crypto + countdown 72h |

---

## Admin Dashboard

**Accesso**: `/[locale]/admin/` — protetto da Supabase auth. Noindex via X-Robots-Tag.

**RBAC (4 ruoli)**: super_admin (full), manager (no settings), seller (own orders), warehouse (view+ship+inventory)

**6 Tab**: Dashboard (KPI), Orders (CRUD+filter+export), Inventory (stock), Customers (LTV), Team (invite/roles), Settings (store config)

---

## API Routes

### Admin (autenticati)
`/api/admin/` — dashboard, orders, inventory, customers, manual-order, refund, team, settings, tracking

### Public
- `/api/checkout` POST — Crea ordine + genera indirizzo crypto (rate limited)
- `/api/checkout/pending` GET — Idempotenza ordini pending
- `/api/checkout/status` GET — Poll status (CheckoutPoller)
- `/api/portal` GET — Lookup ordine cliente
- `/api/c/[code]` GET — Short link redirect
- `/api/short-link` GET/POST — URL shortener
- `/api/visitor` POST/PATCH — Facebook CAPI visitor tracking
- `/api/fb-event` POST — Facebook CAPI event relay

### Webhooks & Cron
- `/api/webhooks/cryptapi` GET — Conferma pagamento crypto
- `/api/cron/check-tracking` — Daily: aggiorna tracking
- `/api/cron/expire-orders` — Daily 3AM: scade ordini >72h
- `/api/cron/cart-recovery` — Hourly: email recovery 1h/12h/48h
- `/api/cron/cleanup-visitors` — Daily: elimina visitors >30gg
- `/api/indexnow` — Ping IndexNow (50 URL)

---

## Database Schema (Supabase PostgreSQL)

| Tabella | Scopo | Campi chiave |
|---------|-------|-------------|
| `orders` | Ordini | reference_id, status, crypto_currency/amount, fiat_amount, email, shipping_address JSONB, items JSONB, tracking_number, carrier |
| `customers` | Clienti (upsert auto) | email UNIQUE, full_name, phone |
| `inventory` | Stock prodotti | sku ('RET-KIT-1'), quantity, reorder_level (50) |
| `inventory_movements` | Cronologia stock | type (add/remove/sale/refund), quantity, performed_by, order_id |
| `profiles` | RBAC utenti | role (customer/super_admin/manager/seller/warehouse), is_active |
| `store_settings` | Config store | key TEXT PK, value JSONB |
| `website_visitors` | Facebook CAPI attribution | visitor_id, UTM params, progressive PII, events_sent |
| `short_links` | URL shortener | code (7 chars), target_url, clicks |

---

## Integrazioni Third-Party

| Servizio | Scopo |
|----------|-------|
| CryptAPI | Payment gateway crypto |
| Supabase | Database + Auth |
| Resend | Email transazionali (9 template, 5 multilingua) |
| ClickSend | SMS notifiche warehouse |
| Google Places | Address autocomplete |
| 17Track | Tracking spedizioni |
| Microsoft Clarity | Session recording + heatmaps + custom tags |
| PostHog | Eventi custom (session replay OFF) |
| Sentry | Error tracking + performance (20% traces, EU server) |
| Facebook CAPI | Conversions API server-side (cloaking, no pixel) |
| IndexNow | Search engine notification |
| Google Search Console | SEO monitoring |

---

## SEO Architecture

- `src/lib/seo.ts` → `buildPageMetadata()` con `title: { absolute: title }`
- Root layout: `generateMetadata()` con title template `%s | Aura Peptides`
- Child routes: `layout.tsx` wrapper esporta `generateMetadata()`
- Structured data: componenti client in `src/components/seo/`
- Translation keys SEO: pattern `seo_{page}_{field}` (4 chiavi × 5 pagine × 10 locales)
- robots.ts: block /admin/, /api/, /checkout/
- sitemap.ts: 50 URLs con hreflang cross-references

---

## Recently Completed

> Dettagli completi in `PROJECT_HISTORY.md`

- [2026-03-15] **SEO optimization from GSC data**: calculator "Free Retatrutide Dosage Calculator" titles + keyword-rich descriptions (10 locales), FAQ section (4 Q&A) + FAQPage schema, IT homepage "comprare retatrutide europa", improved structured data
- [2026-03-15] **Hero images WebP**: product_hero_v5 (5.6MB→121KB), product_hero_v5_wide (5.6MB→101KB), vial_v7_white (2.5MB→59KB) — 98% riduzione
- [2026-03-15] **Fix Ahrefs SEO audit**: disabilitati alternate Link headers middleware (100 errori hreflang duplicati/redirect), accorciate 26 meta descriptions (9 locales ≤155 chars)
- [2026-03-15] **Ahrefs integration**: analytics script + site verification (meta tag + HTML file)
- [2026-03-15] **Cart recovery email sequence redesign (6 email)**:
  - Sequenza: 1h (Helper) → 12h (Motivator) → 24h (Guide) → 48h (Closer) → 68h (Last chance) → 73h (Post-expiry)
  - Sezione ChangeHero con tutorial carta personalizzato (importo + indirizzo ordine) — solo USDT/USDC
  - Link ChangeHero locale-specific (7 lingue supportate + 3 fallback EN)
  - Copy psychology-driven: self-persuasion, social proof, fear reframe, sunk cost, loss aversion
  - Email 6 post-scadenza: "il primo momento migliore era allora, il secondo è adesso"
  - 24+ translation keys × 10 locales, wider mobile layout, font +1px
  - Cron aggiornato: email 1-5 per ordini pending, email 6 per ordini expired
- [2026-03-13] FAQ dosaggi (#10) + light theme fixato su tutte le pagine secondarie (non committato)
- [2026-03-13] Blog CTA card in LightPage per glp1journal.eu con UTM + email capture (non committato)
- [2026-03-12] Light/Dark theme system completo — 20 CSS variables, 17 Tailwind tokens, ~200 classi refactored
- [2026-03-05] Facebook CAPI server-side + locale prefix `always` + email → info@aurapep.eu
- [2026-03-03] Nuova immagine prodotto hero (Gemini 3.1 Flash)
- [2026-03-01] Sentry + Clarity custom tags + PostHog verificato

---

## In Progress

- **Light theme online strategy** — decidere come servire dark/light in produzione (A/B test PostHog, toggle utente, default light, per campagna)
- **Blog CTA traduzioni** — 7 chiavi `blog_cta_*` da tradurre in 9 lingue + altre chiavi LightPage mancanti
- **SEO keyword tracking** — monitorare GSC per "retatrutide dosage calculator" (pos 31→target top 10), "retatrutide comprare" (pos 10→target top 5)
- **Cart recovery email traduzioni** — le chiavi `recovery_card_*` e nuovi intro sono tradotti solo in EN/IT, le altre 8 lingue hanno i vecchi testi per email 1-2 e mancano card_* keys

---

## TODO / Planned

- [ ] Configurare wallet XRP (attualmente placeholder `CRYPTAPI_XRP_WALLET`)
- [ ] Registrare domini extra: glp1research.eu, glp1review.eu, glp1digest.eu, glp1insider.eu
- [ ] **SEO BLOCCANTE**: glp1journal.eu non indicizzato (site:glp1journal.eu = 0). Registrare su Google Search Console + submittare sitemap
- [ ] **E-E-A-T**: creare pagina "Chi Siamo", aggiungere autore reale con credenziali, medical review badge
- [ ] **Content gap**: articoli mancanti ad alto potenziale — Ozempic Face, prezzi GLP-1 Italia/Europa, alimenti GLP-1 naturali, orforglipron, approvazione retatrutide Europa
- [ ] **Traduzioni email recovery**: aggiornare chiavi recovery_card_* + nuovi intro/subject per FR/DE/ES/PT/PL/RU/UK/AR (attualmente solo EN/IT hanno i testi nuovi)
- [ ] **Rimuovere PNG originali**: product_hero_v5.png (5.6MB), product_hero_v5_wide.png (5.6MB), vial_v7_white.png (2.5MB) — sostituiti da WebP ma PNG ancora nel repo
- [ ] **Comprimere immagini non usate**: ~20 immagini in public/images/ (ad creative, vecchi hero) — non servite ma occupano spazio repo

---

## Do NOT Touch (senza coordinamento)

- `src/lib/seo.ts` — utility condivisa da tutti i layout
- `src/app/[locale]/layout.tsx` — root metadata, hreflang, title template
- `src/i18n/routing.ts` — lista locales usata da sitemap, seo.ts, middleware
- `messages/en.json` — template di riferimento per tutte le altre lingue
- `next.config.ts` — headers X-Robots-Tag, next-intl plugin
- `src/lib/auth.ts` — autenticazione e RBAC per tutte le API admin
- `src/app/api/webhooks/cryptapi/` — webhook pagamenti, errori = ordini persi

---

## Conventions

- Commit: `feat:`, `fix:`, `refactor:`, `docs:`
- SEO title < 60 chars, description 120-160 chars
- Nuova pagina pubblica → layout.tsx + structured data + 10 message files + sitemap entry
- Tailwind 4 @theme block per colori custom, `.glass-panel` per card
- Admin UI in italiano (hardcoded), public pages internazionalizzate
