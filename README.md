# profesionales.com.py

Offerta-style lead marketplace for local services in Paraguay. A customer posts a job in
30 seconds, up to 3–4 matched and verified professionals receive the lead, and pros pay
per lead through a credit ledger. WhatsApp-first, web-only, no customer accounts.

The full product decisions live in [`plan.md`](./plan.md); phase prompts live in
[`prompts/`](./prompts). Read those before changing anything structural — the schema in
particular is fixed for the whole build (plan §2).

**Stack:** Next.js 15 (App Router) + TypeScript + Drizzle ORM + MySQL, deployed on
Hostinger managed Node.js hosting (`output: "standalone"`).

## Getting started

```bash
npm install
cp .env.example .env        # fill in DATABASE_URL and AUTH_SECRET at minimum
npm run db:migrate          # apply drizzle/ migrations
npm run db:seed             # categories, zones, packs, settings, admin user
npm run dev                 # http://localhost:3000
```

Then log in at `/ingresar` with `ADMIN_EMAIL` / `ADMIN_PASSWORD`. An admin lands on
`/admin`, a professional on `/panel`.

### Database

`DATABASE_URL` is a MySQL connection string:

- **On Hostinger (the live app):** the host is `localhost` — that value is set once in
  hPanel → Environment Variables. Changing the MySQL password later without updating
  this variable crashes the live site with a generic "Application error" page.
- **Local dev against Hostinger MySQL:** use the host shown under
  hPanel → Databases → **Remote MySQL**, and whitelist your public IP there first.
  A rotating home IP shows up as `Access denied for user '...'@'<ip>'`.
- **`tsx` does not auto-load `.env`.** `drizzle-kit` does, so a migration can succeed
  while `npm run db:seed` fails with `ECONNREFUSED` (mysql2 silently falling back to
  localhost). Export the variable for the shell first:

  ```bash
  export DATABASE_URL="mysql://user:pass@host:3306/dbname"   # PowerShell: $env:DATABASE_URL = "..."
  npm run db:seed
  ```

`npm run db:push` pushes the schema without a migration file — convenient on a scratch
database, but `db:migrate` is what production uses.

The seed is **idempotent**: re-running it never duplicates rows and never resets
admin-edited category prices or `max_pros_per_lead` back to defaults.

`GET /api/health` reports app and database status separately — the first thing to check
after a deploy.

## Scripts

| Script | What it does |
|---|---|
| `npm run dev` | Development server |
| `npm run build` / `npm start` | Production build (standalone) and server |
| `npm run verify` | typecheck → lint → unit tests → build. **The gate before every push.** |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint |
| `npm run test` | Vitest unit tests |
| `npm run db:generate` | Generate a migration from `src/db/schema.ts` |
| `npm run db:migrate` | Apply migrations |
| `npm run db:push` | Push the schema directly (dev) |
| `npm run db:seed` | Seed reference data + admin user |

## Layout

```
src/
  app/              routes — /, /ingresar, /panel (professional), /admin (admin)
  db/               schema.ts (the COMPLETE schema, plan §2) + the connection
  lib/
    auth/           password hashing, signed session cookie, server-side role guards
    credits/        the credit ledger — the single owner of all balance math
    i18n/           typed t() over locales/es.json
    ids.ts          slugs, public codes, tokens, Paraguayan phone normalization
    env.ts          env access with graceful fallbacks
    brand.ts        brand name / site URL from config, never hardcoded
  middleware.ts     route gating for /admin and /panel
scripts/seed.ts     idempotent seed
drizzle/            generated migrations
locales/es.json     every user-facing string
tests/              unit tests (ledger math, helpers, auth, role guards)
```

## Conventions that later phases must keep

- **The schema is complete and frozen.** Every table the whole build needs already
  exists (plan §2). Adding a table or column is a stop-and-ask, not a routine change.
- **All money is guaraníes as whole integers.** No decimals, no floats anywhere.
  Ratings follow the same rule: `professionals.avg_rating_x100` is the average scaled
  by 100 (450 = 4.50 stars).
- **`credit_transactions` is the authority on balance.** `professionals.credit_balance_gs`
  is a cache written in the same transaction. Only `src/lib/credits/ledger.ts` does
  balance math, and every write carries an idempotency key.
- **No user-facing string is written inline.** Everything goes through `t()` against
  `locales/es.json`, in Paraguayan Spanish ("vos" register).
- **Brand name and site URL come from `NEXT_PUBLIC_*` config**, never hardcoded — the
  same engine may serve a second customer-facing domain later (plan §1.13).
- **Authorization is server-side.** A hidden link is UX; `requireRole` / `requireRolePage`
  is the security boundary. The middleware is a first pass, not the guarantee.
- **One CI workflow, ever** (plan §1.11). The pre-commit hook blocks new workflow files.

## Deployment

Full hPanel steps are written in phase sonnet-3 (`docs/deploy.md`). In short: Hostinger
imports the repo, runs `npm run build` / `npm start`, and every variable in
`.env.example` must exist in hPanel → Environment Variables before the first deploy.
Environment variable changes require a **redeploy**, not just a restart.
