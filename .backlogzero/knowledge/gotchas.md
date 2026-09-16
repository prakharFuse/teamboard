---
name: gotchas
description: Known in-flight issues and non-obvious traps in TeamBoard — read before touching members API/CI
type: knowledge
scope: global
updated: 2026-09-16 (IONE-959)
captured_sha: 515477ad05c7788f020fac514c42e6ce60492008
sources:
  - server/src/routes/members.test.ts
  - server/src/routes/members.ts
  - server/src/db.ts
  - .github/workflows/ci.yml
sources_sha256:
  .github/workflows/ci.yml: acffa74f2e2aae2392bbea0dd1634a68d7c481e0f4cad5a4917de1fb084e1c9e
  server/src/db.ts: 242c5f190499d9e88e7f019c245b6a61ad9903357bb5e9a92ebc091ddad894ce
  server/src/routes/members.test.ts: bee34fee976eede5a69b4a7b8423a5c9aa29bd49b21bd5001f427e7ff7c59efa
  server/src/routes/members.ts: 6586b863330c5cbd58a48dd778b13bcd6f62eb660f776d5cc0344c3ccc672f37
---

## TM-105: department validation is missing, and this is intentional-for-now

`POST /api/members` (`server/src/routes/members.ts:26-46`) accepts any string as `department` and inserts it unvalidated. `server/src/routes/members.test.ts:70-85` has a test, `POST /api/members rejects an invalid department with 400`, that is **deliberately RED on `main`** — the test file's own header comment explains this is intentional so CI has a genuine failing check to fix. Do not "fix" this by loosening or deleting the test; the real fix is to add department validation (an allow-list or lookup) to the `POST /api/members` handler so the 400 path in the test is actually hit. `.github/workflows/ci.yml:3-7` documents the same thing at the workflow level.

- If asked to implement TM-105, the handler needs a canonical set of valid departments. The seed data (`server/src/db.ts:37-44`) is inconsistent about this: it uses both `'Engineering'` and `'Eng'` for what looks like the same department. Any allow-list must decide which spelling is canonical and existing seed rows using the other spelling will otherwise fail future validation on update.
- `PATCH /api/members/:id` (`members.ts:83-104`) also accepts `department` unvalidated — a real TM-105 fix should apply the same rule there, not just on `POST`.

## Other traps

- `getDb()` (`server/src/db.ts:11`) memoizes the `DatabaseSync` instance in a module-level `let db`. In tests this means `TEAMBOARD_DB_PATH` **must** be set (to `:memory:`) before the first call to `getDb()` anywhere in the process — `members.test.ts:24` sets it at module load time for exactly this reason. Setting it later (e.g. inside a `test()` body) after any handler has already run is a no-op.
- The unique-email constraint violation is detected in `members.ts:40` by string-matching `err.message.includes('UNIQUE')` rather than an error code — fragile if the underlying SQLite error message format ever changes.
- `GET /api/members/export` (`members.ts:48-58`) builds CSV via raw string interpolation of `name`/`email`/etc. with no escaping — a member name containing a comma or newline will corrupt the CSV. There's no injection risk (server-rendered download, not HTML/SQL), but it is a correctness gap if this endpoint gets used for real HR data.
