# Phase sonnet-2 — Content: category copy, price guides, legal. SONNET session. Lane 2, parallel.

Read ONLY: this file, `plan.md` §1, §4, §6 intro, §6.2, the phase table and §9 index,
`docs/decisions-needed.md`, `docs/log/opus-3.md`, and `content/README.md` +
`content/_samples/` if they exist on main yet. Do not read the rest. Execute under §4.

Owns: `content/**` (except `content/images.json`), `scripts/validate-content.mjs`,
`locales/es.json` keys under `content.*` only, plus §4.9 exceptions.
HARD LIMITS (§4.7) apply. You write no page components — sonnet-1 owns rendering,
sonnet-5 wires your files in.

Budget: one session, ≤ 90 min. Open the PR the turn the exit criteria pass.

Phase rules:
- Any branch name; PR title `Phase sonnet-2: content`. Arm auto-merge on open.
- Skills: `paraguay-business-apps` (market copy, Gs formatting). Anti-fabrication: no
  invented counts, testimonials, logos or named clients.
- If `content/README.md` is not on main yet, define the frontmatter yourself (title,
  slug, category, meta_description, price_ranges[], faq[], cta) and write
  `content/README.md`; sonnet-5 reconciles with sonnet-1's loaders.
- 5 category files ≥ 400 words; ≥ 10 guides ≥ 500 words across the 5 categories, Gs
  ranges marked "orientativo 2026", FAQ block, CTA with category preselected.
- Same-shaped units: write the template + one exemplar guide, then fan out the rest as
  parallel Sonnet subagents per `fable-directs-sonnet-builds` §Fan-out; one validate, one PR.
- Legal pages plain and honest; "pending lawyer review" in the phase log.
- Re-runnable; minor issues → `docs/log/sonnet-2.md`; stop only per §4.4.

Exit: `node scripts/validate-content.mjs` passes (frontmatter shape + word counts) and
is wired into `npm run verify`; 5 category files, ≥ 10 guides, 2 legal pages; `npm run
verify` green; CI green; PR merged.

## After this phase
Follow `prompts/_handoff.md`. Spawn nothing.
