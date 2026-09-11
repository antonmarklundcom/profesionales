# Phase opus-1 — foundation (PR #2, merged 2026-09-01)

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
