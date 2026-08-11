---
name: overview
description: What TeamBoard is, how it runs, and where the authoritative docs live
type: knowledge
scope: global
updated: 2026-08-11 (IONE-959)
captured_sha: 3829eea37ba432ad6350c950990797e1623c05c5
sources:
  - package.json
  - client/vite.config.ts
  - server/src/db.ts
  - server/src/index.ts
---

TeamBoard is a small internal team directory: Express API + SQLite (`node:sqlite`) backend, React/Vite frontend. For layout, install/build/test commands, the endpoint list, and the SQL/error-format rules, see `../../CLAUDE.md` and `../../README.md` — both are accurate and don't need restating here.

## Facts not covered by the existing docs

- **Ports and proxy:** server listens on `4060` (`server/src/index.ts:6`), Vite dev server on `5173` proxies `/api` to `http://localhost:4060` (`client/vite.config.ts:9`). No proxy config exists for production — `pnpm start` only serves the API; the client is not served by the Express app.
- **DB singleton:** `getDb()` (`server/src/db.ts:11`) lazily creates a module-level `DatabaseSync` on first call and reuses it. There's no explicit close/teardown path — fine for a single dev process, but don't assume you can swap `TEAMBOARD_DB_PATH` mid-process and get a fresh connection.
- **Seed data:** on first run, if the `members` table is empty, `getDb()` inserts 8 hardcoded sample rows (`server/src/db.ts:37-44`). Department values are free text and inconsistent in the seed itself — e.g. `"Engineering"` vs `"Eng"` for two different engineers — because `POST /api/members` performs no department validation (see [[gotchas]]).
- **Test isolation:** tests set `process.env.TEAMBOARD_DB_PATH = ':memory:'` before importing the router (`server/src/routes/members.test.ts:24`) so they never touch `data/team.db`. Any new test file that imports `members.ts` must set this env var first, before the first `getDb()` call.
