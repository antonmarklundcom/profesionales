# Phase opus-3 — Pro dashboard, admin, reviews. OPUS session. Lane 1. Only after opus-2 is merged.

Read ONLY: this file, `plan.md` §1, §2, §4, §5.3, the phase table and §9 index,
`docs/decisions-needed.md`, `docs/log/opus-1.md`, `docs/log/opus-2.md`. Do not read the
rest. Execute under the autonomy protocol §4. Build nothing outside the plan.

Owns: see the phase table row for opus-3 (plus the §4.9 append-only exceptions).

Budget: one session. Order: registration + VenderCRM export → pro panel → admin →
reviews → F8 + password reset → lifecycle integration test. WIP commit + push every 30 min.

Phase rules:
- Any branch name; PR title `Phase opus-3: pro dashboard, admin, reviews`. Arm auto-merge.
- Skills: `vendercrm-lead-capture` (export must no-op gracefully without VENDERCRM_*),
  `nodejs-mysql-hostinger-stack`. Missing skill → nearest equivalent, note it, keep going.
- All credit granting via the opus-2 ledger module — never write balances directly.
- Customer data masked in the pro inbox until `accepted`; prove it with a test, and that
  pro A never sees pro B's assignments or ledger.
- Pack purchase page: manual payment instructions only (bank transfer / Tigo Money +
  WhatsApp). No gateway.
- Admin metrics include median time-to-first-accept per category (plan §1.15).
- Review fix F8 (admin read-only `/panel?as=<proId>`) and the admin "reset password"
  action (temporary password shown once).
- Functional, plain UI; sonnet-1 restyles. Every string through i18n.
- Re-runnable; minor issues → `docs/log/opus-3.md`; stop only per §4.4.

Exit: lifecycle integration test passes (register pro → CRM call attempted → admin
verifies → lead → offer → accept → charge → review link → publish → aggregates update);
authorization tests (masking, cross-pro isolation, admin-only routes, suspended user
locked out) green; `npm run verify` green; CI green; PR merged.

## After this phase — MODEL SWITCH, lane 2 starts
Follow `prompts/_handoff.md`: confirm the watcher Routine exists, then spawn sonnet-1,
sonnet-2, sonnet-3 and sonnet-4 at once, model **Sonnet**. If `create_session` is
unavailable, STOP and report the four prompt files to paste — do not continue in this
window across the model switch.
