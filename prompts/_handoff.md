# Handoff — what every phase does when its exit criteria pass (plan §4.10)

Four gates, in order. Do not skip one because the previous took long.

1. **Merge verified** via `mcp__github__*` tools only: PR state `merged`; `git fetch
   origin main` contains your phase commit; the `check` run on the merge commit is green.
   Auto-merge was armed when the PR opened (§4.2). If it never merges: state the blocker
   in your phase report (usually a §7 preflight setting), and end — never hand off on an
   unmerged phase.
2. **Exit checklist** from your prompt, each item ticked with evidence.
3. **Pre-handoff audit**: ONE `npm run verify` on main, ONE adversarial re-read of the
   merged diff, findings fixed in ONE follow-up commit (own PR, auto-merge). No second round.
4. **Phase log** `docs/log/<phase>.md` (§4.11 shape) committed, and its line added to
   plan §9's index. Both may ride in the phase PR or the follow-up commit.

Then spawn, per lane:

- **Lane 1 (opus-2 → opus-3):** `mcp__Claude_Code_Remote__create_session` with the
  repo as `source_url`, `source_revision` `main`, inherit environment and permission mode
  (never `plan`), `model` set explicitly per the phase table (an Opus id — never Fable),
  `title` `Phase <next-id>`, `prompt` exactly:
  `Read prompts/<next-file>.md in this repo and execute it.`
- **opus-3 (last lane-1 phase):** confirm the watcher Routine exists (`list_triggers`;
  create it per `prompts/_watcher.md` if opus-2 did not), then spawn sonnet-1, sonnet-2,
  sonnet-3 and sonnet-4 the same way, `model` a Sonnet id, all four at once.
- **Lane 2 (sonnet-1..4):** spawn nothing. End with the phase report.
- **sonnet-5:** delete the watcher Routine (`delete_trigger`), then STOP with the closing
  report (plan §6.5).

If `create_session` is unavailable (local CLI): same model as the next phase → continue
in this window; model switch → stop and report which prompt to paste next. The watcher
restarts anything that does not start on its own; spawning is a convenience.

Phase report (the session's last message, ≤ 20 lines): PR link, what now exists,
decisions, known issues, what was spawned, anything in `docs/decisions-needed.md`.
