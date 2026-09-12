---
name: gotchas
description: Non-obvious behaviors and known gaps in TeamBoard — read before touching members.ts or db.ts
type: knowledge
scope: global
updated: 2026-09-12 (IONE-959)
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

- **CI is intentionally red on `main` for department validation (TM-105).**
  `server/src/routes/members.test.ts` has a test-first check, "POST
  /api/members rejects an invalid department with 400", that fails today
  because `POST /api/members` (in `members.ts`) inserts whatever
  `department` string the caller sends with no validation against a known
  list. This is documented in-code and in `.github/workflows/ci.yml` as
  deliberate — don't "fix" it by deleting/loosening the test; the fix is to
  add department validation in the POST handler.

- **`DELETE /api/members/:id` hard-deletes the row**, even though the schema
  has an `is_active` flag that looks built for soft-delete. No route ever
  sets `is_active` back to `0` — `PATCH /api/members/:id` only updates
  `name`/`email`/`role`/`department`. If you need soft-delete semantics,
  you'll need to add that behavior; it doesn't exist yet.

- **Route order in `members.ts` matters.** The literal routes `/export` and
  `/stats` are declared *before* the parameterized `/:id` route so Express
  doesn't swallow them as `id="export"`/`id="stats"`. Any new literal
  `GET /api/members/<word>` route must be added before `/:id`, not after.

- **CSV export does no field escaping.** `GET /api/members/export` builds
  CSV rows with a plain template-string join (`members.ts`); a `name` or
  `role` containing a comma or quote will corrupt the CSV. There's no
  escaping logic to preserve if you touch this route — it needs to be added.

- **`node:sqlite` requires Node >= 22.5** (enforced by `engines` in
  `package.json`); it's still an experimental Node API, not a third-party
  driver — don't look for a `sqlite3`/`better-sqlite3` dependency.

- **Tests must set `TEAMBOARD_DB_PATH=':memory:'` before the first
  `getDb()` call**, not just before the test file runs — `getDb()` caches
  the connection in a module-level variable, so once it's created (on any
  path) the env var is ignored for the rest of the process. See the top of
  `members.test.ts` for the working pattern (module-level env write before
  importing/using the router).
