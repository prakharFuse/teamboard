---
name: gotchas
description: Non-obvious behaviors and known-red state before touching members.ts or db.ts
type: knowledge
scope: global
updated: 2026-09-16 (IONE-959)
captured_sha: 90b4e52c842667da0da95f034cf73a2c51089aee
sources:
  - server/src/routes/members.ts
  - server/src/routes/members.test.ts
  - server/src/db.ts
sources_sha256:
  server/src/db.ts: 5c963eb268abb53a32841c254096a8ec421692e72d0a5a780b1b07b67364666c
  server/src/routes/members.test.ts: 515b7b622a686614246e97acd832413e4c01cc4a75c774418b35aff28ca4277c
  server/src/routes/members.ts: 9ce9d96e34012c4b3799983e87e08ca6b5b0b5429ff1ddad2bdb9d0de75a9fb5
diverges_from:
  - source: .github/workflows/ci.yml:3-7
    claim: The members API contract test is intentionally RED on main until department validation (TM-105) lands, giving CI a genuine failing check for the Fix-CI/Refine-PR flow to pick up.
    reality: members.ts now validates department against a CANONICAL_DEPARTMENTS allowlist on both POST and PATCH, so the 'rejects an invalid department' test now passes — CI is green for that check, not intentionally red.
    authority: code
    detected: '2026-09-16'
    run: e685ec1c-0808-4e37-a7f5-968b1c554393
---

- **Department is validated against a fixed allowlist, not free text.** `CANONICAL_DEPARTMENTS` in `members.ts:16-19` (Engineering, Product, Design, Marketing, Sales, Operations, Finance, HR, Legal) is checked by `isCanonicalDepartment()` on both `POST /api/members` (`members.ts:64-67`) and `PATCH /api/members/:id` (`members.ts:129-132`) — TM-105 is resolved. The DB column itself has no CHECK constraint; validation is app-level only, so any write path outside these two routes would bypass it.
- **`DELETE /api/members/:id` is a soft delete, not a hard delete.** It sets `is_active = 0` and prefixes the email with `deactivated-` (`members.ts:174-180`) instead of removing the row — done specifically so the external Okta sync (which keys off `is_active=0` + the `deactivated-` prefix) can revoke SSO access (TM-106). The route is idempotent: a repeat DELETE on an already-deactivated member no-ops (`members.ts:167-172`) instead of double-prefixing the email or re-firing the SSO dispatch.
- **`GET /api/members/export` still returns soft-deleted members** — it has no `is_active` filter, unlike `GET /` and `/stats` — so a deactivated member still appears in the CSV with its `deactivated-` email and `is_active=0`.
- **`ssoDeprovision.dispatch(memberId)` (`members.ts:31-46`) fires synchronously inside the DELETE handler**, after the soft-delete commits, and only ever receives the numeric member id — never the email, endpoint, or credential. It reads `SSO_DEPROVISION_ENDPOINT`/`SSO_DEPROVISION_TOKEN` from the environment and warns-and-skips if either is unset; failures are caught and logged, never thrown, so an IdP outage can't roll back the already-committed soft-delete. It's exported as a mutable object (not a plain function) specifically so tests can swap `dispatch` via `mock.method`.
- Route order matters. `/export` and `/stats` (`members.ts:84,96`) are registered before `/:id` (`members.ts:107`) so those paths aren't captured as `:id`. Any new static sub-path under `/api/members` must be added before `/:id` too.
- CSV export doesn't escape fields. `router.get('/export', ...)` (`members.ts:84-94`) joins raw column values with commas and no quoting — a `name` or `role` containing a comma, quote, or newline produces a malformed/misaligned CSV row.
- `getDb()` is a lazy singleton keyed by the first call, not by `TEAMBOARD_DB_PATH` at import time. Tests rely on this: `members.test.ts` sets `process.env.TEAMBOARD_DB_PATH = ':memory:'` before making any request, since route handlers call `getDb()` lazily on first request.
- Tests run against compiled output, not source. `pnpm test` = `pnpm build && node --test dist/server/**/*.test.js` — a change to `members.test.ts` won't be picked up by CI until the server rebuilds.
