# Phase opus-2 — Lead engine. OPUS session. Lane 1. Runs only after opus-1 is merged (it is).

Read ONLY: this file, `plan.md` §1, §2, §4, §5.2, the phase table and §9 index,
`docs/decisions-needed.md`, `docs/log/opus-1.md`, and `docs/review-2026-09-11.md` §2.
Do not read the rest. Execute under the autonomy protocol §4. Build nothing outside the plan.

Owns: see the phase table row for opus-2 (plus the §4.9 append-only exceptions).

Budget: one session. Build in the §5.2 order; WIP commit + push every 30 min — each
commit must leave main-mergeable, green code so a restart resumes cleanly.

Phase rules:
- Any branch name; PR title `Phase opus-2: lead engine`. Arm auto-merge when opening it.
- Skills at the matching step: `nodejs-mysql-hostinger-stack` (query-layer patterns),
  `paraguay-business-apps` (phone/WhatsApp rules), `claude-api` only to read the current
  Sonnet model id for the watcher. Missing skill → nearest equivalent, note it, keep going.
- Step 0 is the review fixes F1–F7 (`docs/review-2026-09-11.md` §2), each with a test.
- Step 1: MySQL 8 service in the existing CI job + `tests/integration/` harness (skips
  visibly without `DATABASE_URL`). From here on, ledger/matching/accept/expiry/spoke
  tests are integration tests against real transactions, not fakes.
- The ledger is the money math: every balance mutation via `applyTransaction` with
  `idempotencyKeyFor("lead_charge", assignmentId)`; test double-accept, concurrent
  accept, cache == SUM(ledger). Snapshot price at offer time; never read live price at accept.
- Phone input → +595 E.164; reject non-Paraguayan numbers with an i18n es-PY message.
- Photos: validate type/size server-side, store under `UPLOADS_DIR`, serve only through
  an authorized route (accepted pro or admin), never public, never pre-accept. Test it.
- UI minimal and unstyled — sonnet-1 restyles; every string through i18n.
- Step 9: create the watcher Routine per `prompts/_watcher.md` (check `list_triggers` first).
- Re-runnable; minor issues → `docs/log/opus-2.md`; stop only per §4.4.

Exit: `npm run verify` green; CI green with the integration suite running against
MySQL 8 (ledger concurrency, matching rotation, accept idempotency, expiry, spoke endpoint
with seeded token); scripted E2E happy path (lead → assignments → accept via token →
charge → reveal + wa.me link); F1–F7 landed with tests; `docs/spoke-api.md` written;
watcher Routine exists; PR merged.

## After this phase
Follow `prompts/_handoff.md`. Next: `prompts/opus-3-pro-admin.md`, model **Opus**.
