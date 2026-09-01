# profesionales.com.py — Build Plan

Offerta-style lead marketplace for local services in Paraguay. Customer posts a job in
30 seconds → up to 3–4 matched, verified professionals get the lead → pros pay per lead
(credits). WhatsApp-first, web-only, no customer accounts, no app.

**Stack:** Next.js (App Router) + TypeScript + Drizzle ORM + Hostinger MySQL, deployed on
Hostinger managed Node.js. Skills: `nodejs-mysql-hostinger-stack`, `nextjs-deploy-hostinger`.

## Phase table

| Phase | Model | Prompt file | Plan sections |
|---|---|---|---|
| opus-1 | Opus | `prompts/opus-1-foundation.md` | §5.1 (scaffold, full schema, auth, i18n, CI, seeds) |
| opus-2 | Opus | `prompts/opus-2-lead-engine.md` | §5.2 (lead intake, matching, credits, accept flow, spoke API) |
| opus-3 | Opus | `prompts/opus-3-pro-admin.md` | §5.3 (pro dashboard, admin panel, reviews) |
| sonnet-1 | Sonnet | `prompts/sonnet-1-public-site.md` | §6.1 (public site, design, SEO pages) |
| sonnet-2 | Sonnet | `prompts/sonnet-2-seo-content.md` | §6.2 (technical SEO, content, VenderCRM, imagery) |
| sonnet-3 | Sonnet | `prompts/sonnet-3-deploy-polish.md` | §6.3 (deploy prep, QA, closing report) |

---

## §1 Decisions already made — locked, never re-litigate

1. **Offerta model, not Upwork.** Local physical services only at launch. Lead
   marketplace: customer posts job free, pros pay per lead. No escrow, no commissions,
   no payments between customer and pro. A "servicios digitales" wing is Backlog (year 2).
2. **Launch scope:** 5 categories — plomero, electricista, aire acondicionado, cerrajero,
   limpieza. Gran Asunción only. Schema supports unlimited categories/zones from day one;
   UI shows only active ones. Category #6 is a business decision, not a build task.
3. **Monetization ladder:** Phase A free leads (price Gs 0 per category) → Phase B prepaid
   credit packs, pay-per-lead → Phase C subscriptions (Backlog). The credit ledger is
   built NOW; free leads are just price-0 charges through the same ledger.
4. **Customers never create accounts.** A lead is a form submission with a WhatsApp
   number. Pros and admins are the only authenticated users.
5. **Lead exclusivity:** each lead goes to max 3–4 pros (configurable per category).
   Accepting burns a credit charge and reveals the customer's WhatsApp.
6. **WhatsApp-first, API-less at launch.** Notifications = email + dashboard inbox +
   `wa.me` click-to-chat deep links. WhatsApp Cloud API is Backlog; the notification
   layer is an abstraction so it can be added without touching core logic.
7. **Hub-and-spoke:** vertical EMD sites (pozo.com.py etc.) will POST leads into this
   platform via a token-authenticated API endpoint. Endpoint built in opus-2; the spoke
   sites themselves are NOT part of this build.
8. **Verification story:** pros submit cédula/RUC + WhatsApp at signup; admin manually
   verifies. Only verified pros receive leads.
9. **Language:** public site in Paraguayan Spanish (es-PY, "vos" register). Code, DB
   identifiers, admin copy keys in English. ALL UI strings through an i18n layer from the
   first commit (single `es` locale now; structure permits more later).
10. **Every registered pro is exported to VenderCRM** as a contact + pipeline deal
    (skill `vendercrm-lead-capture`). Graceful no-op when the API key env is missing.
11. **CI:** one minimal PR-only workflow in the `budgeted-runner-deploy` mandatory shape
    (one job, ubuntu-latest, timeout-minutes, concurrency cancel-in-progress,
    paths-ignore docs). Approved by Anton at plan review because auto-merge requires a
    required check. No other workflows, ever, without his explicit yes. Husky pre-push
    (typecheck+build) and pre-commit (block new workflow files) hooks included.
12. **Design:** bespoke, conversion-first per skills `conversion-design`,
    `web-design-system`, `paraguay-local-site` (Mode 3 vertical patterns),
    `seo-web-builds`. Direction: "Confianza Local". No template look.
13. **Domain-agnostic brand config.** Site name, domain, and customer-facing brand come
    from env/config (`NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_BRAND_NAME`), never hardcoded.
    Reason: a possible two-door setup later (presupuestos.com.py = customer funnel,
    profesionales.com.py = pro side, same engine). The build targets one deployment;
    the second door is Backlog. Domain purchase decision is §8, never a build blocker.
14. **Leads can carry photos.** Optional photo upload (max 3, size-capped, local
    uploads dir) on the lead form — a qualified lead with photos is worth multiples of
    a bare form fill. Photos revealed to pros only after accept, like the phone number.
15. **Speed is instrumented.** Median time-to-first-accept per category is a first-class
    admin metric (derivable from `lead_assignments.offered_at/accepted_at`) — it backs
    the future brand promise "3 presupuestos en 1 hora".

## §2 Roles & object model

**Roles** — DB enum on `users.role`: `admin` | `professional`. Nothing else. Customers
have no user rows. "Verified pro" is a state (`professionals.verified_at`), not a role.

**Objects** (complete schema written in opus-1; later phases add NO tables and NO
columns — a needed change is a stop-and-ask per §4.4):

- `users` — id, email (unique), password_hash, role, status(`active|suspended`), timestamps.
- `professionals` — 1:1 users. business_name, slug (unique), cedula_ruc, whatsapp,
  bio, years_experience, photo_url, verified_at (null = unverified), avg_rating,
  review_count, credit_balance_gs (cached; ledger is authority), timestamps.
- `categories` — slug, name_es, icon, lead_price_gs (0 during free phase),
  max_pros_per_lead (default 3), form_questions (JSON: extra intake fields), active, sort.
- `zones` — slug, name, department, active. Seed: Asunción + Gran Asunción municipios
  (Lambaré, Fernando de la Mora, San Lorenzo, Luque, Capiatá, Limpio, Ñemby, Villa
  Elisa, San Antonio, Mariano Roque Alonso, Areguá, Itauguá) + "Otra zona".
- `professional_categories`, `professional_zones` — m2m join tables.
- `leads` — public_code (short, unguessable), category_id, zone_id, description,
  answers (JSON from form_questions), photos (JSON array of stored file paths, max 3),
  customer_name, customer_whatsapp, customer_type(`particular|empresa`, default
  `particular`), status(`new|matched|closed|spam`), source(`web|spoke|ads|admin`),
  source_domain, timestamps.
- `lead_assignments` — lead_id + professional_id (unique pair),
  status(`offered|accepted|declined|expired`), accept_token (unguessable),
  price_gs (snapshot of category price at offer time), offered_at, accepted_at.
- `credit_transactions` — professional_id, amount_gs (signed; purchases +, lead charges −),
  type(`purchase|lead_charge|refund|bonus|adjustment`), lead_assignment_id (nullable),
  idempotency_key (unique), note, created_at. Balance = SUM; cached on professionals
  inside the same DB transaction.
- `credit_packs` — name, price_gs, credits_gs, active. Seed: Gs 100k/250k/500k packs
  (credits = price + 0/10/20% bonus).
- `reviews` — professional_id, lead_id (nullable), rating 1–5, comment, customer_name,
  request_token (unguessable, for the WhatsApp follow-up link),
  status(`pending|published|rejected`), timestamps.
- `spoke_tokens` — token_hash, domain, category_id (nullable default), active. Auths the
  spoke API.
- `settings` — key/value for tunables (e.g. assignment expiry hours).

## §3 Feature scope

**Core (this build):** public lead form (no account, optional photos), matching +
assignment engine, credit ledger, accept-lead flow with reveal, pro
registration/dashboard/profile, admin panel (verify pros, moderate leads, prices,
credits, metrics incl. time-to-first-accept), review request + display, public SEO
pages (home, category, category×zone, pro profiles), price-guide content system,
spoke API, VenderCRM export, deploy to Hostinger.

**Approved extras:** review follow-up link generation (manual send via wa.me at first);
lead spam flagging; category-specific intake questions (JSON-driven); price guides —
file-based content collection (`content/guias/*.md`, no DB tables) rendered at
`/guias/[slug]` ("¿Cuánto cuesta …?" pages), each ending in the lead form with category
preselected. Structure built in sonnet-1, ≥10 seed guides written in sonnet-2.

**Explicitly out (→ §10 Backlog):** online card payments for packs (launch = manual
transferencia/Tigo Money, admin credits via `bonus`/`purchase` adjustment), WhatsApp
Cloud API, AI WhatsApp intake agent, second-domain customer funnel
(presupuestos.com.py door), subscriptions, customer accounts, chat, mobile app,
digital-services wing, automated review SMS.

## §4 Autonomy protocol

1. Work until the phase's exit criteria pass. Never ask permission for in-plan work.
2. One PR per phase: branch `phase/<id>` off latest main; open the PR and IMMEDIATELY
   arm GitHub auto-merge (`mcp__github__enable_pr_auto_merge`, squash). GitHub merges on
   green whether or not the session survives; watching via `mcp__github__*` tools is only
   for confirming merge / diagnosing red. If arming auto-merge fails, a §7 preflight
   setting is missing — say so explicitly in the phase report, never silently fall back
   to watching. A red build is always this session's own work. Never build on top of an
   unmerged previous phase.
3. Minor non-blocking issues → `KNOWN-ISSUES.md`, keep building.
4. Stop and ask ONLY for: a missing credential with no graceful fallback, or a
   bad-foundation decision (schema shape, auth, money math, matching logic) where a
   wrong guess forces a rewrite. Everything else: choose reasonably, record in §9,
   continue.
5. Missing env values never block: document in `.env.example`, degrade gracefully.
6. Every prompt is re-runnable: check what exists on the branch, continue from the
   first unmet exit criterion.
7. Sonnet hard limits: NO schema, auth, credit-ledger, or matching-logic changes; data
   access only through the query layer Opus built. Workaround + §10 note instead.
8. **Model guardrail:** phases run on Opus and Sonnet ONLY. Fable/Mythos models are
   never spawned, scheduled, or written into any prompt or automation. If Fable seems
   needed, stop and ask Anton — treat it like a destructive action.
9. **Handoff** only when four gates pass: (a) merge VERIFIED via `mcp__github__*` — PR
   state `merged`, fetched origin/main contains the phase commit, checks green;
   (b) exit checklist passed; (c) pre-handoff audit — re-run build + verify scripts,
   adversarially re-read the merged diff, fix findings; (d) §9 build-log entry
   committed. Then spawn the next phase as a NEW session via claude-code-remote
   `create_session`: inherit environment and permission mode (never `plan`), `model`
   per phase table, prompt exactly
   `Read prompts/<next-file>.md in this repo and execute it.` — then end with the phase
   report. If `create_session` is unavailable (local CLI): same model → continue in this
   window; model switch → stop and report. A stalled/unconfirmable merge = BLOCKED
   handoff; report it, never branch the next phase off the wrong base.
10. **Build log:** before merging, append a 5–10 line dated entry to §9 — phase + PR,
    what now exists, decisions/deviations, where the next phase looks first.
11. **Silence is never progress.** All GitHub state checks via `mcp__github__*` tools —
    never curl/gh against api.github.com (the proxy returns empty bodies, not errors).
    Every wait has a deadline and a "could not determine" branch that reports. No
    session ends a turn "waiting for CI": it ends merged, or with a stated blocker.

## §5 Opus phases

### §5.1 opus-1-foundation
Scaffold + everything later phases must never change.
- Next.js App Router + TS scaffold per `nodejs-mysql-hostinger-stack` (standalone
  output, port/env conventions from `nextjs-deploy-hostinger`). Delete any generated
  workflow files, then add the ONE approved CI workflow (§1.11 shape: typecheck, lint,
  test, build) + husky pre-push/pre-commit hooks.
- Drizzle + mysql2: COMPLETE §2 schema, migrations, `db:push`/`db:migrate` scripts,
  `.env.example` with every var the whole build will need (DATABASE_URL, AUTH_SECRET,
  SMTP_*, VENDERCRM_API_URL/KEY, NEXT_PUBLIC_SITE_URL, NEXT_PUBLIC_BRAND_NAME,
  UPLOADS_DIR, SPOKE seed token). Brand/domain never hardcoded (§1.13).
- Auth: credentials login (bcrypt), session cookie (Auth.js or equivalent light
  implementation), role-gated route groups `/panel` (professional) and `/admin`
  (admin), middleware guards, seeded admin user from env (`ADMIN_EMAIL`/`ADMIN_PASSWORD`,
  dev fallback documented).
- i18n layer: typed `t()` over `locales/es.json`; every string keyed from commit one.
- Seeds: 5 launch categories (with sensible `form_questions` per category + placeholder
  `lead_price_gs` 0), zones list (§2), credit packs, one demo verified pro (dev only).
- Verify script `npm run verify`: typecheck + lint + unit tests (ledger math, slug/token
  helpers) + build.
- Exit: fresh clone + `.env` → migrate + seed + `npm run verify` green; admin can log
  in; role guards proven by tests (professional blocked from `/admin`); CI green; PR
  merged.

### §5.2 opus-2-lead-engine
The product. Server logic only — minimal unstyled UI is fine; Sonnet styles later.
- Public lead intake: `POST /api/leads` + minimal form pages — category → dynamic
  `form_questions` → description + optional photos (max 3; validate type/size
  server-side; store under an uploads dir served via a route handler, path pattern
  compatible with Hostinger persistent storage) → zone → name + WhatsApp →
  particular/empresa toggle. Server-side validation (Paraguayan phone normalization to
  +595), honeypot + rate limiting, no account. Photos are NEVER exposed on any public
  or pre-accept surface.
- Matching engine: on lead creation, select up to `max_pros_per_lead` verified pros in
  category+zone (fallback: category-wide in Gran Asunción), ordered by fewest recent
  assignments (fair rotation). Create `lead_assignments` with snapshot price + tokens.
  No match → lead stays `new`, admin can assign manually later (opus-3).
- Credit ledger service: single module owning ALL balance math. Charge on accept, in one
  DB transaction, idempotency_key = assignment id + type; insufficient balance blocks
  accept with clear message (free phase: price 0 always passes). Unit tests: double
  accept is one charge; concurrent accepts don't double-charge; balance cache always
  equals SUM(ledger).
- Accept flow: `/lead/aceptar/[token]` — auth optional via token but must map to the
  assignment's pro if logged in; on accept: charge, reveal customer name + WhatsApp +
  full description + photos, `wa.me` deep link with prefilled greeting. Photo access is
  authorized per assignment (accepted pro or admin only) — test it. Expiry
  (settings-driven, default 24h) → `expired`.
- Notifications abstraction: `notify(pro, event)` interface with email (SMTP, no-op if
  unset) + dashboard-inbox implementations. WhatsApp API = future implementation slot.
- Spoke API: `POST /api/v1/spoke/leads`, Bearer token → `spoke_tokens` (hashed),
  same validation + matching, `source='spoke'`. Documented in `docs/spoke-api.md`.
- Exit: `npm run verify` green including ledger + matching + accept-idempotency tests;
  E2E happy path scripted (create lead → assignments exist → accept via token → charge
  → reveal); spoke endpoint test with seeded token; CI green; PR merged.

### §5.3 opus-3-pro-admin
- Pro registration: public form (business data, cédula/RUC, WhatsApp, categories,
  zones) → unverified account → VenderCRM export call (skill `vendercrm-lead-capture`;
  graceful no-op without key) → "en verificación" state screen.
- Pro dashboard `/panel`: leads inbox (offered/accepted/history with masked customer
  data until accepted), credit balance + ledger view, pack purchase page (shows bank
  transfer / Tigo Money instructions + WhatsApp contact — NO online payment), profile
  editor, review list.
- Admin `/admin`: verify/suspend pros; leads table with status/spam moderation + manual
  assignment; category price + max-pros editing; zone management; credit granting
  (purchase/bonus/adjustment with note); spoke token management; dashboard metrics
  (leads/day, accept rate, median time-to-first-accept per category, revenue Gs,
  active pros per category).
- Reviews: admin/pro can generate a review request link (`/opinar/[token]`) to send via
  wa.me; public form rates 1–5 + comment → `pending` → admin publishes → aggregates
  update on professional. Tests: aggregate math, token single-use.
- Exit: full lifecycle demo script (register pro → admin verifies → lead → offer →
  accept → charge → review link → publish) passes; verify green; CI green; PR merged.

## §6 Sonnet phases

### §6.1 sonnet-1-public-site
Hard limits §4.7 apply. Load skills: `conversion-design`, `web-design-system`,
`paraguay-local-site`, `seo-web-builds`.
- Design system: "Confianza Local" direction tokens; premium bespoke look, WhatsApp-first
  CTAs; mobile-first (most traffic will be mobile Meta ads).
- Pages: home (hero = the 3-step lead form entry, trust signals — NO fabricated counts
  or testimonials per `seo-web-builds` anti-fabrication rules), `/[category]` ×5,
  `/[category]/[zone]` programmatic pages, pro public profiles
  `/profesional/[slug]` (verified badge, reviews, "Pedir presupuesto" → lead form with
  category preselected), cómo-funciona, para-profesionales (recruitment landing → pro
  registration), gracias/confirmation pages, `/guias/[slug]` price-guide template +
  index (content collection per §3 — template and rendering here; guide copy is
  sonnet-2's job, ship with 1–2 sample guides).
- Style the opus-2/3 flows (lead form wizard, accept page, panel, review form) into the
  design system. Logic untouched.
- Exit: Lighthouse mobile ≥90 performance/SEO on home + one category page (documented
  numbers in build log); all pages responsive; zero hardcoded strings outside locale
  file; verify green; PR merged.

### §6.2 sonnet-2-seo-content
Load skills: `seo-web-builds`, `higgsfield-web-imagery`, `vendercrm-lead-capture`.
- Technical SEO: metadata per page type, Schema.org JSON-LD (LocalBusiness/Service/
  FAQPage where truthful), sitemap.xml (all active category/zone/pro pages),
  robots.txt, canonical rules, OG images.
- Content: es-PY copy depth for the 5 category pages (precios orientativos ranges,
  FAQs, "cuándo llamar a un profesional"), legal pages (términos, privacidad — plain
  honest text, flag for lawyer review in KNOWN-ISSUES).
- Price guides: ≥10 "¿Cuánto cuesta …?" guides across the 5 launch categories
  (e.g. instalar un aire split, destapar una cañería, cambiar una cerradura, limpieza
  final de obra, tablero eléctrico), each ≥500 words, Gs ranges clearly marked
  "orientativo 2026", FAQ block, ending in the preselected lead form. These target the
  highest-intent SEO queries in the market — treat them as first-class pages (metas,
  FAQPage JSON-LD, sitemap).
- Imagery via `higgsfield-web-imagery` within budget; if MCP/credits unavailable,
  ship tasteful CSS/SVG placeholders and note in KNOWN-ISSUES — never block.
- Verify VenderCRM export wiring end-to-end against `.env.example` contract.
- Exit: sitemap validates, JSON-LD passes Rich Results test locally (documented),
  every category page has unique ≥400-word real content, verify green, PR merged.

### §6.3 sonnet-3-deploy-polish
Load skills: `nextjs-deploy-hostinger`, `nodejs-mysql-hostinger-stack`.
- Deploy readiness: standalone build verified, exact hPanel steps written to
  `docs/deploy.md` (Node app import, env vars list, Remote MySQL/IP notes, domain
  mapping profesionales.com.py), production seed script (categories/zones only — no
  demo pro), migration-on-deploy notes.
- Full QA pass of every flow on production build (`next build && next start`),
  fix findings; sweep KNOWN-ISSUES — fix cheap ones, keep honest list.
- Closing report per prompt footer (live-readiness checklist + numbered manual steps
  for Anton: hPanel setup, DNS, first credits, pro recruitment kickoff).
- Exit: production build boots clean with prod-like env; QA checklist in build log all
  green or consciously waived; PR merged; STOP (no further session spawned).

## §7 Human-inputs checklist

| Input | Needed by | Notes |
|---|---|---|
| **Auto-merge preflight** | before opus-1 | (a) Repo Settings → General → Pull Requests → tick "Allow auto-merge". (b) Branch protection on `main` requiring the CI check (`check`). Both off by default. Without them every phase stalls at its first PR. |
| CI approval | before opus-1 | Merging this plan = your yes to the ONE workflow in §1.11. |
| Hostinger Node.js slot + MySQL DB + creds | sonnet-3 (docs), you (deploy) | Which account/slot to use; DATABASE_URL. |
| profesionales.com.py DNS → Hostinger | you, at go-live | |
| SMTP creds (optional) | opus-2 | Degrades to dashboard-only notifications. |
| VenderCRM API URL + tenant key | sonnet-2 verify | Degrades to no-op export. |
| Business WhatsApp number | sonnet-1 copy | For "hablá con nosotros" CTAs. |
| Higgsfield credits (optional) | sonnet-2 | Placeholders otherwise. |
| ADMIN_EMAIL / ADMIN_PASSWORD | first deploy | Seeded admin login. |

## §8 Open business questions (parked — not build work)

1. Exact per-category lead prices at Phase B switch-on (admin-editable; launch at 0).
1b. Domain strategy: check availability of presupuestos.com.py / servicios.com.py /
   cotizar.com.py THIS WEEK. If presupuestos is free, buy it — future customer-facing
   door (§1.13 keeps the build domain-agnostic either way). profesionales.com.py alone
   also works; don't let this delay anything.
1c. AI WhatsApp intake agent (photo + qualification bot) — the biggest post-launch
   differentiator; scope it as its own project once leads flow.
2. Assignment expiry (24h default) and whether declined leads re-route to a 4th pro.
3. When category #6+ and zones beyond Gran Asunción open (data-driven).
4. Tigo Money vs. bank transfer emphasis for packs; card gateway (Bancard) timing.
5. Pimer response: differentiation copy only, or aggressive pro-poaching outreach.

## §9 Build log & handoff

(Each phase appends here before merging. Fresh sessions orient from plan.md + this
log + KNOWN-ISSUES.md only.)

### 2026-09-01 — opus-1 foundation (PR #2)

**What now exists.** Next.js 15 App Router + TS scaffold with `output: "standalone"`;
the COMPLETE §2 schema in `src/db/schema.ts` (13 tables, foreign keys, generated as
`drizzle/0000_init.sql`); credentials auth (bcrypt + HMAC-signed session cookie) with
role-gated `/panel` and `/admin`, guarded both in `src/middleware.ts` and server-side in
`src/lib/auth/guards.ts`; the credit ledger service `src/lib/credits/ledger.ts`; a typed
i18n layer over `locales/es.json`; an idempotent seed (5 categories with `form_questions`,
14 zones, 3 credit packs, settings, admin, dev-only demo pro, optional spoke token);
`npm run verify` (typecheck → lint → 58 unit tests → build); the one approved CI workflow
and husky pre-commit/pre-push hooks; `GET /api/health`.

**Decisions taken (none re-litigated from §1).** Auth is a hand-rolled HMAC session
cookie rather than Auth.js — email/password is the only login this product will ever
have, and it keeps the Edge middleware dependency-free. Foreign keys were added to the
schema (cascade from users/professionals/leads, `set null` for optional links) since the
schema is frozen and integrity is expensive to retrofit. `bcryptjs` over native `bcrypt`
to avoid a native build on Hostinger. The DB pool is created lazily so `next build`
succeeds in CI without a database.

**Verified live, not just mocked.** MariaDB 10.11 was installed in the build container,
so `db:migrate`, a twice-run `db:seed`, admin login, the professional-blocked-from-`/admin`
redirect, logout, and the ledger under 4 concurrent charges (exactly 2 succeeded, 2
rejected for insufficient balance, cached balance == `SUM(ledger)`) were all exercised
against a real server. Production is MySQL 8; the first live migrate is still the final
confirmation (KNOWN-ISSUES).

**Where opus-2 looks first.** `src/db/schema.ts` for the frozen shape (`leads`,
`lead_assignments`, `spoke_tokens`); `src/lib/credits/ledger.ts` — call
`applyTransaction` with `idempotencyKeyFor("lead_charge", assignmentId)` and
`requireSufficientBalance: true`, and never do balance math anywhere else;
`professionals.avg_rating_x100` stores the review average as an integer scaled by 100
(450 = 4.50 stars) — plan §2 calls the field `avg_rating`; it is the same field, named
for its storage so no float ever enters the rating math;
`src/lib/ids.ts` for `publicCode`, `secureToken`, `hashToken` and
`normalizeParaguayanPhone`; `categories.form_questions` (typed `FormQuestion[]`) already
carries the per-category intake fields to render; `settings.assignment_expiry_hours`
(seeded at 24) drives assignment expiry; photos go under `UPLOADS_DIR` and are never
exposed pre-accept.

## §10 Backlog

WhatsApp Cloud API notifications · AI WhatsApp intake/qualification agent ·
presupuestos.com.py customer-funnel door (second deployment, same engine) · online pack
payments (Bancard) · subscriptions + badges · digital-services wing · customer
accounts/history · in-platform chat · auto review-request scheduling · spoke-site
builds (pozo, gruas, …) mapped to hub categories · cross-links from propia.com.py /
materiales.com.py ("¿Necesitás un profesional para esto?" → spoke API) · guide
flywheel: refresh price guides from real platform job data · pro mobile PWA wrapper ·
GBP integration for pros (`gbp-optimizer` upsell).

## §11 Business playbook (reference for Anton — sessions don't build this)

- **Positioning:** "Describí tu trabajo y recibí hasta 3 presupuestos por WhatsApp.
  Gratis y sin registro." Vs. Pimer: no app install, no agency curation. Vs. Clasipar/
  Facebook: matched + verified, not a listings dump.
- **Supply playbook (months 1–3):** recruit 10–20 pros per launch category in Gran
  Asunción. Pitch: "te mando clientes gratis, solo respondé rápido". Sources: Clasipar,
  Facebook groups, GBP listings, referrals. Every pro → VenderCRM pipeline. Require
  cédula/RUC + WhatsApp. Target: 15 responsive pros/category before spending on demand.
- **Demand:** spoke EMDs + SEO category/zone pages + Meta ads (lead form objective →
  site). Budget test: Gs/lead per category; kill categories where CAC > Phase-B price.
- **Pricing at Phase B:** leads Gs 10k–80k by category value (cerrajero low, mudanza/
  reforma high); packs Gs 100k/250k/500k with 0/10/20% bonus credits. Never touch the
  customer-pro transaction.
- **Phase C upsells:** monthly plans, profile badges, priority ranking; cross-sell
  VenderCRM subscriptions, GBP optimization, website builds to paying pros.
- **B2B demand cheat code:** administradores de edificios, inmobiliarias, consorcios
  post jobs weekly — ten of them equal hundreds of consumer visitors and give pros a
  reason to stay funded. The `empresa` lead flag exists for this; go recruit them
  early with a direct pitch.
- **Speed promise:** once median time-to-first-accept is reliably under an hour in a
  category, advertise it ("3 presupuestos en 1 hora o te llamamos nosotros") — the
  admin metric from §5.3 is the evidence.
- **Ceiling honesty:** standalone this is a Gs 30–150M/month business at maturity; the
  real return is the ecosystem funnel (VenderCRM, GBP packages, site builds to every
  paying pro) plus demand data nobody else in Paraguay has.
- **KPIs:** leads/week, match rate, accept rate <30 min, median time-to-first-accept,
  pro 30-day retention, Gs revenue/category, review count, guide-page → lead
  conversion.
- **Main risk:** supply recruitment is grinding sales work — the site is the easy part.
  Do not open category #6 until all 5 have paying (or reliably responsive) pros.
