---
name: gotchas
description: Non-obvious traps in the members API and seed data — read before changing validation, delete, or PATCH behavior
type: knowledge
scope: global
updated: '2026-08-11'
captured_sha: 3829eea37ba432ad6350c950990797e1623c05c5
sources:
  - server/src/routes/members.ts
  - server/src/routes/members.test.ts
  - server/src/db.ts
  - .github/workflows/ci.yml
  - CLAUDE.md
---

- **Department validation is missing, and CI already has a red test for it.** `server/src/routes/members.test.ts` asserts `POST /api/members rejects an invalid department with 400`, but `POST /api/members` (`server/src/routes/members.ts:26-46`) inserts whatever `department` string it's given with no check. `.github/workflows/ci.yml` runs this intentionally as a failing baseline check (see the workflow's header comment) — any PR that adds department validation should make this test go green, not need a new test written for it.
- **Seed data mixes two spellings of the same department.** `server/src/db.ts:37-44` seeds `'Engineering'` (Alice Chen) and `'Eng'` (David Kim, Hiro Tanaka) as separate department strings. Any department whitelist/allowlist added must include both, or existing seeded rows will fail validation on update, and `GET /api/members/stats` will keep splitting "Engineering" and "Eng" into two buckets instead of merging them.
- **DELETE is a hard delete despite the `is_active` column.** `GET /api/members` filters on `is_active = 1` (`members.ts:21`), implying a soft-delete model, but `DELETE /api/members/:id` (`members.ts:106-117`) runs `DELETE FROM members WHERE id = ?` — a real row removal. Nothing in the codebase ever sets `is_active` to `0`. Don't assume "removed" members are recoverable.
- **PATCH only accepts four fields.** `router.patch('/:id', ...)` (`members.ts:83-104`) destructures just `name, email, role, department` — `start_date` and `is_active` cannot be changed via PATCH, even though `CLAUDE.md`'s endpoint list just says "update member fields" without qualifying which ones.
