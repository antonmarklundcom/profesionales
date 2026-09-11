# Phase sonnet-3 — Technical SEO, imagery, OG. SONNET session. Lane 2, parallel.

Read ONLY: this file, `plan.md` §1, §4, §6 intro, §6.3, the phase table and §9 index,
`docs/decisions-needed.md`, `docs/log/opus-2.md`, `docs/log/opus-3.md`. Do not read the
rest. Execute under §4.

Owns: the sonnet-3 row of the phase table, plus §4.9 exceptions.
HARD LIMITS (§4.7) apply. You do not edit page components — sonnet-5 calls your builders.

Budget: one session, ≤ 90 min. Open the PR the turn the exit criteria pass.

Phase rules:
- Any branch name; PR title `Phase sonnet-3: seo + imagery`. Arm auto-merge on open.
- Skills: `higgsfield-image-pipeline` FIRST, then `webimg-pipeline`, for every image;
  `nextjs-national-lead-gen` §SEO. Missing skill → nearest equivalent, note it, keep going.
- `src/lib/seo/**`: pure metadata and JSON-LD builders (Organization, Service, FAQPage,
  LocalBusiness only where truthful; never AggregateRating without real published
  reviews) with unit tests. `sitemap.ts`, `robots.ts`, `opengraph-image.tsx`.
- Imagery: define the slots (home hero, 5 categories, para-profesionales, guides
  default, OG) in `content/images.json`; generate within budget into `public/img/**`
  with SEO filenames + alt text. MCP/credits/network blocked → SVG placeholders in the
  same slots + phase log note; never block, never retry a known 403 twice.
- Re-runnable; minor issues → `docs/log/sonnet-3.md`; stop only per §4.4.

Exit: sitemap and robots render on `next start`; builders unit-tested and sample output
validated with the Rich Results test (say how); OG image renders; every slot in
`content/images.json` filled or placeholdered; `npm run verify` green; CI green; PR merged.

## After this phase
Follow `prompts/_handoff.md`. Spawn nothing.
