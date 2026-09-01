# Phase opus-3 — Pro dashboard, admin, reviews. Paste into a fresh OPUS session, ONLY after phase opus-2 is merged.

Read `plan.md` FIRST, in full — plus §9 build log and `KNOWN-ISSUES.md`. Execute plan
§5.3 under the autonomy protocol §4. Build nothing outside the plan.

Phase rules:
- Branch `phase/opus-3` off latest main. Previous phase unmerged ⇒ finish it first.
- Load skills at the matching step: `vendercrm-lead-capture` (pro-signup export — must
  no-op gracefully when VENDERCRM_* env is unset), `nodejs-mysql-hostinger-stack`.
  If a named skill is missing, use the nearest equivalent, note it in the build log,
  keep going — never stop.
- All credit granting in admin goes through the opus-2 ledger module — never write
  balances directly.
- Customer data stays masked in the pro inbox until an assignment is `accepted`; prove
  it with a test (pro A also never sees pro B's assignments or ledger).
- Pack purchase page shows manual payment instructions only (plan §1/§3) — build no
  payment gateway.
- Functional-but-plain UI is fine; Sonnet restyles in sonnet-1. Every string through i18n.
- Re-runnable; minor issues → KNOWN-ISSUES.md; stop only per §4.4.

Exit: scripted full-lifecycle demo passes (register pro → VenderCRM call attempted →
admin verifies → lead → offer → accept → charge → review link → publish → aggregates
update); authorization tests (masking, cross-pro isolation, admin-only routes) green;
`npm run verify` green; CI green; PR merged.

## After this phase — hand off to the next (fresh session) — MODEL SWITCH
Follow §4.9 exactly: verify the merge via `mcp__github__*`, pass the exit checklist, run
the pre-handoff audit, commit the §9 build-log entry. Then spawn a NEW session via
claude-code-remote `create_session` — inherit environment + permission mode (never
`plan`), model **Sonnet** (never Fable), prompt exactly:
`Read prompts/sonnet-1-public-site.md in this repo and execute it.` End with the phase
report. If `create_session` is unavailable, STOP and report — do not continue in this
window across the model switch. Never hand off on an unverified or stalled merge.
