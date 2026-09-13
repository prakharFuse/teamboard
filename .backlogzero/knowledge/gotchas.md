---
name: gotchas
description: Non-obvious behaviors and known-red state before touching members API or CSV export
type: knowledge
scope: global
updated: 2026-09-13 (IONE-959)
captured_sha: 515477ad05c7788f020fac514c42e6ce60492008
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

- **Department has no validation, and the seed data proves it's already
  inconsistent**: `db.ts` seeds "Engineering" (Alice Chen) as a distinct
  string from "Eng" (David Kim, Hiro Tanaka) — two members who look like the
  same team split across two `GET /api/members/stats` buckets
  (`server/src/routes/members.ts:65`). `POST`/`PATCH` accept any
  `department` string with no allow-list.
- **`server/src/routes/members.test.ts` has an intentionally-red test on
  `main`**: "rejects an invalid department with 400" fails today because no
  such validation exists. The test file and `.github/workflows/ci.yml` both
  say this is deliberate (tracked as TM-105) so CI has a real failing check.
  Don't "fix" this by loosening the test — the fix belongs in
  `members.ts`'s `POST` handler.
- **CSV export does no escaping** (`server/src/routes/members.ts:52`):
  fields are joined with a raw template string. A `name` or `department`
  containing a comma, quote, or newline will silently corrupt the CSV
  (fields shift, rows split) — there's no quoting/escaping of values.
- **`PATCH /api/members/:id` silently ignores `start_date`**: the handler
  destructures only `name, email, role, department` from the body
  (`server/src/routes/members.ts:92`), so a client sending `start_date` in a
  PATCH has no effect, contradicting the README's "Update member fields"
  description (see divergence below).
- **`DELETE` is a hard delete**, not a soft delete via `is_active`, despite
  the column existing for that purpose (see [[data-model]]).
- Tests must set `process.env.TEAMBOARD_DB_PATH = ':memory:'` *before* the
  first `getDb()` call, since the DB handle is a lazy module-level singleton
  (`server/src/db.ts:7`) — setting the env var later has no effect within the
  same process.

## Divergences

Diverges from ../../README.md: the API table describes `PATCH
/api/members/:id` as "Update member fields" (implying all fields), but the
handler only updates `name`, `email`, `role`, and `department` —
`start_date` is accepted by no code path in `PATCH`.
