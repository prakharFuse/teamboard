---
name: gotchas
description: Non-obvious runtime and CI behaviors not covered by CLAUDE.md/README
type: knowledge
scope: global
updated: 2026-08-21 (IONE-959)
captured_sha: 3829eea37ba432ad6350c950990797e1623c05c5
sources:
  - server/src/routes/members.test.ts
  - .github/workflows/ci.yml
  - package.json
  - server/src/routes/members.ts
  - server/src/db.ts
sources_sha256:
  .github/workflows/ci.yml: acffa74f2e2aae2392bbea0dd1634a68d7c481e0f4cad5a4917de1fb084e1c9e
  package.json: 18a1323a5738fdea35d5d336cb3b3cdf79a1b76ae97ca8886052d844d2e63551
  server/src/db.ts: 242c5f190499d9e88e7f019c245b6a61ad9903357bb5e9a92ebc091ddad894ce
  server/src/routes/members.test.ts: bee34fee976eede5a69b4a7b8423a5c9aa29bd49b21bd5001f427e7ff7c59efa
  server/src/routes/members.ts: 6586b863330c5cbd58a48dd778b13bcd6f62eb660f776d5cc0344c3ccc672f37
---

## The department-validation test is intentionally red

`server/src/routes/members.test.ts` has a test, `POST /api/members rejects an invalid department with 400`, that fails on `main` today: `POST /api/members` in `server/src/routes/members.ts` performs no department validation and accepts any string, returning 201. The test and CI workflow comments both say this is deliberate — it's a pre-planted failing check for ticket TM-105 (add department validation) so there's a real red CI run to fix. Don't "fix" this by loosening the test; the fix belongs in the route handler.

## `pnpm dev` does not recompile server TypeScript on change

`dev:server` runs `node --watch dist/server/index.js` (`package.json`) — it watches the *compiled* output, not `server/src/**/*.ts`. There is no `tsc --watch` in the dev pipeline. Editing server source during `pnpm dev` has no effect until you re-run `pnpm build`. Only the client (Vite) has real hot-reload.

## `is_active` implies soft-delete, but `DELETE` is hard-delete

The schema has an `is_active` flag and `GET /api/members` filters on it, suggesting soft-delete semantics, but `DELETE /api/members/:id` (`server/src/routes/members.ts`) runs `DELETE FROM members WHERE id = ?` — a real row delete. Nothing in the route ever sets `is_active = 0`. Treat `is_active` as currently unused/dead for members created through the API.

## `PATCH /api/members/:id` cannot update `start_date` or `is_active`

The handler only reads `name, email, role, department` off `req.body`; `start_date` (required on create) has no update path. `../../CLAUDE.md`'s "update member fields" wording doesn't specify which fields, so this isn't a contradiction — just something to know before assuming PATCH is a full update.
