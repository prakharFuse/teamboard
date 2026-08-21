---
name: gotchas
description: Known-red CI test, an unhandled-error path that breaks the documented error contract, and seed-data quirks
type: knowledge
scope: global
updated: '2026-08-21'
captured_sha: 3829eea37ba432ad6350c950990797e1623c05c5
sources:
  - server/src/routes/members.ts
  - server/src/routes/members.test.ts
  - server/src/db.ts
  - .github/workflows/ci.yml
sources_sha256:
  .github/workflows/ci.yml: acffa74f2e2aae2392bbea0dd1634a68d7c481e0f4cad5a4917de1fb084e1c9e
  server/src/db.ts: 242c5f190499d9e88e7f019c245b6a61ad9903357bb5e9a92ebc091ddad894ce
  server/src/routes/members.test.ts: bee34fee976eede5a69b4a7b8423a5c9aa29bd49b21bd5001f427e7ff7c59efa
  server/src/routes/members.ts: 6586b863330c5cbd58a48dd778b13bcd6f62eb660f776d5cc0344c3ccc672f37
---

## TM-105: department validation is missing, CI is red on main

`server/src/routes/members.test.ts` has a test, "POST /api/members rejects an
invalid department with 400", that fails on `main` today: `POST
/api/members` (`server/src/routes/members.ts`) inserts whatever `department`
string is sent with no validation. `.github/workflows/ci.yml` runs this
intentionally as a real failing check (see the comment at the top of that
workflow) — don't "fix" it by deleting/loosening the test; the fix is adding
department validation to the POST handler.

## Divergence from CLAUDE.md: PATCH doesn't honor the `{ error }` contract

`../../CLAUDE.md` states under Rules: `API errors: { "error": string } with
appropriate HTTP status`. `POST /api/members` follows this — it wraps the
insert in try/catch and returns `409 { error: ... }` on a duplicate email.
`PATCH /api/members/:id` does not: its `UPDATE` call has no try/catch, so
changing `email` to one that collides with another row throws a raw SQLite
UNIQUE error, which falls through to Express's default handler (an HTML 500,
not the documented JSON shape).

## Seed data has inconsistent department names

`server/src/db.ts`'s seed rows use `Engineering` for Alice Chen but `Eng` for
David Kim and Hiro Tanaka — same team, two different department strings. Any
department allowlist/enum added for TM-105 needs to pick one canonical name
and reconcile (or migrate) the seed data, or `Eng` rows will silently fail
validation on update.
