# Phase sonnet-1 — Public site & design. Paste into a fresh SONNET session, ONLY after phase opus-3 is merged.

Read `plan.md` FIRST, in full — plus §9 build log and `KNOWN-ISSUES.md`. Execute plan
§6.1 under the autonomy protocol §4. Build nothing outside the plan.

HARD LIMITS (§4.7): no schema, auth, credit-ledger, or matching-logic changes. Data
access only through the query layer Opus built. Needed change ⇒ workaround + §10 note.

Phase rules:
- Branch `phase/sonnet-1` off latest main. Previous phase unmerged ⇒ finish it first.
- Load skills at the matching step: `conversion-design` (Confianza Local direction),
  `web-design-system` (tokens, motion, QA gate), `paraguay-local-site` (market
  patterns), `seo-web-builds` (structure + anti-fabrication). If a named skill is
  missing, use the nearest equivalent, note it in the build log, keep going — never stop.
- Mobile-first: most traffic is mobile Meta ads. The home hero IS the lead form entry.
- NO fabricated trust signals — no invented counts, testimonials, or logos. Real
  mechanisms only (verification badge, "gratis y sin registro").
- Restyle the existing lead-form wizard, accept page, panel, and review form into the
  design system without touching their logic or route contracts.
- Every string through the i18n layer; es-PY "vos" register.
- Re-runnable; minor issues → KNOWN-ISSUES.md; stop only per §4.4.

Exit: home, 5 category pages, category×zone pages, pro profiles, cómo-funciona,
para-profesionales, and the `/guias/[slug]` price-guide template + index (with 1–2
sample guides) all styled and responsive; Lighthouse mobile ≥90 performance and SEO
on home + one category page (numbers in build log); zero hardcoded UI strings;
`npm run verify` green; CI green; PR merged.

## After this phase — hand off to the next (fresh session)
Follow §4.9 exactly: verify the merge via `mcp__github__*`, pass the exit checklist, run
the pre-handoff audit, commit the §9 build-log entry. Then spawn a NEW session via
claude-code-remote `create_session` — inherit environment + permission mode (never
`plan`), model **Sonnet** (never Fable), prompt exactly:
`Read prompts/sonnet-2-seo-content.md in this repo and execute it.` End with the phase
report. If `create_session` is unavailable, continue in this window (same model). Never
hand off on an unverified or stalled merge — report per §4.11 instead.
