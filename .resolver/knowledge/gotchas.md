---
name: gotchas
description: Known sharp edges in members.ts/db.ts — read before touching member CRUD or the department field
type: knowledge
scope:
  - server/src/**
updated: 2026-08-21 (IONE-959)
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

- **No department validation exists (TM-105).** `POST /api/members`
  (`members.ts`) inserts whatever `department` string is sent, with no
  allowlist check anywhere in the codebase. `members.test.ts` has an
  intentionally-red test, `rejects an invalid department with 400`, that
  fails on `main` today by design — CI (`.github/workflows/ci.yml`) expects
  this failure until department validation lands. Don't "fix" the test by
  loosening the assertion; fix it by adding the validation.
- **Seed data itself is inconsistent on department naming**: `db.ts` seeds
  Alice Chen as `Engineering` but David Kim and Hiro Tanaka as `Eng` — two
  distinct department strings for what's presumably the same team. `GET
  /api/members/stats` groups by exact string match, so the seeded stats show
  them as separate departments. Any department allowlist added for TM-105
  should also reconcile this seed data.
- **`DELETE /api/members/:id` hard-deletes the row**, not a soft-delete via
  the `is_active` column (`members.ts`) — `is_active` is only ever set to its
  default of `1` at insert time and read at query time; nothing in the
  codebase ever sets it to `0`. Don't assume "removed" members are recoverable.
- **`PATCH /api/members/:id` only updates `name`, `email`, `role`,
  `department`** (`members.ts`) — `start_date` and `is_active` are not
  patchable, even though the CLAUDE.md/README "update member fields"
  description doesn't call out which fields.
- **`GET /api/members/export` does no CSV escaping** — fields are joined with
  raw commas (`members.ts`), so a `name` or `role` containing a comma, quote,
  or newline will corrupt the CSV. This is a real bug, not a design choice.
