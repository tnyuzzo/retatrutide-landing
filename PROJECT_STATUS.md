# Project Status — aurapep.eu

> **File condiviso tra Claude Code e Gemini.** Leggere SEMPRE prima di lavorare sul progetto.
> Aggiornare dopo ogni modifica significativa.

---

## Current State

- **Last deploy**: 2026-02-26 (commit `5532602`)
- **Branch**: main (up to date with origin/main)
- **Build**: 84 static pages + 21 API routes, zero errors
- **Analytics**: Microsoft Clarity (`vn1xc3jub1`) session replay + heatmaps; PostHog eventi custom (session replay OFF); Sentry error tracking (`aurapep-eu` su EU server, org `neurosoft-af`)
- **IndexNow**: configurato e inviato (50 URL → Bing/Yandex/Seznam/Naver)
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
| OrderStructuredData | `src/components/seo/` | JSON-LD: Product, AggregateOffer (6 tier), BreadcrumbList |
| PortalStructuredData | `src/components/seo/` | JSON-LD: WebApplication, BreadcrumbList |
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
2. **Orders** — Filtro per status/data/search, order detail drawer (click su riga), modali Ship/Refund/Cancel, paginazione (20/pagina), mobile card layout, CSV export (super_admin), status timeline, tracking events
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
| `/api/indexnow` | GET | CRON_SECRET | Ping IndexNow con tutte le 50 URL (Bing/Yandex/Seznam/Naver) |

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
| Microsoft Clarity | Session recording + heatmaps + custom tags | Project ID `vn1xc3jub1` (script in layout) |
| PostHog | Eventi custom (funnel, conversioni). Session replay OFF | `NEXT_PUBLIC_POSTHOG_KEY` |
| Sentry | Error tracking + performance (20% traces) | `NEXT_PUBLIC_SENTRY_DSN` (EU server, org `neurosoft-af`, project `aurapep-eu`) |
| IndexNow | Instant search engine notification | Key `c85e4148...` (file in /public/) |
| Google Search Console | SEO monitoring + sitemap | Verificato via Cloudflare DNS |

---

## Email System (9 template — 5 multilingua)

Tutti definiti in `src/lib/email-templates.ts`. Design: dark theme, gold accent (#D4AF37), HTML responsive.
From: `Aura Peptides <noreply@aurapep.eu>` — Reply-to: `support@aurapeptides.eu`
Traduzioni email: `src/lib/email-translations.ts` — ~50 chiavi × 10 lingue, helper `getEmailString(locale, key, vars?)`

**Customer-facing (multilingua, locale da ordine):**
1. **Order Created** — Email immediata alla creazione ordine con indirizzo crypto, importo, link checkout e istruzioni → customer email
2. **Customer Confirmation** — Ricevuta ordine post-pagamento con reference number → customer email
3. **Shipment Notification** — Ordine spedito + tracking link → customer
4. **Refund Confirmation** — Conferma rimborso con importo → customer
5. **Cart Recovery** — 3 varianti (1h/12h/48h) con urgenza crescente → customer

**Admin/Warehouse (italiano, non tradotte):**
6. **Admin Order Alert** — Notifica nuovo ordine pagato → admin@aurapeptides.eu
7. **Low Stock Alert** — Stock sotto 20 unità → admin
8. **Warehouse Notice** — Dettagli ordine per fulfillment → warehouse staff
9. **Underpaid Alert** — Pagamento incompleto con confronto importi → admin

---

## Lib Utilities

| File | Scopo |
|------|-------|
| `src/lib/seo.ts` | `getAlternateLanguages()`, `getCanonicalUrl()`, `buildPageMetadata()` |
| `src/lib/auth.ts` | `verifyAuth(req)` JWT validation, `requireRole()` RBAC check |
| `src/lib/supabase.ts` | Browser/public Supabase client |
| `src/lib/supabase-admin.ts` | Server-side admin client (lazy singleton, service role) |
| `src/lib/supabase-browser.ts` | Client component auth client con session refresh |
| `src/lib/email-templates.ts` | 9 HTML email template (5 multilingua + 4 admin italiano) |
| `src/lib/email-translations.ts` | Dizionario traduzioni email (~50 chiavi × 10 lingue) + `getEmailString()` |
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

- [2026-03-01] **Analytics & Error tracking setup**:
  - **Sentry**: progetto `aurapep-eu` creato (EU server, org `neurosoft-af`), SDK `@sentry/nextjs@10.40.0` installato e configurato (client/server/edge + instrumentation + global-error), traces 20%, session replay OFF, DSN su Vercel
  - **Clarity custom tags**: 7 tag aggiunti (cta_clicked, faq_opened, crypto_selected, order_submitted, checkout_viewed, payment_confirmed, crypto/country) per filtrare sessioni nel replay
  - **PostHog**: verificato session recording OFF via API (`session_recording_opt_in: false`), mantenuto per eventi custom
  - File creati: `sentry.client.config.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts`, `src/instrumentation.ts`, `src/app/global-error.tsx`
  - File modificati: `next.config.ts` (withSentryConfig), `page.tsx` + `order/page.tsx` + `CheckoutTracker.tsx` (Clarity tags)
- [2026-02-27] **GLP-1 Journal — Fix internal linking: orfani, underlinked, TRIPLE-G** (`glp1-journal/`):
  - **TASK 1**: Risolti 4 articoli orfani (0 link in ingresso) aggiungendo 3 link ciascuno:
    - `calcolatore-dosaggio-peptidi-perche-serve`: link aggiunti da calcolo-dosaggio-peptidi, come-ricostituire-peptidi, guida-siringhe-peptidi
    - `cibi-evitare-preferire-protocollo-glp1`: link aggiunti da proteine-peptidi-glp1-alleato, carenze-nutrizionali-glp1-prevenzione, integratori-protocollo-glp1-guida
    - `food-noise-voce-che-dice-mangiare`: link aggiunti da food-noise-cos-e-come-spegnerlo, perche-diete-falliscono, metabolismo-come-funziona-blocca
    - `peptidi-dimagranti-news-2026`: link aggiunti da futuro-peptidi-anti-obesita, migliori-peptidi-perdita-peso-2026, cos-e-il-retatrutide
  - **TASK 2**: Portati a 5+ link in uscita 3 articoli underlinked:
    - `carenze-nutrizionali-glp1-prevenzione`: +2 link (cibi-evitare-preferire, cos-e-il-retatrutide)
    - `integratori-protocollo-glp1-guida`: +2 link (cibi-evitare-preferire, conservazione-peptidi)
    - `mounjaro-tirzepatide-guida-completa`: +2 link (effetti-collaterali-glp1, semaglutide-vs-tirzepatide-vs-retatrutide)
  - **TASK 3**: Aggiunte 4 menzioni TRIPLE-G a `cibi-evitare-preferire-protocollo-glp1.mdx` (prima menzione con spiegazione completa, successive con nome breve)
  - Totale: 12 articoli modificati, 18 nuovi link interni aggiunti
- [2026-02-27] **GLP-1 Journal — UTM tracking + CTA editoriali su tutti i 44 articoli IT** (`glp1-journal/`):
  - **TASK 1**: Aggiunto UTM parameters (`utm_source=glp1journal&utm_medium=content&utm_campaign={translationKey}`) ai 7 articoli che avevano link aurapep.eu senza tracking: confronto-peptidi-dimagranti, faq-peptidi-dimagranti, metabolismo-come-funziona-blocca, mounjaro-tirzepatide-guida-completa, ozempic-semaglutide-guida-completa, peptidi-glp1-benefici-oltre-peso, retatrutide-triple-g-guida-completa
  - **TASK 2**: Aggiunta CTA editoriale con link aurapep.eu + UTM a 9 articoli che non ne avevano alcuna: come-dimagrire-guida-definitiva, dimagrire-donna-guida-completa, dimagrire-uomo-guida-completa, food-noise-cos-e-come-spegnerlo, food-noise-voce-che-dice-mangiare, peptidi-dimagranti-news-2026, perche-diete-falliscono, perche-non-riesco-dimagrire-non-colpa-tua, stile-vita-dimagrimento-abitudini
  - Tutti i 44 articoli IT ora hanno almeno 1 link aurapep.eu con UTM tracking completo
  - CTA posizionate nella parte finale degli articoli (mai nel primo 30%), tono editoriale non commerciale
- [2026-02-27] **GLP-1 Journal — Audit SEO completo + 10 nuovi articoli + analisi mercato europeo** (`glp1-journal/`):
  - Importati 9 articoli da blog-engine + 1 nuovo scritto da zero (calcolatore dosaggi)
  - 10 immagini hero generate con Gemini Flash (16:9 editoriale scientifico)
  - Build: **675 pagine** (da 615), zero errori
  - **Audit SEO completo**: tecnico (meta tags, schema, hreflang OK; bug BreadcrumbJsonLd, no 404, no image opt) + contenuti (34/44 articoli con 0 link interni, 23 titoli >60 char) + SERP competitivo
  - **Analisi SERP 6 query-tipo** ("retatrutide prezzo/dove comprare/effetti/peso") in IT/DE/FR/ES: vuoto competitivo enorme in tutte le lingue, unico competitor pan-EU è ZAVA (telemedicina)
  - **Analisi mercato EU**: 5 lingue attuali coprono ~75% del potere d'acquisto EU. UK escluso (post-Brexit). EN = lingua ponte pan-europea, non per UK
  - **Keyword opportunities** identificate: Ozempic Face, prezzi GLP-1 Italia, alimenti GLP-1 naturali, orforglipron, GLP-1 e alcol, Ozempic Babies
  - Problemi bloccanti: sito NON indicizzato su Google, linking interno quasi assente, E-E-A-T debole
- [2026-02-27] **GLP-1 Journal — migrazione 14 articoli da blog-engine** (`glp1-journal/`):
  - 14 articoli IT migrati da `/Copy Forever Slim/blog-engine/output/` al blog GLP-1 Journal
  - Conversione formato: `.md` → `.mdx`, frontmatter trasformato (rimosso slug/pillar/keywords, aggiunto locale/translationKey/category/tags/image)
  - 14 immagini hero generate con Gemini 3 Pro (una per articolo, 16:9, stile editoriale scientifico)
  - Fix compatibilità MDX: escape `<` e `>` usati come comparatori in 3 file
  - Build: **615 pagine** (da 522), zero errori
  - Articoli: confronto peptidi, FAQ, food noise, metabolismo, Mounjaro, Ozempic, retatrutide TRIPLE-G, benefici GLP-1, news 2026, dimagrire donna/uomo, come dimagrire, perché diete falliscono, stile di vita
  - Categorie usate: glp1-agonists (4), advanced-science (5), research-guides (4), comparisons (1)
  - Traduzioni EN/DE/FR/ES da fare in sessione successiva
- [2026-02-26] **GLP-1 Journal — revisione editoriale completa 100 articoli** (`glp1-journal/`):
  - Creato `ARTICLE-GUIDELINES.md` con 15 sezioni di linee guida editoriali
  - **TRIPLE-G naming**: aggiunto a tutti i 100 articoli (min 3 menzioni/articolo, 106 totali solo IT)
  - **Parole vietate eliminate**: farmaco→peptide (69 occorrenze IT), iniezione→somministrazione (30), effetti collaterali→segnali di adattamento (10), comprare→procurarsi (12)
  - **Framework effetti collaterali 5 livelli**: riscrittura completa `effetti-collaterali-glp1.mdx` con analogia banana, confronto OTC, analogia digiuno, protocollo pratico
  - **CTA editoriali**: tutte le menzioni "Aura Peptides" (lab-oriented) sostituite con "su aurapep.eu trovi..." (editoriale)
  - **Tono conversazionale**: tutti gli articoli convertiti al "tu" informale
  - **Argomento liofilizzato vs penna**: aggiunto negli articoli comparison/buying
  - **Progressione generazionale**: semaglutide (1a gen) → tirzepatide (2a gen) → TRIPLE-G (3a gen)
  - **Traduzioni aggiornate**: EN, DE, FR, ES — tutte allineate ai nuovi contenuti IT
  - Build: 522 pagine, zero errori
- [2026-02-26] **GLP-1 Journal blog completato** (`glp1-journal/`):
  - Blog editoriale Astro 5 + MDX + Tailwind CSS 4 per glp1journal.eu
  - 20 articoli strategici in italiano (lingua primaria) + 80 traduzioni (EN, DE, FR, ES) = 100 articoli totali
  - 522 pagine statiche generate (articoli + homepage + categorie + tag per 5 lingue)
  - SEO completo: hreflang 6-way per articolo, canonical, OG/Twitter, JSON-LD (BlogPosting + BreadcrumbList)
  - Sitemap con 523 URL
  - Sistema funnel 3-tier toggleabile via `PUBLIC_FUNNEL_TIER` env var
  - Design light-theme clinico-scientifico (Source Serif 4 + Inter, self-hosted GDPR ok)
  - 5 categorie: Agonisti GLP-1, Guide alla Ricerca, Confronti, Acquisto e Regolamentazione, Scienza Avanzata
  - Distribuzione contenuti: 70% editoriale puro, 20% soft sell, 10% commercial
- [2026-02-26] **IndexNow + Clarity analytics + middleware fix** (commits `fb77a74`, `e564163`, `5532602`):
  - Fix critico middleware: aggiunto catch-all matcher per path EN senza prefisso (`/order`, `/calculator`, ecc. davano 404)
  - IndexNow: API key + file verifica + route `/api/indexnow` (protetta da CRON_SECRET); ping inviato con 50 URL → HTTP 202
  - Microsoft Clarity: script `vn1xc3jub1` nel root layout, session recording su tutte le pagine/lingue
  - Google Search Console: sito verificato via Cloudflare DNS, sitemap sottomesso
  - 3 migration SQL eseguite su Supabase: `05_leads_table`, `06_cart_recovery`, `08_order_locale`
- [2026-02-25] **i18n completo + revisione traduzioni + SEO avanzato** (commit `c270906`):
  - Email multilingua: 5 template customer-facing tradotte in 10 lingue (`email-translations.ts` con ~50 chiavi × 10 lingue)
  - Migration `08_order_locale.sql`: colonna `locale` su tabella orders, salvata al checkout
  - Refactor `email-templates.ts`: tutte le funzioni customer-facing accettano `locale`, admin restano in italiano
  - Revisione completa traduzioni 8 lingue (390 chiavi × 8 = 3120 chiavi revisionate):
    - FR: 80+ fix capitalizzazione francese, FAQ espanse, SEO "acheter retatrutide europe"
    - DE: Checkout→Bestellvorgang, FAQ espanse, Sie-form, SEO "retatrutide kaufen europa"
    - ES: tu→usted (80+ istanze), wallet→monedero, FAQ espanse, SEO "comprar retatrutide europa"
    - PT: PT-PT consistency (pedido→encomenda, pesquisa→investigação), FAQ espanse
    - PL: capitalizzazione polacca, fix JSON typographic quotes, FAQ espanse
    - RU: TRIPLE-G tradotto, 40+ fix naturalezza frasi, FAQ espanse da 1 riga a paragrafi completi
    - UK: ВЕРХ→HPLC (7 occorrenze), Russianismi corretti, FAQ espanse
    - AR: punteggiatura araba (·→ثم), TRIPLE-G tradotto, genere corretto, FAQ espanse
  - SEO structured data: OrderStructuredData con Product + 6 AggregateOffer; PortalStructuredData (nuovo) con BreadcrumbList + WebApplication; HomeStructuredData fix prezzi (97→197) + AggregateOffer con 6 tier
  - SEO keyword optimization per tutte le lingue: chiavi transazionali localizzate
- [2026-02-25] **Admin dashboard upgrade — feature parity con Forever Slim** (commit `df4fa82`):
  - Order Detail Drawer: pannello slide-in da destra con info complete ordine, indirizzo spedizione, tracking, timeline
  - Ship/Refund/Cancel Modali: sostituiscono input inline con dialog modali centrati
  - Date Range Filters: `date_from`/`date_to` API params + date picker UI dark theme
  - Paginazione: 20 ordini/pagina con contatore e navigazione pagine
  - Mobile Order Cards: layout card responsive per ordini su mobile (<md)
  - CSV Export: download ordini filtrati come CSV UTF-8 (solo super_admin)
  - StatusTimeline: timeline verticale con dots gold/gray per lifecycle ordine
  - Tracking Events: display eventi tracking con timestamp nel drawer
  - Refactor azioni ordine da input inline a workflow basato su modali
- [2026-02-25] **Admin dashboard audit fix** (commit `57fdde6`):
  - Auth fallback to profiles table, RBAC layout blocking, expired order actions, refund inventory fix, BASE_PRICE 197
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

- **GLP-1 Journal blog** (`glp1-journal/`) — blog editoriale separato su glp1journal.eu. Stack: Astro 5 + MDX + Tailwind CSS 4. Build: **676 pagine** (44 articoli IT + 20 traduzioni EN/DE/FR/ES + pagina 404). **Pronto per deploy.**
  - DONE: tutti i fix SEO tecnici (BreadcrumbJsonLd, 404 page, OG meta, publisher logo, fetchpriority, H1 unico)
  - DONE: 44/44 titoli ≤ 60 char, 44/44 descriptions 120-160 char
  - DONE: 44/44 articoli con ≥ 5 link interni, 0 orfani, 0 link rotti
  - DONE: 44/44 articoli con CTA aurapep.eu + UTM completi
  - DONE: 97 link rotti fixati (/it/articles/ → /it/), 24 doppi H1 rimossi
  - TODO: tradurre i 24 nuovi articoli IT-only in EN, DE, FR, ES (= 96 pagine)
  - TODO: image optimization (sharp non compila, usare compressione esterna o CDN)
  - TODO: FAQ schema su faq-peptidi-dimagranti.mdx

## TODO / Planned

- [ ] Configurare wallet XRP (attualmente placeholder `CRYPTAPI_XRP_WALLET`)
- [ ] Deploy GLP-1 Journal su Vercel (dominio glp1journal.eu)
- [ ] Registrare domini extra: glp1research.eu, glp1review.eu, glp1digest.eu, glp1insider.eu
- [ ] **SEO BLOCCANTE**: sito non indicizzato (site:glp1journal.eu = 0). Registrare su Google Search Console + submittare sitemap
- [ ] **E-E-A-T**: creare pagina "Chi Siamo", aggiungere autore reale con credenziali, medical review badge
- [ ] **Content gap**: articoli mancanti ad alto potenziale — Ozempic Face, prezzi GLP-1 Italia/Europa, alimenti GLP-1 naturali, orforglipron, approvazione retatrutide Europa
- [ ] **Schema markup**: aggiungere FAQ/HowTo schema agli articoli pratici

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
