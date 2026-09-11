# Phase sonnet-4 — Deploy docs, production seed, CRM verify. SONNET session. Lane 2, parallel.

Read ONLY: this file, `plan.md` §1, §4, §6 intro, §6.4, §7, the phase table and §9
index, `docs/decisions-needed.md`, `docs/log/opus-1.md`, `docs/log/opus-3.md`,
`KNOWN-ISSUES.md`. Do not read the rest. Execute under §4.

Owns: the sonnet-4 row of the phase table, plus §4.9 exceptions.
HARD LIMITS (§4.7) apply.

Budget: one session, ≤ 90 min. Open the PR the turn the exit criteria pass.

Phase rules:
- Any branch name; PR title `Phase sonnet-4: deploy + crm`. Arm auto-merge on open.
- Skills: `nextjs-deploy-hostinger` (follow its known fixes exactly),
  `nodejs-mysql-hostinger-stack`, `vendercrm-lead-capture`.
- `docs/deploy.md` executable by Anton without guessing: hPanel clicks, every env var
  and which are secrets, persistent `UPLOADS_DIR` outside the build output, Remote
  MySQL/IP notes, domain mapping, migrate + prod seed, post-deploy checks.
- `scripts/seed-prod.ts`: reference data + admin only, no demo pro, refuses to run
  without `ADMIN_PASSWORD`. `scripts/verify-live.mjs`: hits `/api/health`, home, one
  category page, sitemap on a given base URL.
- VenderCRM: test the no-op path and the live-shape path with a recorded fixture; fix
  only inside `src/lib/vendercrm/**`.
- Re-runnable; minor issues → `docs/log/sonnet-4.md`; stop only per §4.4.

Exit: `next build && next start` boots with a prod-like `.env` (documented values);
`docs/deploy.md` complete; prod seed idempotent (run twice in the integration suite);
CRM tests green; `npm run verify` green; CI green; PR merged.

## After this phase
Follow `prompts/_handoff.md`. Spawn nothing.
