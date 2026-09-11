# Phase sonnet-1 — Design system + public pages. SONNET session. Lane 2, parallel with sonnet-2/3/4.

Read ONLY: this file, `plan.md` §1, §4, §6 intro, §6.1, the phase table and §9 index,
`docs/decisions-needed.md`, `docs/log/opus-2.md`, `docs/log/opus-3.md`. Do not read the
rest. Execute under the autonomy protocol §4. Build nothing outside the plan.

Owns: the sonnet-1 row of the phase table, plus §4.9 append-only exceptions.
HARD LIMITS (§4.7): no schema, auth, ledger, matching, upload or notification logic
changes; data only through `src/lib/**` query modules. Needed change ⇒ workaround + §10 note.

Budget: one session, ≤ 90 min. When the exit criteria pass, open the PR that turn (§4.13).

Phase rules:
- Any branch name; PR title `Phase sonnet-1: public site`. Arm auto-merge on open.
- Skills: `nextjs-national-lead-gen` (pattern menu, conversion patterns),
  `paraguay-business-apps`. Missing skill → nearest equivalent, note it, keep going.
- Mobile-first; the home hero IS the lead-form entry. NO fabricated trust signals.
- Content is data: write `content/README.md` documenting the frontmatter key shape for
  `content/categories/*.md` and `content/guias/*.md`, put ONE sample of each in
  `content/_samples/`, and build loaders in `src/lib/content/**`. sonnet-2 writes the
  real files to that shape; sonnet-5 swaps them in. Do not write real copy yourself.
- Restyle the opus-2/3 flows: presentation only, route contracts and logic untouched.
- Every string through i18n, es-PY "vos".
- Re-runnable; minor issues → `docs/log/sonnet-1.md`; stop only per §4.4.

Exit: home, `/[category]`, `/[category]/[zone]`, `/profesional/[slug]`, `/como-funciona`,
`/para-profesionales`, `/gracias`, `/guias` + `/guias/[slug]` render with the samples and
are responsive at 390 px and 1280 px; opus flows restyled; Lighthouse mobile ≥ 90
performance + SEO on home and one category page (numbers in the log); zero hardcoded UI
strings; `npm run verify` green; CI green; PR merged.

## After this phase
Follow `prompts/_handoff.md`. Spawn nothing.
