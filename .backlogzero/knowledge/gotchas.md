---
name: gotchas
description: Non-obvious traps in TeamBoard — read before touching members.ts, CI, or the CSV export
type: knowledge
scope: global
updated: 2026-09-04 (IONE-959)
captured_sha: 515477ad05c7788f020fac514c42e6ce60492008
sources:
  - server/src/routes/members.test.ts
  - .github/workflows/ci.yml
  - server/src/routes/members.ts
  - server/src/db.ts
sources_sha256:
  .github/workflows/ci.yml: acffa74f2e2aae2392bbea0dd1634a68d7c481e0f4cad5a4917de1fb084e1c9e
  server/src/db.ts: 242c5f190499d9e88e7f019c245b6a61ad9903357bb5e9a92ebc091ddad894ce
  server/src/routes/members.test.ts: bee34fee976eede5a69b4a7b8423a5c9aa29bd49b21bd5001f427e7ff7c59efa
  server/src/routes/members.ts: 6586b863330c5cbd58a48dd778b13bcd6f62eb660f776d5cc0344c3ccc672f37
---

- **`pnpm test` / CI is intentionally red right now.** `server/src/routes/members.test.ts` ships a RED test (`rejects an invalid department with 400`) against unimplemented department validation, tracked in its own comments as TM-105. `.github/workflows/ci.yml` runs this on every PR by design, "so a PR against this repo gets a real failing check". If you're asked to fix CI or add department validation, this is almost certainly the target — implement a department allow-list check in `POST /api/members` (and likely `PATCH`) in `server/src/routes/members.ts`.
- **`is_active` looks like a soft-delete flag but isn't wired to anything.** The column defaults to `1` and is filtered on in `GET /api/members` and `/api/members/stats`, but `DELETE /api/members/:id` hard-deletes rows and no route ever writes `is_active = 0`. Adding a "deactivate" feature means adding a new write path (e.g. a `PATCH` field or dedicated route) — don't assume the plumbing already exists.
- **CSV export doesn't escape fields.** `router.get('/export', ...)` in `server/src/routes/members.ts` builds CSV via plain template-string interpolation (`` `${r.id},${r.name},...` ``) with no quoting. Any member `name`/`role`/`department` containing a comma, quote, or newline (nothing prevents this — see below) will produce a malformed CSV row.
- **No server-side validation on `department` (or `role`, `name`).** `POST`/`PATCH /api/members` accept any non-empty string for these fields; the client's department `<input>` is plain text, not a `<select>`. Seed data (`server/src/db.ts`) already has two inconsistent department strings for engineers (`'Engineering'` vs `'Eng'`), which any dept-based grouping (e.g. `/api/members/stats`) will report as separate departments.
- **Tests run against `dist/`, not `src/`.** `pnpm test` is `pnpm build && node --test "dist/server/**/*.test.js"` — you must rebuild before test changes take effect if running the script directly rather than through `pnpm test`.
