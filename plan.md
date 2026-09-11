# profesionales.com.py — Build Plan

Offerta-style lead marketplace for local services in Paraguay. Customer posts a job in
30 seconds → up to 3–4 matched, verified professionals get the lead → pros pay per lead
(credits). WhatsApp-first, web-only, no customer accounts, no app.

**Stack:** Next.js (App Router) + TypeScript + Drizzle ORM + Hostinger MySQL, deployed on
Hostinger managed Node.js. Skills: `nodejs-mysql-hostinger-stack`, `nextjs-deploy-hostinger`.

## Phase table

Model per phase is decided here, never by the session. Opus phases run first and
sequentially; every Sonnet lane-2 phase starts the moment opus-3 merges and runs in
parallel; sonnet-5 runs alone after all of lane 2 has merged.

| Phase | Lane | Model | Prompt file | Plan §§ | Owns (may create/modify) | Depends on |
|---|---|---|---|---|---|---|
| opus-1 | 1 | Opus | `prompts/opus-1-foundation.md` | §5.1 | (merged, PR #2) | — |
| opus-2 | 1 | Opus | `prompts/opus-2-lead-engine.md` | §5.2 | `src/lib/leads/**`, `src/lib/matching/**`, `src/lib/credits/**`, `src/lib/notify/**`, `src/lib/uploads/**`, `src/lib/ratelimit/**`, `src/lib/auth/**`, `src/lib/env.ts`, `src/app/pedir/**`, `src/app/lead/**`, `src/app/api/leads/**`, `src/app/api/uploads/**`, `src/app/api/v1/spoke/**`, `src/app/api/health/**`, `tests/**`, `.github/workflows/ci.yml` (MySQL service only), `scripts/seed.ts`, `docs/spoke-api.md`, `prompts/_watcher.md` (create the Routine) | opus-1 |
| opus-3 | 1 | Opus | `prompts/opus-3-pro-admin.md` | §5.3 | `src/lib/professionals/**`, `src/lib/reviews/**`, `src/lib/admin/**`, `src/lib/vendercrm/**`, `src/app/panel/**`, `src/app/admin/**`, `src/app/registro/**`, `src/app/opinar/**`, `src/app/api/panel/**`, `src/app/api/admin/**`, `src/app/api/reviews/**`, `src/middleware.ts`, `tests/**` | opus-2 |
| sonnet-1 | 2 | Sonnet | `prompts/sonnet-1-public-site.md` | §6.1 | `src/components/**`, `src/app/globals.css`, `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/(public)/**` (category, zone, pro profile, cómo-funciona, para-profesionales, gracias, guías template), `src/lib/content/**` (loaders for `content/**`), restyle-only edits inside `src/app/pedir/**`, `src/app/lead/**`, `src/app/panel/**`, `src/app/admin/**`, `src/app/registro/**`, `src/app/opinar/**` | opus-3 |
| sonnet-2 | 2 | Sonnet | `prompts/sonnet-2-content.md` | §6.2 | `content/**` (category copy, ≥10 price guides, legal pages, FAQ data), `locales/es.json` additions under `content.*` keys only | opus-3 |
| sonnet-3 | 2 | Sonnet | `prompts/sonnet-3-seo-imagery.md` | §6.3 | `src/lib/seo/**` (metadata + JSON-LD builders), `src/app/sitemap.ts`, `src/app/robots.ts`, `src/app/opengraph-image.tsx`, `public/img/**`, `public/*.txt`, `content/images.json` | opus-3 |
| sonnet-4 | 2 | Sonnet | `prompts/sonnet-4-deploy-crm.md` | §6.4 | `docs/deploy.md`, `scripts/seed-prod.ts`, `scripts/verify-live.mjs`, `README.md` (deploy section), `src/lib/vendercrm/**` (verify + fix only) | opus-3 |
| sonnet-5 | final | Sonnet | `prompts/sonnet-5-link-pass.md` | §6.5 | every cross-cutting edit: wiring `src/lib/seo` + `content/**` into the pages, nav, hub cards, sitemap sanity, production QA fixes anywhere, `KNOWN-ISSUES.md` | sonnet-1..4 |

Support files: `prompts/_handoff.md` (gates + spawn call), `prompts/_watcher.md` (the
hourly Sonnet Routine), `docs/log/<phase>.md` (one per phase), `docs/decisions-needed.md`
(questions for Anton; empty means none).

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
    NO `paths-ignore` — a required check that never reports blocks docs-only PRs
    forever, review 2026-09-11 P2). Approved by Anton at plan review because auto-merge
    requires a required check. No other workflows, ever, without his explicit yes. The
    one job MAY run a MySQL 8 service container for integration tests (opus-2). Husky
    pre-push (typecheck+lint+test — the build runs in CI) and pre-commit (block new
    workflow files) hooks included.
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
16. **Review 2026-09-11 decisions** (`docs/review-2026-09-11.md`) are locked like the
    rest of §1: lane 2 runs in parallel with file ownership, per-phase logs in
    `docs/log/`, the watcher Routine restarts stalled phases, content lives in
    `content/**` files (not in page components), sessions are re-checked against
    `users.status`, production refuses the default admin password, integration tests run
    against MySQL 8 in CI.

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
2. One PR per phase, branched off latest main (any branch name; the PR title starts with
   `Phase <id>:`). Open the PR the same turn the exit criteria pass and IMMEDIATELY arm
   GitHub auto-merge (`mcp__github__enable_pr_auto_merge`, squash). If arming fails, a
   §7 preflight setting is missing — say so in the phase report, never silently fall
   back to watching. A red build is always this session's own work. Never build on top
   of an unmerged previous lane-1 phase. Lane-2 phases never wait for each other.
3. Minor non-blocking issues → the "Known issues" section of `docs/log/<phase>.md`,
   keep building. Only still-open, cross-phase items are promoted to the root
   `KNOWN-ISSUES.md`, by sonnet-5.
4. Stop and ask ONLY for: a missing credential with no graceful fallback, or a
   bad-foundation decision (schema shape, auth, money math, matching logic) where a
   wrong guess forces a rewrite. Everything else: choose reasonably, record in the phase
   log, continue. "Ask" means: append the question to `docs/decisions-needed.md`,
   commit, push the branch, end the session. The watcher notifies Anton. Never wait in
   the session for an answer.
5. Missing env values never block: document in `.env.example`, degrade gracefully.
6. Every prompt is re-runnable: check what exists on main and on any open PR/branch for
   the phase first, continue from the first unmet exit criterion. WIP commit + push at
   least every 30 minutes; each commit is a resumable checkpoint.
7. Lane-2 hard limits: NO schema, auth, credit-ledger, matching, upload or notification
   logic changes; data access only through the query modules Opus built (`src/lib/**`).
   Workaround + §10 note instead.
8. **Model guardrail:** phases run on Opus and Sonnet ONLY. Fable/Mythos models are
   never spawned, scheduled, or written into any prompt or automation. If Fable seems
   needed, write why in `docs/decisions-needed.md` and end — treat it like a
   destructive action.
9. **File ownership.** A phase writes only to the paths in its `Owns` cell, plus its
   own `docs/log/<phase>.md`, new `content.*`/`<phase-scoped>` keys appended to
   `locales/es.json`, a `/* == <phase> == */` block appended to `globals.css` (lane 2
   only, sonnet-1 excepted since it owns the file), and lines appended to
   `docs/decisions-needed.md`. On `git merge main` conflicts: main wins, re-apply your
   change on top, re-run verify. Never resolve a conflict by editing a file outside your
   Owns cell — log it, push, end (§4.4). Two phases needing the same line were
   mis-planned; the fix is in the plan.
10. **Handoff** when four gates pass: (a) merge VERIFIED via `mcp__github__*` — PR state
    merged, fetched origin/main contains the commit, checks green; (b) exit checklist
    passed; (c) pre-handoff audit — ONE re-run of `npm run verify` on main + ONE
    adversarial re-read of the merged diff, findings fixed in ONE follow-up commit, no
    second round; (d) `docs/log/<phase>.md` committed and the §9 index line added. Then
    follow `prompts/_handoff.md`: lane-1 phases spawn the next lane-1 phase; opus-3
    spawns every lane-2 phase (≤ 4 concurrently, the watcher starts the rest); lane-2
    phases spawn nothing; sonnet-5 deletes the watcher and stops. Spawning is a
    convenience — the watcher is what guarantees progress. A stalled or unconfirmable
    merge = BLOCKED handoff; report it, never branch the next phase off the wrong base.
11. **Phase log** `docs/log/<phase>.md` before merging: ≤ 12 lines "Built", ≤ 8
    "Decisions", ≤ 8 "Known issues", ≤ 6 "Where the next phase looks first", one line
    "Verification: verify green on <commit>". Longer → cut.
12. **Orientation read.** A fresh session reads: its prompt file, plan §1 and §4, its
    own §5/§6 section, the phase table, the §9 index, `docs/decisions-needed.md`, and
    the `docs/log/<phase>.md` of each phase in its Depends-on cell. Nothing else unless
    a task needs it (the schema file is always fair game).
13. **Polish cap** per phase: ONE screenshot pass (≤ 5 pages × 2 widths, after the last
    code change, saved under `docs/screenshots/` which is git-ignored — attach to the PR
    or describe), ONE Lighthouse run only where the exit criteria name a number, verify
    runs unlimited while fixing but only the final green run is reported, the PR body is
    written once (≤ 25 lines). Improvement ideas after the exit criteria pass go to §10,
    not to commits. A phase still polishing at minute 60 stops polishing.
14. **Silence is never progress.** All GitHub state checks via `mcp__github__*` tools —
    never curl/gh against api.github.com. Every wait has a deadline and a "could not
    determine" branch that reports. No session ends a turn "waiting for CI": it ends
    merged, or with a stated blocker.
15. **Decisions travel by files, never by messages.** To change what a running phase
    will do, edit its prompt file on main (phases re-read their prompt from main before
    opening the PR). Nobody messages a running build session.

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
Build in this order so every WIP commit is a checkpoint: (0) process fixes below →
(1) ledger charge path + integration test harness → (2) intake → (3) matching →
(4) accept → (5) expiry → (6) photos → (7) notifications → (8) spoke API → (9) watcher.
- **Review fixes first** (`docs/review-2026-09-11.md` §2): F1 sessions re-check
  `users.status` (suspended = no session; test), F2 production refuses the default
  admin password (seed + `assertProductionEnv`), F3 one rate limiter shared by lead
  intake and `/api/auth/login`, F5 `recomputeBalance` locks the row, F6 health
  `detail` hidden in production, F7 no domain literals in `src/`.
- **Integration tests on real MySQL 8:** add a `mysql:8` service to the ONE CI job (same
  workflow, same job — §1.11 allows it), `tests/integration/*.test.ts` run when
  `DATABASE_URL` is set and skip with a visible notice otherwise; `npm run
  test:integration` documented in README. Ledger concurrency, matching rotation, accept
  idempotency, expiry and the spoke endpoint are tested here, not with fakes.
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
- **Watcher:** create the hourly Sonnet Routine per `prompts/_watcher.md` before
  opening the PR (it is idempotent to re-create; check `list_triggers` first).
- Exit: `npm run verify` green; integration suite green in CI against MySQL 8 (ledger
  concurrency, matching rotation, accept idempotency, expiry, spoke endpoint with
  seeded token); E2E happy path scripted (create lead → assignments exist → accept via
  token → charge → reveal); review fixes F1–F7 landed with tests; watcher Routine
  exists; CI green; PR merged.

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
- Review fix F8: admin may open `/panel?as=<proId>` read-only (server-guarded);
  `src/middleware.ts` adjusted accordingly.
- Password reset: admin action "reset password" that sets a temporary password shown
  once (KNOWN-ISSUES item from opus-1).
- Exit: full lifecycle demo script (register pro → admin verifies → lead → offer →
  accept → charge → review link → publish) passes as an integration test; authorization
  tests (masking, cross-pro isolation, admin-only routes) green; verify green; CI green;
  PR merged. Then create nothing new — spawn lane 2 per `prompts/_handoff.md`.

## §6 Sonnet phases (lane 2 — parallel, plus the final pass)

All four lane-2 phases branch off main after opus-3 merges and run at the same time.
They never touch each other's files (phase table Owns). Content is data in
`content/**` (markdown/JSON with a documented key shape); pages are thin renderers of
that data. The wiring between phases (page ↔ content ↔ SEO builders) is sonnet-5's job,
so each lane-2 phase must ship something that renders on its own with stubs.

### §6.1 sonnet-1-public-site
Hard limits §4.7. Skills: `nextjs-national-lead-gen` (pattern menu, conversion
patterns), `paraguay-business-apps` (market copy rules), `higgsfield-web-imagery` only
to read the slot conventions (images themselves are sonnet-3).
- Design system "Confianza Local": tokens in `globals.css`, `src/components/**`
  (buttons, cards, form controls, layout shell, WhatsApp CTA, verified badge, step
  wizard), mobile-first, no template look, no fabricated trust signals.
- Pages under `src/app/(public)/`: home (hero = the 3-step lead form entry),
  `/[category]`, `/[category]/[zone]`, `/profesional/[slug]`, `/como-funciona`,
  `/para-profesionales`, `/gracias`, `/guias` index + `/guias/[slug]` template. Content
  loaders in `src/lib/content/**` read `content/**`; until sonnet-2 lands, ship ONE
  sample category copy file and ONE sample guide in `content/_samples/` (sonnet-2 owns
  the real files) so the templates render.
- Restyle the opus-2/3 flows (lead wizard, accept page, panel, admin, registration,
  review form) — presentation only, logic and route contracts untouched.
- Exit: every page above renders and is responsive at 390 px and 1280 px; Lighthouse
  mobile ≥ 90 performance + SEO on home and one category page (numbers in the log);
  zero hardcoded UI strings; verify green; PR merged.

### §6.2 sonnet-2-content
Hard limits §4.7. Skills: `paraguay-business-apps`; anti-fabrication: no invented
counts, testimonials or logos anywhere.
- `content/categories/<slug>.md` for the 5 launch categories: ≥ 400 words each of
  useful es-PY copy (precios orientativos as ranges marked "orientativo 2026", FAQs,
  cuándo llamar a un profesional), frontmatter per the key shape sonnet-1 documents in
  `content/README.md` (if that file does not exist yet, write it from the sample in
  `content/_samples/` — the key shape is the contract, sonnet-5 reconciles).
- `content/guias/*.md`: ≥ 10 "¿Cuánto cuesta …?" guides across the 5 categories,
  ≥ 500 words each, Gs ranges marked orientativo, FAQ block, CTA data pointing to the
  lead form with the category preselected. Same-shaped units → template + one exemplar
  first, then fan out per `fable-directs-sonnet-builds` §Fan-out.
- `content/legal/terminos.md`, `privacidad.md` — plain honest Spanish; "pending lawyer
  review" in the phase log.
- Exit: every file validates against the documented frontmatter (a small script under
  `scripts/validate-content.mjs` — sonnet-2 owns it); word counts met; verify green;
  PR merged.

### §6.3 sonnet-3-seo-imagery
Hard limits §4.7. Skills: `higgsfield-image-pipeline` then `webimg-pipeline` (images),
`nextjs-national-lead-gen` §SEO.
- `src/lib/seo/**`: metadata builders per page type, JSON-LD builders (Organization,
  Service, FAQPage, LocalBusiness only where truthful — never AggregateRating without
  real published reviews), canonical rules. Pure functions with unit tests; the pages
  call them in sonnet-5.
- `src/app/sitemap.ts` (active categories × zones, pros, guides — via the opus query
  modules and the content loaders' public API), `src/app/robots.ts`,
  `src/app/opengraph-image.tsx`.
- Imagery: generate per the image pipeline skills within budget into `public/img/**`
  with `content/images.json` mapping slot → file + alt. If MCP/credits/network block:
  tasteful SVG placeholders in the same slots, note in the log — never block.
- Exit: sitemap and robots render; JSON-LD builders unit-tested and validated with the
  Rich Results test on sample output (document how); OG image renders; image slots
  filled or placeholdered; verify green; PR merged.

### §6.4 sonnet-4-deploy-crm
Hard limits §4.7. Skills: `nextjs-deploy-hostinger`, `nodejs-mysql-hostinger-stack`,
`vendercrm-lead-capture`.
- `docs/deploy.md` executable by Anton without guessing: hPanel Node app import, full
  env var list marking secrets, `UPLOADS_DIR` persistent path outside the build output,
  Remote MySQL/IP notes, domain mapping for profesionales.com.py, migrate + production
  seed commands, post-deploy checks (`/api/health`, `scripts/verify-live.mjs`).
- `scripts/seed-prod.ts`: categories/zones/packs/settings/admin only — no demo pro.
- VenderCRM export: verify end-to-end against the `.env.example` contract with a
  recorded fixture; fix inside `src/lib/vendercrm/**` only.
- Exit: `next build && next start` boots with a prod-like `.env`; deploy doc complete;
  prod seed idempotent; CRM no-op path and live-shape path tested; verify green; PR merged.

### §6.5 sonnet-5-link-pass (final, sequential)
Runs when sonnet-1..4 are all merged. Owns every cross-cutting edit.
- Wire `content/**` into the sonnet-1 pages (real category copy and guides replace the
  samples; delete `content/_samples/`), call the `src/lib/seo` builders from every
  public page, put images from `content/images.json` into their slots, add nav links,
  hub cards, guide cross-links, legal pages in the footer, sitemap sanity.
- Production QA through every flow (lead submit → match → accept, pro register → admin
  verify → credit grant → review publish) on `next build && next start`; fix findings.
- Sweep phase logs: promote still-open cross-phase items to `KNOWN-ISSUES.md`, fix the
  cheap ones.
- Delete the watcher Routine. Closing report to Anton: live-readiness checklist, §7
  status, numbered manual steps (hPanel, env vars, DNS, first admin login, seed, first
  credits, pro recruitment kickoff), remaining KNOWN-ISSUES, suggestion to create a
  `profesionales-dev` project skill.
- Exit: production build QA checklist all green or consciously waived; sitemap covers
  every public page; Lighthouse mobile ≥ 90 on home + one category + one guide; verify
  green; PR merged; watcher deleted; STOP.

## §7 Human-inputs checklist

| Input | Needed by | Notes |
|---|---|---|
| **Auto-merge preflight** | before opus-1 | (a) Repo Settings → General → Pull Requests → tick "Allow auto-merge". (b) Branch protection on `main` requiring the CI check (`check`). Both off by default. Without them every phase stalls at its first PR. |
| CI approval | before opus-1 | Merging this plan = your yes to the ONE workflow in §1.11 (incl. the MySQL service container added in opus-2). |
| Hostinger Node.js slot + MySQL DB + creds | sonnet-4 (docs), you (deploy) | Which account/slot to use; DATABASE_URL. |
| profesionales.com.py DNS → Hostinger | you, at go-live | |
| SMTP creds (optional) | opus-2 | Degrades to dashboard-only notifications. |
| VenderCRM API URL + tenant key | sonnet-4 verify | Degrades to no-op export. |
| Business WhatsApp number | sonnet-1 copy | For "hablá con nosotros" CTAs. |
| Higgsfield credits (optional) | sonnet-3 | Placeholders otherwise. |
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

## §9 Build log index

One line per phase. The detail lives in `docs/log/<phase>.md`; sessions read only the
logs of the phases they depend on (§4.12).

| Phase | PR | Merged | Log |
|---|---|---|---|
| plan | #1 | 2026-09-01 | — |
| opus-1 | #2 | 2026-09-01 | `docs/log/opus-1.md` |
| review | (this PR) | — | `docs/review-2026-09-11.md` |

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
