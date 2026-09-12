---
name: gotchas
description: Behavior that isn't obvious from the API table or column names — read before touching members.ts
type: knowledge
scope: global
updated: 2026-09-12 (IONE-959)
captured_sha: 515477ad05c7788f020fac514c42e6ce60492008
sources:
  - server/src/routes/members.ts
  - server/src/db.ts
  - server/src/routes/members.test.ts
sources_sha256:
  server/src/db.ts: 242c5f190499d9e88e7f019c245b6a61ad9903357bb5e9a92ebc091ddad894ce
  server/src/routes/members.test.ts: bee34fee976eede5a69b4a7b8423a5c9aa29bd49b21bd5001f427e7ff7c59efa
  server/src/routes/members.ts: 6586b863330c5cbd58a48dd778b13bcd6f62eb660f776d5cc0344c3ccc672f37
---

- **`is_active` is never set to 0 anywhere in the codebase.** The column exists and `GET /` and `/stats` both filter on `is_active = 1`, but `DELETE /:id` (`members.ts:106-117`) does a hard `DELETE FROM members`, not a soft-delete. There is no code path that flips `is_active`. Don't assume "remove" means recoverable/soft-deleted — it isn't.
- **No department validation.** `POST /api/members` (`members.ts:26-46`) accepts any non-empty `department` string and inserts it as-is; `GET /stats` will happily group by whatever ad-hoc strings were entered (seed data already has both `Engineering` and `Eng` as distinct departments — `db.ts:40,44`). There is a red integration test for this (see below) but no fix in production code yet.
- **`server/src/routes/members.test.ts` has an intentionally-failing test on `main`** — `POST /api/members rejects an invalid department with 400` is written test-first against ticket TM-105 and is expected to be RED until department validation is added. Don't "fix" it by loosening the assertion; the fix belongs in `members.ts`.
- **Tests run against compiled output, not source.** `pnpm test` = `pnpm build && node --test "dist/server/**/*.test.js"`. If you edit `server/src/*.ts` and immediately re-run tests without rebuilding via a different command, you may be testing stale `dist/`.
- **Test isolation via env var, not mocking.** `server/src/routes/members.test.ts` sets `TEAMBOARD_DB_PATH=':memory:'` before importing the router, so `getDb()` (`db.ts:7`) never touches `data/team.db`. This only works because it's set *before* the first `getDb()` call — `getDb()` is a lazy singleton, so setting the env var later in a test would have no effect.
- **PATCH silently ignores unknown fields and never validates.** `router.patch('/:id')` (`members.ts:83-104`) uses `COALESCE(?, name)` per field, so omitted fields are left unchanged, but there's no check on `email` uniqueness on update the way POST has — a PATCH to a duplicate email will throw an unhandled SQLite `UNIQUE` error (500), unlike POST's 409.
