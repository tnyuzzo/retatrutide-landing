# Project Status — aurapep.eu

> **File condiviso tra Claude Code e Gemini.** Leggere SEMPRE prima di lavorare sul progetto.
> Aggiornare dopo ogni modifica significativa.

---

## Current State

- **Last deploy**: 2026-02-22 (commit `f06294c`)
- **Branch**: main (up to date with origin/main)
- **Build**: 81 static pages, zero errors
- **Sitemap**: 50 URLs (5 pages × 10 locales) con hreflang cross-references
- **Domain**: aurapep.eu (Vercel, auto-deploy on push to main)
- **Untracked files**: `CLAUDE.md`, `PROJECT_STATUS.md`, `addShipKeys.js`

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

**Prezzo base**: €197 per kit (**ATTENZIONE**: attualmente `BASE_PRICE = 12` in `src/app/[locale]/order/page.tsx:10` per testing — ripristinare a 197 per produzione)

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
| XMR    | Monero  | `44AFFq5kSiGBoZ4NMDwYtN18obc8AemS33DBLWs3H7otXft3XjrpDtQGv7SqSsaBYBb98uNbr2VBBEt7f2wfn3RVGQBEP3A` |
| SOL    | Solana  | `5fmrMg776oUFyX71Yi9qzqcwPcEU3AvaL7e6nUK8kQaR` |
| USDT   | TRC20   | `TUjXYc8uJ85FGJs2QCqv9Co5SV9bFhebdC` |
| USDC   | ERC20   | `0x0605C80Fc5bB9e65264bD562B528b1f3cB3432C0` |
| XRP    | BEP20   | **NON CONFIGURATO** |

**Payment flow**:
1. Customer seleziona crypto nella order page
2. `POST /api/checkout` → CryptAPI genera indirizzo di pagamento unico
3. QR code + indirizzo mostrati nella checkout page
4. Customer invia crypto → CryptAPI webhook conferma → ordine → "paid"
5. Buffer volatilità 1% aggiunto automaticamente

---

## Order Flow (7 fasi)

```
1. CREATION    → Customer compila form (nome, indirizzo, email, phone, quantità, crypto)
                 Google Places autocomplete per validazione indirizzo (EU only)
                 Rate limit: 5 req/min per IP

2. PAYMENT     → CryptAPI genera indirizzo unico, customer invia crypto
                 CheckoutPoller (10s interval) monitora status

3. CONFIRMATION → Webhook CryptAPI → /api/webhooks/cryptapi
                  Verifica WEBHOOK_SECRET, idempotenza check
                  Status → "paid"

4. AUTOMATION  → Inventory decrementato (optimistic concurrency, 3 retry)
                 Customer upsert in DB
                 Email: admin alert + customer receipt + warehouse notice
                 SMS: warehouse notification (ClickSend)
                 Low stock alert se <20 unità

5. FULFILLMENT → Admin seleziona carrier + tracking number + shipping cost
                 Status → "shipped"
                 Email + SMS customer con tracking link

6. TRACKING    → 17Track API registra tracking number
                 Cron job daily controlla status
                 Auto-update "delivered" quando confermato

7. DELIVERY    → Customer vede status nel portal
                 Order completato
```

**Status possibili**: `pending → paid → processing → shipped → delivered`
Alternative: `cancelled`, `expired` (24h timeout), `refunded`, `partially_refunded`

---

## Stack & Dependencies

| Tech | Versione | Scopo |
|------|----------|-------|
| Next.js | 16.1.6 | Framework (App Router, Turbopack) |
| React | 19.2.3 | UI library |
| Tailwind CSS | 4 | Styling (@theme block, postcss) |
| next-intl | 4.8.3 | i18n (10 locales, RTL Arabic) |
| Framer Motion | 12.34.2 | Animazioni |
| Lucide React | 0.575.0 | Icone |
| Supabase JS | 2.97.0 | Database + Auth |
| Resend | 6.9.2 | Email transazionali |
| Zod | 4.3.6 | Validazione input |
| qrcode.react | 4.2.0 | QR code per pagamenti |
| uuid | 13.0.0 | Generazione ID |
| clsx + tailwind-merge | — | Utility CSS |

---

## i18n

- **10 locales**: en (default), it, fr, de, es, pt, pl, ru, uk, ar
- **Routing**: `src/i18n/routing.ts` — `localePrefix: 'as-needed'` (en senza prefisso)
- **Traduzioni**: `messages/{locale}.json` — tutto sotto namespace `"Index"`
- **Arabic (ar)**: RTL gestito in root layout `dir` attribute
- **Ukrainian**: mappato come `uk-UA` nelle hreflang tags
- **SEO keys per locale**: keyword transazionali (buy/kaufen/acheter/comprare/comprar/kupić/купить)

---

## Design System

**Palette colori** (definiti in `src/app/globals.css` @theme):
- `brand-void`: `#0A0F16` — background principale (near-black)
- `brand-gold`: `#D4AF37` — accent primario (premium gold)
- `brand-gold-light`: `#F5D061` — gold chiaro per hover
- `brand-cyan`: `#00E5FF` — accent secondario (poco usato)
- `brand-glass`: `rgba(20, 30, 45, 0.6)` — pannelli semi-trasparenti

**Tipografia**: Geist Sans (Google Font), pesi: 200-600

**Utility CSS custom**:
- `.glass-panel` — glassmorphism: `bg-brand-glass backdrop-blur-md border border-white/10 rounded-2xl`
- `.gold-glow` — `box-shadow: 0 0 20px rgba(212, 175, 55, 0.3)`
- `.text-gradient-gold` — gradiente text da gold a gold-light
- `@keyframes shimmer` — effetto shine sui bottoni

**Pattern ricorrenti**: `bg-brand-void`, `text-white/50`, `border-white/10`, `rounded-2xl`, Framer Motion `whileInView`

---

## UI Components

| Componente | Path | Scopo |
|-----------|------|-------|
| PremiumButton | `src/components/ui/` | Bottone con 3 varianti (primary/secondary/outline), shimmer hover |
| LanguageSwitcher | `src/components/ui/` | Selettore 10 lingue, gold per attiva |
| LiveInventoryBadge | `src/components/ui/` | Stock counter rosso (47→12), decrementa ogni 45s |
| RecentSalesPopup | `src/components/ui/` | Notifica acquisto recente (bottom-left), nome/città random |
| PortalForm | `src/components/ui/` | Form tracking ordine (email + reference ID) con status pipeline |
| CheckoutPoller | `src/components/ui/` | Polling background (10s) per status checkout |
| HomeStructuredData | `src/components/seo/` | JSON-LD: Organization, Product, FAQPage, BreadcrumbList |
| CalculatorStructuredData | `src/components/seo/` | JSON-LD: WebApplication, HowTo, BreadcrumbList |
| CryptoGuideStructuredData | `src/components/seo/` | JSON-LD: HowTo, FAQPage, BreadcrumbList |
| OrderStructuredData | `src/components/seo/` | JSON-LD: BreadcrumbList |
| JsonLd | `src/components/seo/` | Componente generico JSON-LD wrapper |

---

## Landing Page Sections (in ordine)

1. **Header/Nav** — Logo "RETATRUTIDE", nav links (Science, Lab, Order), LanguageSwitcher, Portal CTA
2. **Hero** — Badge "Premium Quality", heading con gradiente, LiveInventoryBadge, CTA "Secure Your Vial", prezzo "Starting at 97€", trust elements (shipping timeline, COA link, sterility/HPLC), vial image con purity badge
3. **Features** (#science) — 3 card: Premium Quality, Crypto Checkout (gold highlighted), Next-Day Shipping
4. **Trust Ticker** — Scrolling infinito: 99.8% HPLC, Lab Verified, Stealth Packaging, 2-day Guarantee
5. **Quality Pipeline** (#quality) — 5 step: Source → Extract → Synthesize → Test → Verify + View COA button
6. **Testimonials** (#testimonials) — 3 review cards con 5 stelle, "Verified Buyer" badge
7. **Why Aura** — 2×2 grid, 4 benefit cards numerati
8. **Product Specs** — Tabella 6 righe: Format, Purity, Storage, Reconstituted, Solvent, CAS (2381089-83-2)
9. **Calculator CTA** — Link alla pagina calculator
10. **Buyer Protection** — 3 garanzie: Secure payment, EU shipping, Satisfaction guarantee
11. **FAQ** (#faq) — 2 categorie expand/collapse: Ordering & Payment (6 Q), Policy & Legal (3 Q)
12. **Footer** — Logo, office info, disclaimer legale, copyright, language switcher
13. **Modali** — COA image viewer + download, RecentSalesPopup auto-trigger

---

## Pagine Secondarie

### Calculator (`/calculator`)
- Calcolatore dosaggio peptide per ricostituzione
- Input: peptide amount (mg), water amount (ml), desired dose (mcg)
- Preset rapidi: 250, 500, 750, 1000, 1250, 1500, 1750, 2000 mcg
- Output: siringa visuale animata con livello fill (gold/red overflow), unità da prelevare (IU), volume (ml)
- Selettore siringa: 0.3ml (30u), 0.5ml (50u), 1.0ml (100u)

### Crypto Guide (`/crypto-guide`)
- Guida educativa per pagamenti crypto
- 3 benefit: no restrizioni, privacy, velocità
- 2-step: invia fondi + converti via ChangeHero (link locale-specific)
- 3 info card: no KYC, no wallet setup, usa il tuo wallet
- 3 FAQ expandable + amount warning

### Order (`/order`)
- Form completo: shipping info + quantità + selezione crypto
- Volume discount live, Google Places autocomplete
- Phone country code auto-select per paese

### Portal (`/portal`)
- Lookup ordine: email + reference ID
- Status tracker 5 fasi con progress bar animata
- Dettagli ordine: date, amounts, crypto info, items
- Info spedizione: carrier, tracking number (copiabile)

---

## Admin Dashboard

**Accesso**: `/[locale]/admin/` — protetto da Supabase auth (login email + password)
**Noindex**: X-Robots-Tag header in next.config.ts

### RBAC (4 ruoli)

| Ruolo | Dashboard | Orders | Inventory | Customers | Team | Settings |
|-------|-----------|--------|-----------|-----------|------|----------|
| super_admin | ✅ | ✅ full | ✅ full | ✅ | ✅ full | ✅ |
| manager | ✅ | ✅ full | ✅ full | ✅ | ✅ invite seller | ❌ |
| seller | ❌ | ✅ own orders | ❌ | ❌ | ❌ | ❌ |
| warehouse | ❌ | ✅ view + ship | ✅ add only | ❌ | ❌ | ❌ |

### 6 Tab

1. **Dashboard** — KPI: revenue (today/week/month), total orders, orders to ship, current stock, customers, avg order value, shipping costs
2. **Orders** — Filtro per status, search, dettagli ordine, fulfill (carrier + tracking + shipping cost), refund
3. **Inventory** — Stock corrente RET-KIT-1, add/remove stock, cronologia movimenti
4. **Customers** — LTV metrics, lista clienti, dettaglio con ordini, repeat purchase rate
5. **Team** — Invita membri, assegna ruoli, rimuovi accesso, workflow approvazione rimozione
6. **Settings** — Nome store, email, soglia low stock, carriers disponibili (BRT, GLS, SDA, DHL, UPS, POSTE, FEDEX)

---

## API Routes (17 totali)

### Admin Routes (autenticati)

| Route | Method | Auth | Scopo |
|-------|--------|------|-------|
| `/api/admin/dashboard` | GET | manager+ | KPI e metriche dashboard |
| `/api/admin/orders` | GET/POST | seller+ | Lista/dettaglio ordini, update status, fulfill |
| `/api/admin/inventory` | GET/POST | warehouse+ | Stock, movimenti inventario, add/remove |
| `/api/admin/customers` | GET | manager+ | Lista clienti con LTV, dettaglio + ordini |
| `/api/admin/manual-order` | POST | seller+ | Creazione ordine manuale |
| `/api/admin/refund` | POST | manager+ | Rimborso totale/parziale + ripristino inventario |
| `/api/admin/team` | GET/POST | varia | Gestione team: invite, revoke, set-role |
| `/api/admin/settings` | GET/POST | super_admin | Impostazioni store (key-value) |
| `/api/admin/tracking` | GET | warehouse+ | Lookup tracking da 17Track API |

### Public Routes

| Route | Method | Auth | Scopo |
|-------|--------|------|-------|
| `/api/checkout` | POST | None (rate limited) | Crea ordine + genera indirizzo crypto |
| `/api/checkout/status` | GET | None | Poll status ordine (per CheckoutPoller) |
| `/api/portal` | GET | None | Lookup ordine cliente (email + reference_id) |
| `/api/c/[code]` | GET | None | Redirect short link + incrementa click |
| `/api/short-link` | GET/POST | seller+ (POST) | Crea short link per marketing |

### Webhooks & Cron

| Route | Method | Auth | Scopo |
|-------|--------|------|-------|
| `/api/webhooks/cryptapi` | GET | WEBHOOK_SECRET | Conferma pagamento crypto |
| `/api/cron/check-tracking` | GET | CRON_SECRET | Daily: aggiorna tracking spedizioni |
| `/api/cron/expire-orders` | GET | CRON_SECRET | Daily 3AM UTC: scade ordini pending >24h |

---

## Database Schema (Supabase PostgreSQL)

### Tabelle

**`orders`** — Ordini
- `id` UUID PK, `reference_id` VARCHAR UNIQUE, `order_number` TEXT UNIQUE
- `status`: pending | paid | processing | shipped | delivered | cancelled | refunded | partially_refunded
- `crypto_currency`, `crypto_amount` DECIMAL, `fiat_amount` DECIMAL (EUR)
- `email`, `shipping_address` JSONB (full_name, address, city, postal_code, country, phone)
- `items` JSONB (array di {sku, name, quantity, price})
- `payment_url`, `tracking_number`, `carrier`, `shipping_cost`
- `shipped_at`, `shipped_by` FK → auth.users
- `tracking_status`, `tracking_events` JSONB
- `sent_by` FK → auth.users (seller ref per ordini manuali)
- Indexes: reference_id, status, created_at, order_number, sent_by

**`customers`** — Clienti (upsert automatico)
- `id` UUID PK, `email` TEXT UNIQUE, `full_name`, `phone`

**`inventory`** — Stock prodotti
- `sku` VARCHAR UNIQUE ('RET-KIT-1'), `quantity` INT, `reorder_level` INT (default 50)

**`inventory_movements`** — Cronologia movimenti
- `type`: add | remove | edit | sale | refund
- `quantity`, `previous_quantity`, `new_quantity`, `reason`
- `performed_by` FK, `performed_by_name`, `order_id` FK

**`profiles`** — RBAC utenti
- `id` FK → auth.users, `role`: customer | super_admin | manager | seller | warehouse
- `is_active`, `pending_removal`, `removal_requested_by/at`, `invited_by`

**`store_settings`** — Configurazione store (key-value)
- `key` TEXT PK, `value` JSONB, `updated_by` FK

**`short_links`** — URL shortener
- `code` TEXT UNIQUE (7 chars), `target_url`, `clicks` INT, `created_by` FK

### RPCs
- `get_customer_ltv(search, limit, offset, sort)` — Clienti con metriche LTV
- `get_ltv_aggregates()` — Metriche aggregate (total customers, avg LTV, repeat rate)

### RLS
- Orders: service_role full; staff select/update; anyone insert (checkout)
- Inventory: all read; staff update
- Customers: staff read; service_role full
- Profiles: users read own; staff read all; super_admin manage

---

## Integrazioni Third-Party

| Servizio | Scopo | Env Var |
|----------|-------|---------|
| CryptAPI | Payment gateway crypto | Wallet vars (`CRYPTAPI_*_WALLET`) |
| Supabase | Database + Auth | `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` |
| Resend | Email transazionali | `RESEND_API_KEY` |
| ClickSend | SMS notifiche | `CLICKSEND_USERNAME`, `CLICKSEND_API_KEY` |
| Google Places | Address autocomplete | `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` |
| 17Track | Tracking spedizioni | `TRACKING_API_KEY_17TRACK` |
| Vercel | Hosting + CI/CD | Auto-deploy on push to main |

---

## Email System (6 template)

Tutti definiti in `src/lib/email-templates.ts`. Design: dark theme, gold accent (#D4AF37), HTML responsive.
From: `Aura Peptides <noreply@aurapep.eu>` — Reply-to: `support@aurapeptides.eu`

1. **Admin Order Alert** — "🚨 NUOVO ORDINE PAGATO: {ID} — €{amount}" → admin@aurapeptides.eu
2. **Customer Confirmation** — Ricevuta ordine con reference number → customer email
3. **Shipment Notification** — "📦 Il tuo ordine è stato spedito!" + tracking link → customer
4. **Low Stock Alert** — Stock sotto 20 unità → admin
5. **Warehouse Notice** — Dettagli ordine per fulfillment → warehouse staff
6. **Refund Confirmation** — Conferma rimborso con importo → customer

---

## Lib Utilities

| File | Scopo |
|------|-------|
| `src/lib/seo.ts` | `getAlternateLanguages()`, `getCanonicalUrl()`, `buildPageMetadata()` |
| `src/lib/auth.ts` | `verifyAuth(req)` JWT validation, `requireRole()` RBAC check |
| `src/lib/supabase.ts` | Browser/public Supabase client |
| `src/lib/supabase-admin.ts` | Server-side admin client (lazy singleton, service role) |
| `src/lib/supabase-browser.ts` | Client component auth client con session refresh |
| `src/lib/email-templates.ts` | 6 HTML email template brandizzati |
| `src/lib/clicksend.ts` | SMS via ClickSend REST API con retry esponenziale |
| `src/lib/tracking.ts` | 17Track integration: register, get status, save to order |
| `src/lib/order-number.ts` | Generazione order number random (4-6 chars alfanumerici) |

---

## Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://ihjxbrjtcuyfiuulczlc.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key>
SUPABASE_SERVICE_ROLE_KEY=<service role key>

# Crypto Wallets
CRYPTAPI_BTC_WALLET=bc1qcwpmw65ucscvgstppgty03n4xufmsztvr6mx3j
CRYPTAPI_ETH_WALLET=0x0605C80Fc5bB9e65264bD562B528b1f3cB3432C0
CRYPTAPI_XMR_WALLET=44AFFq5kSiGBoZ4NMDwYtN18obc8AemS33DBLWs3H7otXft3XjrpDtQGv7SqSsaBYBb98uNbr2VBBEt7f2wfn3RVGQBEP3A
CRYPTAPI_SOL_WALLET=5fmrMg776oUFyX71Yi9qzqcwPcEU3AvaL7e6nUK8kQaR
CRYPTAPI_USDT_TRC20_WALLET=TUjXYc8uJ85FGJs2QCqv9Co5SV9bFhebdC
CRYPTAPI_USDC_WALLET=0x0605C80Fc5bB9e65264bD562B528b1f3cB3432C0
CRYPTAPI_XRP_WALLET=<non configurato>

# Email & SMS
RESEND_API_KEY=<resend api key>
RESEND_FROM_EMAIL=Aura Peptides <noreply@aurapep.eu>
ADMIN_NOTIFICATION_EMAIL=admin@aurapeptides.eu
CLICKSEND_USERNAME=<clicksend username>
CLICKSEND_API_KEY=<clicksend api key>

# Tracking
TRACKING_API_KEY_17TRACK=<17track api key>

# APIs
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=<google maps key>

# Security
WEBHOOK_SECRET=<uuid per CryptAPI callbacks>
CRON_SECRET=<uuid per scheduled jobs>

# Site
NEXT_PUBLIC_SITE_URL=https://aurapep.eu
```

---

## Project Structure

```
src/
├── app/
│   ├── [locale]/
│   │   ├── layout.tsx              # Root metadata + generateMetadata()
│   │   ├── page.tsx                # Landing page (use client)
│   │   ├── admin/
│   │   │   ├── layout.tsx          # Auth guard + admin shell (use client)
│   │   │   └── page.tsx            # Dashboard 6-tab (use client)
│   │   ├── calculator/
│   │   │   ├── layout.tsx          # SEO metadata
│   │   │   └── page.tsx            # Dosage calculator (use client)
│   │   ├── checkout/[id]/
│   │   │   └── page.tsx            # Payment page con QR (use client)
│   │   ├── crypto-guide/
│   │   │   ├── layout.tsx          # SEO metadata
│   │   │   └── page.tsx            # Crypto guide (use client)
│   │   ├── order/
│   │   │   ├── layout.tsx          # SEO metadata
│   │   │   └── page.tsx            # Order form (use client)
│   │   └── portal/
│   │       ├── layout.tsx          # SEO metadata
│   │       └── page.tsx            # Order tracking (server component)
│   ├── api/
│   │   ├── admin/                  # 9 admin API routes
│   │   ├── checkout/               # Checkout + status polling
│   │   ├── c/[code]/               # Short link redirect
│   │   ├── cron/                   # 2 scheduled jobs
│   │   ├── portal/                 # Customer order lookup
│   │   ├── short-link/             # URL shortener
│   │   └── webhooks/cryptapi/      # Payment webhook
│   ├── robots.ts                   # Dynamic robots.txt
│   └── sitemap.ts                  # Dynamic sitemap (50 URLs)
├── components/
│   ├── seo/                        # 5 JSON-LD structured data components
│   └── ui/                         # 6 UI components
├── lib/
│   ├── auth.ts                     # JWT verification + RBAC
│   ├── seo.ts                      # SEO utilities
│   ├── email-templates.ts          # 6 email template
│   ├── clicksend.ts                # SMS integration
│   ├── tracking.ts                 # 17Track integration
│   ├── order-number.ts             # Order ID generation
│   ├── supabase.ts                 # Public client
│   ├── supabase-admin.ts           # Server admin client
│   └── supabase-browser.ts         # Browser auth client
└── i18n/
    ├── routing.ts                  # Locale config (10 locales)
    └── request.ts                  # Message loader
messages/                           # 10 × {locale}.json
public/
├── images/                         # Product images (vials, hero)
└── assets/                         # Janoshik COA report
supabase/migrations/                # 4 SQL migration files
```

---

## SEO Architecture

- `src/lib/seo.ts` → `buildPageMetadata()` con `title: { absolute: title }`
- Root layout: `generateMetadata()` con title template `%s | Aura Peptides`
- Child routes: `layout.tsx` wrapper esporta `generateMetadata()` (pages sono "use client")
- Structured data: componenti client in `src/components/seo/` con `<script type="application/ld+json">`
- Translation keys SEO: pattern `seo_{page}_{field}` (4 chiavi per pagina × 5 pagine × 10 locales = 200 keys)
- robots.ts: block /admin/, /api/, /checkout/ + sitemap URL
- sitemap.ts: 50 URLs con hreflang cross-references e priority hierarchy

---

## Recently Completed

- [2026-02-22] **Mobile UX Sitewide Audit & Fix**: Risoluzione bug di overflow orizzontale critico su `order`, `home` e `calculator` trasformando il `LanguageSwitcher` in un Dropdown Menu responsivo. Aumentata la Tap Area (min-h-48px) dei bottoni di conversione sul calcolatore peptidi e maggiorato il `px-6` sulle fasce Sticky bottom (`order/page.tsx`). 
- [2026-02-22] Mobile Conversion Rate Optimization: UX Checkout in `order/page.tsx` (form autofill group, sticky toolbar, large tap targets, payment trust signals)
- [2026-02-22] Prototipazione Label "Triple G" (Design 2D completato e in attesa di file print/HTML finale)
- [2026-02-22] SEO full implementation (metadata, structured data, sitemap, robots, hreflang, 200 translation keys)
- [2026-02-22] CLAUDE.md + PROJECT_STATUS.md creati

## In Progress

- Task UX Mobile conclusi con successo totale. Nessun bug appeso al momento. Il ramo d'esecuzione attuale è pronto per aggredire gli step di "TODO / Planned".

## TODO / Planned

- [ ] **CRITICO**: `BASE_PRICE = 12` → `197` in `src/app/[locale]/order/page.tsx:10`
- [ ] Configurare wallet XRP (attualmente placeholder)
- [ ] Commit e push di CLAUDE.md, PROJECT_STATUS.md, addShipKeys.js
- [ ] Valutare ottimizzazioni SEO aggiuntive (content marketing, blog, backlinks)

---

## Do NOT Touch (senza coordinamento)

- `src/lib/seo.ts` — utility condivisa da tutti i layout
- `src/app/[locale]/layout.tsx` — root metadata, hreflang, title template
- `src/i18n/routing.ts` — lista locales usata da sitemap, seo.ts, middleware
- `messages/en.json` — template di riferimento per tutte le altre lingue
- `next.config.ts` — headers X-Robots-Tag, next-intl plugin
- `src/lib/auth.ts` — autenticazione e RBAC per tutte le API admin
- `src/app/api/webhooks/cryptapi/` — webhook pagamenti, errori = ordini persi

## Conventions

- Commit: `feat:`, `fix:`, `refactor:`, `docs:`
- SEO title < 60 chars, description 120-160 chars
- Nuova pagina pubblica → layout.tsx + structured data + 10 message files + sitemap entry
- Tailwind 4 @theme block per colori custom, `.glass-panel` per card
- Admin UI in italiano (hardcoded), public pages internazionalizzate
