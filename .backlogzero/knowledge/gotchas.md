---
name: gotchas
description: Known gaps and sharp edges in the members API verified against current code — read before touching validation, export, or delete
type: knowledge
scope: global
updated: 2026-09-12 (IONE-959)
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

## Department is unvalidated (TM-105, intentionally red in CI)

`POST /api/members` (`server/src/routes/members.ts:26-46`) only checks that `department` is non-empty — any string is accepted and inserted as-is. `server/src/routes/members.test.ts:70-85` asserts `POST` with `department: 'NotARealDepartment'` returns 400, and currently gets 201: this test is a deliberately failing (RED) contract test, called out in `.github/workflows/ci.yml:3-7`, that will pass once department validation is added. There is no allowed-department list anywhere in the codebase (not in `db.ts`, not in the client) to validate against — one will need to be defined as part of that fix.

## CSV export does not escape fields

`GET /api/members/export` (`server/src/routes/members.ts:48-58`) builds CSV rows with a plain template-literal join: `` `${r.id},${r.name},${r.email},...` ``. A `name` or `department` containing a comma, quote, or newline will produce a malformed/misaligned CSV row — there is no quoting/escaping logic. If you touch this route, preserve or add proper CSV escaping rather than assuming input is comma-free.

## `DELETE` is a hard delete despite the `is_active` column

See [[data-model]] — `is_active` exists and is read by the list endpoint, but `DELETE /:id` removes the row entirely rather than flipping `is_active` to `0`. There is currently no code path that sets `is_active = 0`.

## Route ordering matters

In `server/src/routes/members.ts`, `/export` (line 48) and `/stats` (line 60) are declared **before** the `/:id` route (line 71). This is required — Express matches routes in declaration order, so if `/:id` were declared first, requests to `/api/members/export` or `/api/members/stats` would be captured by `/:id` with `id = "export"` / `"stats"`. Keep any new static sub-paths above `/:id`.

## Test DB env var must be set before the first `getDb()` call

`getDb()` (`server/src/db.ts:11`) memoizes the `DatabaseSync` handle in a module-level variable on first call. `server/src/routes/members.test.ts:24` sets `process.env.TEAMBOARD_DB_PATH = ':memory:'` at module top-level (before importing/using the router) specifically so it runs before any handler's first `getDb()` call. Setting this env var after any request has already fired will silently have no effect for the rest of that process.
