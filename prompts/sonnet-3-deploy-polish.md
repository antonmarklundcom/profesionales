# Phase sonnet-3 — Deploy prep, QA, closing report. Paste into a fresh SONNET session, ONLY after phase sonnet-2 is merged. FINAL PHASE.

Read `plan.md` FIRST, in full — plus §9 build log and `KNOWN-ISSUES.md`. Execute plan
§6.3 under the autonomy protocol §4. Build nothing outside the plan.

HARD LIMITS (§4.7): no schema, auth, credit-ledger, or matching-logic changes. Data
access only through the query layer Opus built. Needed change ⇒ workaround + §10 note.

Phase rules:
- Branch `phase/sonnet-3` off latest main. Previous phase unmerged ⇒ finish it first.
- Load skills at the matching step: `nextjs-deploy-hostinger` (the verified Hostinger
  playbook — follow its known fixes exactly), `nodejs-mysql-hostinger-stack`. If a
  named skill is missing, use the nearest equivalent, note it in the build log, keep
  going — never stop.
- `docs/deploy.md` must be executable by Anton without guessing: exact hPanel clicks,
  full env var list with which are secrets, Remote MySQL/IP whitelisting notes, domain
  mapping for profesionales.com.py, migration + production-seed commands (production
  seed = categories/zones/packs only, NO demo pro, admin from env).
- QA the production build (`next build && next start`) through every flow: lead submit,
  match, accept, pro register, admin verify, credit grant, review publish. Fix findings.
- Sweep KNOWN-ISSUES.md: fix the cheap ones, keep the rest honest and prioritized.
- Re-runnable; minor issues → KNOWN-ISSUES.md; stop only per §4.4.

Exit: production build boots clean with prod-like env; QA checklist in build log all
green or consciously waived with reasons; `docs/deploy.md` complete; `npm run verify`
green; CI green; PR merged.

## After this phase — STOP. Do not spawn any further session.
Verify the merge via `mcp__github__*` (§4.9 gates a–d), then end with the closing
report to Anton: what is live-ready; the §7 human-inputs status; exact numbered manual
steps (Hostinger app setup, env vars, DNS for profesionales.com.py, first admin login,
seeding, granting first credits); remaining KNOWN-ISSUES; and the §11 next business
moves (pro recruitment kickoff). Suggest he create a `profesionales-dev` project skill
capturing final schema, routes, and guardrails.
