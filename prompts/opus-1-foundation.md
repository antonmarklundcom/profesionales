# Phase opus-1 — Foundation. Paste into a fresh OPUS session (first phase; plan.md must be merged to main).

Read `plan.md` FIRST, in full — plus §9 build log and `KNOWN-ISSUES.md` (create it if
missing). Execute plan §5.1 under the autonomy protocol §4. Build nothing outside the plan.

Phase rules:
- Branch `phase/opus-1` off latest main.
- Load skills at the matching step: `nodejs-mysql-hostinger-stack` (scaffold, Drizzle/MySQL
  patterns), `nextjs-deploy-hostinger` (env/port/standalone conventions),
  `budgeted-runner-deploy` (CI shape — the one workflow is pre-approved in plan §1.11).
  If a named skill is missing from this account, use the nearest equivalent, note the
  substitution in the build log, keep going — never stop.
- Write the COMPLETE §2 schema now, even tables only later phases use. Schema is never
  retrofitted.
- Delete any template-generated workflow files before first commit; only the §1.11
  workflow may exist under `.github/`.
- No real DB available in-session ⇒ unit-test with mocks where possible, document
  `db:push` + seed steps in README, and mark DB-dependent exit items "verified by test,
  pending live DB" in the build log — do not stall.
- Re-runnable; minor issues → KNOWN-ISSUES.md; stop only per §4.4.

Exit: fresh clone + `.env` → migrate + seed documented and scripted; `npm run verify`
(typecheck, lint, unit tests, build) green; admin login works; role-guard tests prove a
professional cannot reach `/admin`; CI green on the PR; PR merged.

## After this phase — hand off to the next (fresh session)
Follow §4.9 exactly: verify the merge via `mcp__github__*` (PR merged, origin/main
contains the commit, checks green), pass the exit checklist, run the pre-handoff audit,
commit the §9 build-log entry. Then spawn a NEW session via claude-code-remote
`create_session` — inherit environment + permission mode (never `plan`), model **Opus**
(never Fable), prompt exactly: `Read prompts/opus-2-lead-engine.md in this repo and
execute it.` End with the phase report. If `create_session` is unavailable, continue in
this window (same model). Never hand off on an unverified or stalled merge — report per
§4.11 instead.
