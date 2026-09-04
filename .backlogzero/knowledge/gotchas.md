---
name: gotchas
description: Non-obvious behaviors and known-red state to check before touching members API or tests
type: knowledge
scope: global
updated: 2026-09-04 (IONE-959)
captured_sha: 515477ad05c7788f020fac514c42e6ce60492008
sources:
  - server/src/routes/members.test.ts
  - server/src/routes/members.ts
  - server/src/db.ts
  - package.json
  - .github/workflows/ci.yml
sources_sha256:
  .github/workflows/ci.yml: acffa74f2e2aae2392bbea0dd1634a68d7c481e0f4cad5a4917de1fb084e1c9e
  package.json: 18a1323a5738fdea35d5d336cb3b3cdf79a1b76ae97ca8886052d844d2e63551
  server/src/db.ts: 242c5f190499d9e88e7f019c245b6a61ad9903357bb5e9a92ebc091ddad894ce
  server/src/routes/members.test.ts: bee34fee976eede5a69b4a7b8423a5c9aa29bd49b21bd5001f427e7ff7c59efa
  server/src/routes/members.ts: 6586b863330c5cbd58a48dd778b13bcd6f62eb660f776d5cc0344c3ccc672f37
---

- **A CI test is intentionally red on `main` right now.** `server/src/routes/members.test.ts` (`POST /api/members rejects an invalid department with 400`) fails today because `POST /api/members` performs no department validation — it inserts whatever string is sent (see `server/src/routes/members.ts:26-46`). This is tracked as TM-105 and is deliberate, per the comment block at the top of the test file. Don't "fix" this by deleting or loosening the test — the fix is adding real department validation to the route.
- **Seed data disagrees with itself on department naming**: `'Engineering'` (Alice Chen) vs `'Eng'` (David Kim, Hiro Tanaka) — see `server/src/db.ts:37-44`. When implementing TM-105's validation, decide on and normalize a canonical department list; don't derive it naively from existing seed rows. See [[data-model]].
- **Tests run against compiled output, not source.** `pnpm test` = `pnpm build && node --test "dist/server/**/*.test.js"` (`package.json`). Editing `server/src/routes/members.test.ts` or any server `.ts` file has no effect on `pnpm test` until a rebuild happens — `pnpm build` is chained automatically by the script itself, so this is usually transparent, but a bare `node --test dist/...` without rebuilding first will run stale code.
- **`PATCH /api/members/:id` silently ignores `start_date` and `is_active`.** Only `name`, `email`, `role`, `department` are read from the body and `COALESCE`d (`server/src/routes/members.ts:92-101`) — sending `start_date` in a PATCH body is a no-op, not an error.
- **CSV export does not escape field values.** `GET /api/members/export` (`server/src/routes/members.ts:48-58`) joins raw column values with commas and no quoting; a `name` or `role` containing a comma, quote, or newline will corrupt the CSV (and is a CSV-injection vector into spreadsheet tools if a field starts with `=`, `+`, `-`, or `@`). No sanitization exists today.
- **The `getDb()` singleton reads `TEAMBOARD_DB_PATH` only on first call.** Once created, the connection is cached in a module-level variable for the process lifetime (`server/src/db.ts:9-16`); setting the env var after any request has already hit the router has no effect. Tests set it at module load time, before `app.listen`, for exactly this reason.
