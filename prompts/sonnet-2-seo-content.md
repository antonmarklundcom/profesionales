# Phase sonnet-2 — SEO, content, imagery, CRM wiring. Paste into a fresh SONNET session, ONLY after phase sonnet-1 is merged.

Read `plan.md` FIRST, in full — plus §9 build log and `KNOWN-ISSUES.md`. Execute plan
§6.2 under the autonomy protocol §4. Build nothing outside the plan.

HARD LIMITS (§4.7): no schema, auth, credit-ledger, or matching-logic changes. Data
access only through the query layer Opus built. Needed change ⇒ workaround + §10 note.

Phase rules:
- Branch `phase/sonnet-2` off latest main. Previous phase unmerged ⇒ finish it first.
- Load skills at the matching step: `seo-web-builds` (metas, JSON-LD, sitemap,
  anti-fabrication), `higgsfield-web-imagery` (image slots + budget),
  `vendercrm-lead-capture` (verify export contract). If a named skill is missing, use
  the nearest equivalent, note it in the build log, keep going — never stop.
- JSON-LD only where truthful — no fake AggregateRating, no invented review counts.
- Category page copy: unique, useful es-PY content ≥400 words each (orientative price
  ranges clearly marked "orientativo", FAQs, when-to-call guidance). No filler.
- Imagery: stay inside the Higgsfield budget rules; if MCP or credits are unavailable,
  ship tasteful CSS/SVG placeholders + KNOWN-ISSUES note — never block on images.
- Legal pages in plain honest Spanish; add "pending lawyer review" to KNOWN-ISSUES.
- Re-runnable; minor issues → KNOWN-ISSUES.md; stop only per §4.4.

Exit: sitemap.xml + robots.txt correct and covering all active public pages; JSON-LD
validates (document how it was checked); unique metadata per page type; OG images
present; 5 category pages meet the content bar; VenderCRM wiring verified against the
`.env.example` contract (no-op path tested); `npm run verify` green; CI green; PR merged.

## After this phase — hand off to the next (fresh session)
Follow §4.9 exactly: verify the merge via `mcp__github__*`, pass the exit checklist, run
the pre-handoff audit, commit the §9 build-log entry. Then spawn a NEW session via
claude-code-remote `create_session` — inherit environment + permission mode (never
`plan`), model **Sonnet** (never Fable), prompt exactly:
`Read prompts/sonnet-3-deploy-polish.md in this repo and execute it.` End with the phase
report. If `create_session` is unavailable, continue in this window (same model). Never
hand off on an unverified or stalled merge — report per §4.11 instead.
