# Project Status — aurapep.eu

> **File condiviso tra Claude Code e Gemini.** Leggere SEMPRE prima di lavorare sul progetto.
> Aggiornare dopo ogni modifica significativa.

---

## Current State

- **Last deploy**: 2026-02-25 (commit `03f4afa`)
- **Branch**: main (up to date with origin/main)
- **Build**: 81 static pages + 19 API routes, zero errors
- **Sitemap**: 50 URLs (5 pages × 10 locales) con hreflang cross-references
- **Domain**: aurapep.eu (Vercel, auto-deploy on push to main)
- **Untracked files**: `addShipKeys.js`

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

**Prezzo base**: €197 per kit (`BASE_PRICE = 12` in `src/app/[locale]/order/page.tsx:10` per testing — ripristinare a 197 per produzione)

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
3. Email immediata al customer con indirizzo, importo crypto, link checkout e istruzioni
4. QR code + indirizzo mostrati nella checkout page
5. Customer invia crypto → CryptAPI webhook conferma → ordine → "paid"
6. Buffer volatilità 1% aggiunto automaticamente
7. Se non paga: email recovery a 1h, 12h, 48h. Dopo 72h → status "expired"
8. Pagamenti in ritardo su ordini expired vengono comunque accettati

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
Alternative: `cancelled`, `expired` (72h timeout, pagamenti tardivi riaccettati), `refunded`, `partially_refunded`, `underpaid`

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
- Step indicator "1 di 2" sopra titolo
- Form completo: shipping info (Contatto + Destinazione) + quantità + selezione crypto
- Volume discount live, Google Places autocomplete
- Phone country code auto-select per paese
- Card "No crypto?" prominente dopo prezzo totale
- Crypto selector semplificato (USDT prima, nomi brevi), Why Crypto in accordion
- Trust signals tradotti sotto CTA + idempotenza check ordini pending

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
| `/api/checkout/pending` | GET | None | Idempotenza: cerca ordini pending per email (ultimi 72h) |
| `/api/checkout/status` | GET | None | Poll status ordine (per CheckoutPoller) |
| `/api/portal` | GET | None | Lookup ordine cliente (email + reference_id) |
| `/api/c/[code]` | GET | None | Redirect short link + incrementa click |
| `/api/short-link` | GET/POST | seller+ (POST) | Crea short link per marketing |

### Webhooks & Cron

| Route | Method | Auth | Scopo |
|-------|--------|------|-------|
| `/api/webhooks/cryptapi` | GET | WEBHOOK_SECRET | Conferma pagamento crypto (accetta anche expired) |
| `/api/cron/check-tracking` | GET | CRON_SECRET | Daily: aggiorna tracking spedizioni |
| `/api/cron/expire-orders` | GET | CRON_SECRET | Daily 3AM UTC: scade ordini pending >72h |
| `/api/cron/cart-recovery` | GET | CRON_SECRET | Hourly: invia email recovery (1h, 12h, 48h) a ordini pending |

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

## Email System (9 template)

Tutti definiti in `src/lib/email-templates.ts`. Design: dark theme, gold accent (#D4AF37), HTML responsive.
From: `Aura Peptides <noreply@aurapep.eu>` — Reply-to: `support@aurapeptides.eu`

1. **Order Created** — Email immediata alla creazione ordine con indirizzo crypto, importo, link checkout e istruzioni → customer email
2. **Admin Order Alert** — "🚨 NUOVO ORDINE PAGATO: {ID} — €{amount}" → admin@aurapeptides.eu
3. **Customer Confirmation** — Ricevuta ordine post-pagamento con reference number → customer email
4. **Shipment Notification** — "📦 Il tuo ordine è stato spedito!" + tracking link → customer
5. **Low Stock Alert** — Stock sotto 20 unità → admin
6. **Warehouse Notice** — Dettagli ordine per fulfillment → warehouse staff
7. **Refund Confirmation** — Conferma rimborso con importo → customer
8. **Underpaid Alert** — Pagamento incompleto con confronto importi → admin
9. **Cart Recovery** — 3 varianti (1h/12h/48h) con urgenza crescente, indirizzo crypto + link checkout → customer

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

- [2026-02-25] **72h order lifecycle + instant payment email + cart recovery** (commit `03f4afa`):
  - Ordini pending ora validi 72h (era 24h) — expire-orders cron + checkout/pending cutoff aggiornati
  - Email immediata alla creazione ordine con indirizzo crypto, importo, link checkout e istruzioni ChangeHero
  - Cart recovery cron (hourly): 3 email a 1h/12h/48h con urgenza crescente per ordini non pagati
  - Webhook accetta pagamenti su ordini expired (li riattiva automaticamente)
  - Admin: filtro "Scaduti" + badge nel tab ordini
  - Migration `06_cart_recovery.sql`: colonne `recovery_emails_sent` + `last_recovery_email_at`
  - 3 nuovi template email: Order Created, Cart Recovery (3 varianti), Underpaid Alert
- [2026-02-25] **Lead capture + security audit + social proof** (commit `beca08e`):
  - Progressive lead capture: `/api/leads` POST endpoint, onBlur handlers su form ordine
  - Security: timing-safe webhook secret, atomic status update, inventory failure alert, email XSS escaping
  - RecentSalesPopup: geo-aware (15 città per locale), privacy-first ("Un ricercatore da {city}")
  - LiveInventoryBadge: real-time timestamp con timezone visitatore, useStock hook condiviso
  - Sticky bar sincronizzata con stock counter via modulo-level singleton
- [2026-02-25] **Tablet layout fix — color bands + hero image** (commit `b6940f4`):
  - `page.tsx`: `bg-black` → `bg-brand-void` (features section); `bg-[#0a0a0a]` → `bg-brand-void` (ticker sections); `from-[#0a0a0a]` → `from-brand-void` (ticker gradients); `bg-brand-gold/5` → `bg-brand-void` (calculator CTA)
  - Hero product image: `h-36` → `h-36 md:h-52` con `md:max-w-md`; badge `self-center` → `self-center md:self-start`
- [2026-02-25] **QR code checkout fix** (commit `d3b55dc`):
  - `checkout/[id]/page.tsx`: rimosso doppio bordo bianco (CSS padding `p-4→p-2` + `includeMargin false`), QR size `180→220`, `rounded-2xl→rounded-xl` — più facile da scansionare
- [2026-02-25] **Crypto-guide senior-friendly copy + Order page UX** (commit `c4c05d0`):
  - Crypto-guide: titolo cambiato a "Come Pagare con Carta in 5 Minuti" pattern su tutte 10 locali; copy ottimizzata per target senior (linguaggio semplice, no gergo crypto)
  - Order page 6 miglioramenti UX: step indicator sopra titolo; label form tradotte ("Contatto"/"Destinazione"); trust signals tradotti sotto CTA; card "No crypto?" spostata dopo prezzo totale; crypto selector semplificato (USDT prima con ✓); Why Crypto collassato in accordion `<details>`
  - `messages` (10 locali): +5 chiavi order page (`order_trust_headline`, `order_trust_subtext`, `order_form_contact`, `order_form_destination`, `order_step_indicator`)
- [2026-02-25] **Order summary fix + underpaid handling** (commit `bd8111e`, `954f461`):
  - Order summary: prezzo barrato prima del prezzo reale, spedizione con label grigia + "0€"
  - Underpaid payment handling: gestione pagamenti parziali crypto
  - Crypto guide: step layout migliorato
- [2026-02-25] **Idempotenza ordini pending + UX checkout polish**:
  - Nuova API `GET /api/checkout/pending?email=...`: cerca ordini `pending` con stessa email nelle ultime 24h
  - `order/page.tsx`: al submit, check idempotenza → se trovato, alert inline ambra con pulsing dot sotto il bottone CTA; bottoni affiancati (sm:flex-row); scroll automatico su mobile; `handleCheckout(skipPendingCheck?: boolean)`
  - `messages` (10 locali): +4 chiavi pending order + aggiornamenti `checkout_address_label`, `checkout_qr_label`, `checkout_detection_note` (con parametro `{crypto}` dinamico)
  - `checkout/[id]/page.tsx`: etichetta Step 2 → "Indirizzo a cui inviare l'importo..."; QR step senza numero 3; sezione status più grande (`text-base px-6 py-3`); spinner più grande; nota corsivo con link portale
  - `CheckoutCountdown`: aggiunto prop `className` per override dimensioni
  - `CheckoutCountdown`: fix hydration mismatch SSR/client (`useState<number|null>(null)` + init in `useEffect`)
  - `CopyAddressButton`: redesign con address display + bottone gigante gold/green
  - Rimozione Janoshik: 10 messages + 2 TSX files
  - Hero mobile spacing: `items-start md:items-center`, `md:min-h-screen`, `gap-5 lg:gap-6`
  - Crypto guide: ChangeHero URL → `/buy/usdt`, Step 2 con callout visivo indirizzo wallet
  - Order page: sezione "WHY CRYPTO" con benefit-focus, card "No crypto?" prominente
- [2026-02-23] **Tablet audit & fix (768px)** (commit `3f32dae`):
  - Nav: `md:px-12` → `md:px-8 lg:px-12` — risolve collisione 673px in 672px (logo+link+right)
  - Nav links: `gap-8` → `gap-6 lg:gap-8` + `whitespace-nowrap` — "ORDER NOW" non si spezza più a 768px
  - Hero subtitle: `lg:line-clamp-none` → `md:line-clamp-none` — testo completo visibile a tablet (non più troncato con "...")
  - Mini shipping timeline: `lg:hidden` → `md:hidden` — elimina duplicato (trust card mostra stessa info a md+)
- [2026-02-22] **Piano 1.2 + 1.4 — Checkout countdown + Hero mobile timeline** (commit `3617079`):
  - `CheckoutCountdown` (nuovo client component): countdown live da `created_at + 24h`; 3 stati colore (bianco→ambra <1h→rosso <15min); tabular-nums per smooth update; si ferma a 0
  - `checkout/[id]/page.tsx`: countdown integrato tra CopyAddressButton e spinner di attesa
  - `page.tsx`: mini shipping timeline mobile-only (`lg:hidden`) sotto LiveInventoryBadge — icona Truck + 3 step `whitespace-nowrap`, truncate sull'ultimo
  - `messages` (10 locali): +3 chiavi countdown (`checkout_valid_for`, `checkout_expires_in`, `checkout_expired_label`)
- [2026-02-22] **CRO Tier 2.2 — Dynamic order counter** (commit `8f5760c`):
  - `/api/recent-activity`: aggiunto `totalOrders` (COUNT parallelo dal DB) nella response e nel cache
  - `page.tsx`: state `orderCount` + useEffect fetch; `trust_earned_sub` usa `{count}` interpolazione con fallback 7496
  - `messages` (10 locali): numero statico → `{count}` placeholder
- [2026-02-22] **CRO & UX Mobile Audit — Tier 2** (commit `67b21f9`):
  - **`/api/recent-activity`** (nuovo file): endpoint che fetcha gli ultimi 8 ordini `paid/shipped/delivered` dal DB Supabase, anonimizza (first name + last initial + city), calcola `timeAgoKey` i18n-compatible, cache 5 min in-memory. Ritorna `[]` su errore → nessun fake fallback (GDPR/EU Directive 2005/29/EC compliant)
  - **`RecentSalesPopup`**: riscritto completamente per usare dati reali. Se API ritorna vuoto, la popup non appare mai. Mobile: `bottom-24` per non sovrapporsi alla sticky bar
  - **`page.tsx` testimonials**: `bg-[#0a0a0a]` → `bg-brand-void` (sezione era invisibile); aggiunti 3 trust micro-badge pill (HPLC ≥99.8% Verified, EU Direct Shipping, Janoshik Tested→apre COA modal); rimosso `<div className="mb-16">` accidentale che causava blank space
  - **i18n**: +1 chiave `trust_badge_view_report` su 10 locali
- [2026-02-22] **CRO & UX Mobile Audit — Tier 0/1/3** (commit `84d845c`):
  - **Tier 0 — Bug critici**: `BASE_PRICE 12 → 197` (revenue fix); rimosso `bg-black`/`bg-[#0a0a0a]` da sezioni "Why Aura", Specs, Footer (erano invisibili su dark theme); `bg-[#050505]` → `bg-brand-void` nel footer; PortalForm input contrast fix; sticky bar landing redesign con 197€ + stock urgency
  - **Tier 1 — Conversion friction**: FAQ `max-h-60` → `max-h-[800px]`; order sticky bar mobile con crypto selector inline + discount badge; checkout gestione `expired`/`cancelled` con pagina dedicata e CTA "Crea nuovo ordine"; nuovo componente `CopyAddressButton` con clipboard API + fallback mobile; `LiveInventoryBadge` timestamp rimosso
  - **Tier 3 — Polish**: `whileInView viewport` aggiornato a `amount: 0.05` su 5 motion.div; hero subtitle `line-clamp-2` → `line-clamp-3`; calculator CTA "Ordina il tuo Kit →" dopo risultati
  - **i18n**: +8 chiavi checkout (expired/cancelled/copy) + 2 chiavi calculator (10 lingue ciascuna)
  - **Nuovo file**: `src/components/ui/CopyAddressButton.tsx`
- [2026-02-22] **2° round fix mobile da device reale** (commit `153e6a6`, `0a0e765`):
  - `page.tsx`: nav più sottile (py-2 mobile/py-4 desktop), logo `whitespace-nowrap`, "Portale Clienti" → icona `User` circolare
  - Hero badge su una riga (`whitespace-nowrap`), hero `pt-20` mobile
  - Shipping card timeline: `flex-wrap` invece di `overflow-x-auto`
  - `LiveInventoryBadge`: layout compatto su una riga, rimosso timestamp
  - `calculator/page.tsx`: redesign above-fold — sezioni 1+2 fuse, inputs sempre grid-cols-2, siringa visibile anche su mobile (h-10 mobile/h-16 desktop)
  - `order/page.tsx`: `overflow-x-hidden` su main → eliminato scroll orizzontale
- [2026-02-22] **Mobile UX Sitewide Audit & Fix (1° round)**: 13 fix tra bug, touch targets, sticky bar, language dropdown, spec table layout
- [2026-02-22] Mobile Conversion Rate Optimization: UX Checkout in `order/page.tsx`
- [2026-02-22] SEO full implementation (metadata, structured data, sitemap, robots, hreflang, 200 translation keys)
- [2026-02-22] CLAUDE.md + PROJECT_STATUS.md creati

## In Progress

- **Test pagamento**: BASE_PRICE = 10€ in `order/page.tsx:11` e `checkout/route.ts:110` — **RIPRISTINARE A 197 dopo test**
- **Migration da eseguire**: `06_cart_recovery.sql` su Supabase (aggiunge colonne recovery email tracking)
- **Migration da eseguire**: `05_leads_table.sql` su Supabase (tabella leads per progressive capture)

## TODO / Planned

- [ ] Configurare wallet XRP (attualmente placeholder `CRYPTAPI_XRP_WALLET`)
- [ ] Valutare ottimizzazioni SEO aggiuntive (content marketing, blog, backlinks)
- [ ] **Ripristinare BASE_PRICE a 197** dopo test pagamento (order/page.tsx:11 + checkout/route.ts:110)

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
