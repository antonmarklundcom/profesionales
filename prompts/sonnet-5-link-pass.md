# Phase sonnet-5 — Link pass, production QA, closing report. SONNET session. FINAL. Only after sonnet-1..4 are all merged.

Read ONLY: this file, `plan.md` §1, §4, §6.5, §7, the phase table and §9 index,
`docs/decisions-needed.md`, `docs/log/sonnet-1.md` … `sonnet-4.md`, `content/README.md`.
Execute under §4. You own every cross-cutting edit; you still make no §4.7 logic changes.

Budget: one session, ≤ 90 min. Open the PR the turn the exit criteria pass.

Phase rules:
- Any branch name; PR title `Phase sonnet-5: link pass`. Arm auto-merge on open.
- Wire: real `content/**` into the sonnet-1 pages (delete `content/_samples/`), the
  `src/lib/seo` builders into every public page's `generateMetadata` + JSON-LD, images
  from `content/images.json` into their slots, nav + footer (legal pages), hub cards,
  guide ↔ category cross-links, sitemap sanity against the rendered routes.
- Production QA on `next build && next start` through every flow (lead submit → match
  → accept; register → verify → credit grant → review publish). Fix what you find.
- Sweep `docs/log/*.md` Known-issues sections: fix the cheap ones, promote the rest to
  `KNOWN-ISSUES.md` with owner + priority.
- ONE screenshot pass, ONE Lighthouse run (home, one category, one guide). No polishing
  past minute 60.
- Re-runnable; stop only per §4.4.

Exit: QA checklist in the log all green or consciously waived; sitemap covers every
public page; Lighthouse mobile ≥ 90 on the three pages; `npm run verify` green; CI
green; PR merged.

## After this phase — STOP
Verify the merge (handoff gates a–d), delete the watcher Routine (`delete_trigger`),
then end with the closing report to Anton (plan §6.5): live-readiness, §7 status,
numbered manual steps, remaining KNOWN-ISSUES, next business moves (plan §11), and the
suggestion to create a `profesionales-dev` project skill. Spawn nothing.
