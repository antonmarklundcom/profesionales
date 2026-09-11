# Watcher — hourly Sonnet Routine. Read this file and execute it. Never Fable.

You are a fresh session fired by the Routine "profesionales watcher". You edit no code,
answer no design question, and message no running session. Finish within a few minutes.

Setup (done once by opus-2, re-checked by opus-3): `mcp__Claude_Code_Remote__create_trigger`
with `name` `profesionales watcher`, `cron_expression` `0 * * * *`,
`create_new_session_on_fire` true, `model` the current Sonnet id (from the `claude-api`
skill), `initiation` `human_schedule`, `prompt` exactly
`Read prompts/_watcher.md in this repo and execute it.` Check `list_triggers` first;
never create a second one.

Each firing:
1. Read plan.md's phase table and §9 index. Via `mcp__github__*`: list PRs (all states)
   whose title starts with `Phase <id>:`, and branches/commits for each phase.
2. Classify every phase not yet in §9: **merged** (PR merged) · **running** (a branch or
   open PR for it has a commit < 90 min old) · **stalled** (branch/PR exists, newest
   commit ≥ 90 min old, not merged) · **not started** (nothing exists) · **blocked**
   (its Depends-on phases are not all merged).
3. For a stalled or not-started phase whose dependencies are merged, and while fewer
   than 4 phases are running: spawn it with `create_session` exactly as
   `prompts/_handoff.md` describes (model per the phase table; never Fable). Prompts are
   re-runnable, so restarting a stalled phase is always safe.
4. An open PR that is green and has auto-merge armed but did not merge: merge it
   (`merge_pull_request`, squash). A red PR: leave it; its re-spawned session owns it.
5. When sonnet-1..4 are all merged and sonnet-5 is not started: spawn sonnet-5.
6. Read `docs/decisions-needed.md`. If it has entries not marked answered, send Anton a
   push notification with the questions verbatim (PushNotification tool if available;
   otherwise write them into the Routine run summary, which is emailed).
7. Count your firings in `docs/log/_watcher.md` (append one line: date, what you did).
   After 10 firings with the build still not done, or once sonnet-5 is merged, disable
   the Routine (`update_trigger` enabled false) and notify Anton.
