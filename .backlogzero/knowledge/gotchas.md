---
name: gotchas
description: Non-obvious behaviors and known-red state before touching members.ts or db.ts
type: knowledge
scope: global
updated: 2026-09-16 (IONE-959)
captured_sha: 515477ad05c7788f020fac514c42e6ce60492008
sources:
  - server/src/routes/members.ts
  - server/src/routes/members.test.ts
  - .github/workflows/ci.yml
  - server/src/db.ts
sources_sha256:
  .github/workflows/ci.yml: acffa74f2e2aae2392bbea0dd1634a68d7c481e0f4cad5a4917de1fb084e1c9e
  server/src/db.ts: 242c5f190499d9e88e7f019c245b6a61ad9903357bb5e9a92ebc091ddad894ce
  server/src/routes/members.test.ts: bee34fee976eede5a69b4a7b8423a5c9aa29bd49b21bd5001f427e7ff7c59efa
  server/src/routes/members.ts: 6586b863330c5cbd58a48dd778b13bcd6f62eb660f776d5cc0344c3ccc672f37
---

- **CI is currently red by design.** `server/src/routes/members.test.ts` asserts that `POST /api/members` rejects an unknown `department` with 400, but `members.ts:26-46` inserts whatever `department` string it's given — no validation exists. The test file and `.github/workflows/ci.yml` both document this as intentional (tracked as TM-105), not a flaky test. Don't "fix" it by loosening the assertion — the fix belongs in `members.ts`.
- **Route order matters.** `/export` and `/stats` (`members.ts:48,60`) are registered before the `/:id` route (`members.ts:71`) specifically so `GET /api/members/export` and `/stats` aren't captured as `:id`. Any new static sub-path under `/api/members` must be added before `/:id` too.
- **CSV export doesn't escape fields.** `router.get('/export', ...)` (`members.ts:48-58`) joins raw column values with commas and no quoting. A `name` or `role` containing a comma, quote, or newline will produce a malformed/misaligned CSV row — there's no `csv-stringify`-style escaping.
- **`getDb()` is a lazy singleton keyed by the first call, not by `TEAMBOARD_DB_PATH` at import time.** Tests rely on this: `members.test.ts:24` sets `process.env.TEAMBOARD_DB_PATH = ':memory:'` before making any request, since route handlers call `getDb()` lazily on first request. Setting the env var after any handler has already run would have no effect.
- **Tests run against compiled output, not source.** `pnpm test` = `pnpm build && node --test dist/server/**/*.test.js` — there's no `ts-node`/`tsx` path for tests. A change to `members.test.ts` won't be picked up by CI until the server rebuilds.
- **`PATCH /api/members/:id` silently accepts any `department` string** (`members.ts:83-104`), same as `POST` — any department validation added for `POST` should cover `PATCH` too, or the two endpoints will diverge in behavior.
