# Phase opus-2 — Lead engine. Paste into a fresh OPUS session, ONLY after phase opus-1 is merged.

Read `plan.md` FIRST, in full — plus §9 build log and `KNOWN-ISSUES.md`. Execute plan
§5.2 under the autonomy protocol §4. Build nothing outside the plan.

Phase rules:
- Branch `phase/opus-2` off latest main. Previous phase unmerged ⇒ finish it first.
- Load skills at the matching step: `nodejs-mysql-hostinger-stack` (query-layer
  patterns). If a named skill is missing, use the nearest equivalent, note it in the
  build log, keep going — never stop.
- The credit ledger module is the money math: every balance mutation goes through it, in
  one DB transaction, with idempotency keys. This is the highest-stakes code of the
  whole build — test double-accept, concurrent accept, and cache-vs-SUM equality.
- Matching, accept-token, and expiry logic exactly per §5.2; snapshot the price on the
  assignment at offer time, never read the live category price at accept time.
- UI in this phase is minimal and unstyled — do not spend effort on design; Sonnet
  restyles everything in sonnet-1.
- Normalize all phone input to +595 e164; reject non-Paraguayan mobiles with a clear
  es-PY message (through i18n).
- Lead photos (§5.2): validate type/size server-side, store under UPLOADS_DIR, serve
  through an authorized route handler only — accepted pro or admin; never public,
  never pre-accept. Test the authorization.
- Re-runnable; minor issues → KNOWN-ISSUES.md; stop only per §4.4.

Exit: `npm run verify` green including ledger idempotency/concurrency tests, matching
rotation tests, accept-flow test (charge + reveal + wa.me link), assignment-expiry test,
and spoke-API test with a seeded token; scripted E2E happy path passes; CI green; PR merged.

## After this phase — hand off to the next (fresh session)
Follow §4.9 exactly: verify the merge via `mcp__github__*`, pass the exit checklist, run
the pre-handoff audit, commit the §9 build-log entry. Then spawn a NEW session via
claude-code-remote `create_session` — inherit environment + permission mode (never
`plan`), model **Opus** (never Fable), prompt exactly: `Read prompts/opus-3-pro-admin.md
in this repo and execute it.` End with the phase report. If `create_session` is
unavailable, continue in this window (same model). Never hand off on an unverified or
stalled merge — report per §4.11 instead.
