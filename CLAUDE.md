# Retatrutide Landing - Claude Code Context

> Per il contesto completo del progetto (business model, API, DB, design, ecc.) leggi `PROJECT_STATUS.md`.
> Questo file è specifico per Claude Code — gotchas, pattern, e cose che non funzionano come ci si aspetta.

## Multi-AI Workflow & Salvataggio Progressi
Il progetto è sviluppato in alternanza con Gemini 3.1 Pro. `PROJECT_STATUS.md` è la fonte di verità condivisa.

### Inizio sessione
1. Leggi `PROJECT_STATUS.md` per il contesto aggiornato (stato, TODO, cosa ha fatto l'altro AI)
2. Leggi questo file (`CLAUDE.md`) per gotchas e pattern specifici Claude

### Durante la sessione
- Se scopri un nuovo gotcha o pattern, aggiungilo a questo file nella sezione appropriata
- Se cambi architettura o crei nuovi file critici, aggiorna "Do NOT Touch" in PROJECT_STATUS.md

### Fine sessione (OBBLIGATORIO prima di chiudere)
Aggiorna **entrambi** i file:

**`PROJECT_STATUS.md`** — sezioni dinamiche:
- "Recently Completed": aggiungi `[data] descrizione` per ogni task completato
- "In Progress": cosa resta aperto o in corso
- "TODO / Planned": aggiungi nuovi task scoperti, spunta quelli completati
- "Current State": aggiorna ultimo commit/deploy se hai pushato

**`CLAUDE.md`** (questo file) — solo se necessario:
- Nuovi gotchas scoperti → sezione "Gotchas"
- Nuovi pattern riutilizzabili → sezione "Key Patterns"
- Nuove info sullo stack → sezione "Stack" o "Build"

## Stack
- Next.js 16 App Router + Turbopack, React 19, next-intl 4.8, Supabase, Resend, Tailwind 4
- Deploy: Vercel (auto-deploy on push to main)
- Domain: aurapep.eu

## Gotchas (Claude-specific)
- All main pages are `"use client"` — cannot export `generateMetadata` from them → use `layout.tsx` wrappers
- `.next` cache can get stuck — use `rm -rf .next` before rebuild if rmdir errors occur
- Next.js renders `hrefLang` (camelCase) in HTML — grep for `hrefLang` not `hreflang`
- `title: { absolute: title }` in child layouts to avoid double "| Aura Peptides" from root template
- Translation keys for SEO: `seo_{page}_{field}` pattern (e.g. `seo_home_title`, `seo_calc_description`)
- `BASE_PRICE = 197` in `order/page.tsx` — PRODUZIONE. Non abbassare per testing senza ripristinare.
- Admin UI strings are hardcoded in Italian — public pages use i18n
- `src/lib/supabase-admin.ts` uses lazy singleton (Proxy) — import won't fail even if env vars missing, but calls will
- CryptAPI webhook uses GET method (not POST) — `src/app/api/webhooks/cryptapi/route.ts`
- Rate limiting in checkout is in-memory (resets on deploy) — fine for Vercel serverless

## Build
- `npx next build` — 81 static pages + dynamic routes, zero errors expected
- Sitemap: 50 URLs (5 pages × 10 locales) with hreflang cross-references
- If build fails with ENOTEMPTY: `rm -rf .next && sleep 1 && npx next build`

## Key Patterns
- SEO metadata: `src/lib/seo.ts` → `buildPageMetadata()` — reuse for any new page
- Auth check: `src/lib/auth.ts` → `verifyAuth(req)` + `requireRole(role, [...])` — all admin API routes
- Email: `src/lib/email-templates.ts` — branded HTML templates, dark theme with gold accent
- DB access: `supabaseAdmin` (server, service role) vs `supabaseBrowser` (client, anon key)
- New public page checklist: layout.tsx + structured data component + 10 message files + sitemap.ts entry
- Checkout page è server component — per funzionalità client (copy, countdown) usare sub-componenti client
  in `src/components/ui/` e passare le translated strings come props dal server component
- Sezioni con background esplicito (bg-black, bg-[#...]) su dark theme → quasi sempre invisibili.
  Sempre preferire `bg-brand-void` o rimuovere il bg e lasciare che erediti dal body
- `whileInView` Framer Motion: usare `viewport={{ once: true, amount: 0.05 }}` per mobile
  (evita grandi aree bianche — le card sono full-width e il default threshold non triggerizza bene)
