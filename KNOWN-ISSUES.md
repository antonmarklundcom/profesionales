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

- **Review 2026-09-11 findings F1–F8** (`docs/review-2026-09-11.md` §2) — suspended
  users keep their session, default admin password accepted in production, no DB
  integration tests, non-transactional `recomputeBalance`, health endpoint leaks error
  detail, domain literals in `src/`, admins locked out of `/panel`. Assigned to opus-2
  (F1–F7) and opus-3 (F8); tracked there, not here.

- **No rate limiting on `POST /api/auth/login`** (opus-1). Password guessing is
  currently bounded only by bcrypt cost. opus-2 introduces rate limiting for the
  public lead form (plan §5.2) — apply the same limiter to the login route when
  it exists rather than building a second mechanism now.

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
