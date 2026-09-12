---
name: gotchas
description: Non-obvious behavior in members.ts/db.ts that isn't stated in README or tests
type: knowledge
scope: global
updated: 2026-09-12 (IONE-959)
captured_sha: 515477ad05c7788f020fac514c42e6ce60492008
sources:
  - server/src/routes/members.ts
  - server/src/routes/members.test.ts
  - server/src/db.ts
sources_sha256:
  server/src/db.ts: 242c5f190499d9e88e7f019c245b6a61ad9903357bb5e9a92ebc091ddad894ce
  server/src/routes/members.test.ts: bee34fee976eede5a69b4a7b8423a5c9aa29bd49b21bd5001f427e7ff7c59efa
  server/src/routes/members.ts: 6586b863330c5cbd58a48dd778b13bcd6f62eb660f776d5cc0344c3ccc672f37
---

- **Route order in `members.ts` is load-bearing.** `GET /export` and `GET /stats` are registered *before* `GET /:id` (lines 48 and 60, vs. `:id` at line 71). If a new static route were added after `:id`, Express would swallow it as `:id === 'that-route-name'` and it would 404 or hit the wrong handler. Any new static sub-route under `/api/members` must be added above the `:id` routes.

- **`DELETE /:id` is a hard delete, not a soft delete**, despite the `is_active` column existing. `db.exec('DELETE FROM members ...')` in `members.ts:115` actually removes the row. Nothing in the codebase ever sets `is_active = 0` — the column only exists to filter the seeded/inserted rows in `GET /` and `/stats` (`WHERE is_active = 1`). Don't assume `is_active` toggling is how removal works when reasoning about "restore a removed member" type requests — there's no removed state to restore from.

- **`PATCH /:id` doesn't guard against duplicate emails.** `POST /` wraps its insert in try/catch and maps the SQLite `UNIQUE` constraint violation to a `409` (`members.ts:39-44`). `PATCH /:id` runs the same kind of statement with no try/catch (`members.ts:93-101`) — updating a member's email to one already used by another row throws synchronously inside the handler instead of returning a clean error.

- **CSV export does no escaping.** `/export` builds rows with template-string concatenation (`members.ts:52-54`) — a `name` or `email` containing a comma, quote, or a leading `=`/`+`/`-`/`@` (CSV-injection payload) would corrupt columns or execute as a formula when opened in Excel/Sheets. There's no CSV-encoding helper anywhere in the codebase to reuse.

- **One test is intentionally red on `main`.** `server/src/routes/members.test.ts` — "rejects an invalid department with 400" — fails today because `POST /` performs no department validation (matches the data-model gap above: no allow-list). The test file's own header comment says this is deliberate, tied to ticket TM-105, to give CI a real failing check. Don't "fix" the test by loosening its assertion; the fix is adding department validation to `POST /` (and likely `PATCH /:id`) in `members.ts`.
