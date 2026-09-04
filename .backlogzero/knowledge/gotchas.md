---
name: gotchas
description: Non-obvious traps in TeamBoard — read before touching members.ts, CI, or the CSV export
type: knowledge
scope: global
updated: 2026-09-04 (IONE-959)
captured_sha: 5635cd0b7f7bfd5a748edb97b564409088129f7d
sources:
  - server/src/routes/members.ts
  - server/src/db.ts
  - server/src/routes/members.test.ts
sources_sha256:
  server/src/db.ts: 242c5f190499d9e88e7f019c245b6a61ad9903357bb5e9a92ebc091ddad894ce
  server/src/routes/members.test.ts: bee34fee976eede5a69b4a7b8423a5c9aa29bd49b21bd5001f427e7ff7c59efa
  server/src/routes/members.ts: 66ad1e6fb359caeadc367ce0c6c3105764e8e91b0167bfa3533e4c3d2bea6b7b
---

- **`POST`/`PATCH /api/members` now validate `department` against an allow-list — but the alias map doesn't normalize what's stored.** `isValidDepartment()` in `server/src/routes/members.ts` checks `department` (or its `DEPARTMENT_ALIASES` resolution, e.g. `Eng` → `Engineering`) against `VALID_DEPARTMENTS`. If it matches only via the alias, the *raw* string is still what gets written by the `INSERT`/`UPDATE` — `'Eng'` passes validation and is stored as `'Eng'`, not `'Engineering'`. Seed data (`server/src/db.ts`) already has two engineers as `'Eng'`, which is why `/api/members/stats` groups them separately from `'Engineering'`.
- **`is_active` looks like a soft-delete flag but isn't wired to anything.** The column defaults to `1` and is filtered on in `GET /api/members` and `/api/members/stats`, but `DELETE /api/members/:id` hard-deletes rows and no route ever writes `is_active = 0`. Adding a "deactivate" feature means adding a new write path (e.g. a `PATCH` field or dedicated route) — don't assume the plumbing already exists.
- **CSV export doesn't escape fields.** `router.get('/export', ...)` in `server/src/routes/members.ts` builds CSV via plain template-string interpolation (`${r.id},${r.name},...`) with no quoting. Any member `name`/`role`/`department` containing a comma, quote, or newline (nothing prevents this in `name`/`role`) will produce a malformed CSV row.
- **Tests run against `dist/`, not `src/`.** `pnpm test` is `pnpm build && node --test "dist/server/**/*.test.js"` — you must rebuild before test changes take effect if running the script directly rather than through `pnpm test`.
