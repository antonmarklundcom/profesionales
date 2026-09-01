# Known issues

Minor, non-blocking findings recorded per plan §4.3. Each entry says what it is,
why it was not fixed now, and which phase should pick it up.

## Open

- **`budgeted-runner-deploy` skill not available on this account** (opus-1).
  Its CI shape is fully specified in plan §1.11, so `.github/workflows/ci.yml`
  was written to that spec directly: one job, `ubuntu-latest`, `timeout-minutes`,
  `concurrency` with `cancel-in-progress`, `paths-ignore` for docs. No behaviour
  is missing — recorded only because the prompt asks that skill substitutions be
  logged.

- **No password-reset flow** (opus-1). Professionals who forget their password
  need an admin to reset it. The admin credit/user screens land in opus-3; a
  "reset password" action belongs there. Not blocking: pros are onboarded by
  hand during the recruitment phase (plan §11).

- **Uploads directory is local disk** (opus-1, matters from opus-2). `UPLOADS_DIR`
  points at a plain directory. On Hostinger it must be outside the build output
  or every deploy wipes the lead photos. The exact persistent path goes in
  `docs/deploy.md` in sonnet-3; opus-2 must not assume any path but `UPLOADS_DIR`.

- **MariaDB used for local verification, MySQL 8 in production** (opus-1). The
  migration, seed and full auth flow were verified against MariaDB 10.11 (the
  only server installable in the build container). Hostinger runs MySQL 8. The
  schema uses no MariaDB-specific syntax, but the first live `db:migrate` on
  Hostinger is still the real confirmation.

## Resolved

_(none yet)_
