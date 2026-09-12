---
name: overview
description: What TeamBoard is, how the repo is laid out, and non-obvious facts the README doesn't cover
type: knowledge
scope: global
updated: 2026-09-12 (IONE-959)
captured_sha: 515477ad05c7788f020fac514c42e6ce60492008
sources:
  - package.json
  - server/src/db.ts
  - server/src/index.ts
sources_sha256:
  package.json: 18a1323a5738fdea35d5d336cb3b3cdf79a1b76ae97ca8886052d844d2e63551
  server/src/db.ts: 242c5f190499d9e88e7f019c245b6a61ad9903357bb5e9a92ebc091ddad894ce
  server/src/index.ts: 6c2c286cd087d1bbf54d47cbab8b0ee3aa1e86795a2a1a615588e18f9541762b
---

TeamBoard is an internal team-directory app (member CRUD, department stats, CSV export for HR). For tech stack, API table, and project layout, see `../../README.md` — it's accurate and there's no need to restate it here.

## Facts not in the README

- **Single package, not a workspace.** `package.json` has no `workspaces` field — `server/` and `client/` are two source trees built by separate `tsconfig.json`s (`server/tsconfig.build.json` compiles only the server to `dist/server`), not independent pnpm packages. There's one lockfile and one `node_modules` for both.
- **`node:sqlite` is why Node >=22.5 is required** (`server/src/db.ts:1`) — it's Node's built-in synchronous SQLite binding, still a newer/experimental API. Don't add `better-sqlite3` or similar; the repo deliberately uses the built-in module.
- **The DB handle is a lazy module-level singleton** (`getDb()` in `server/src/db.ts:11`). It's created on first call and reused; there's no connection pool or per-request handle. Tests rely on this: setting `TEAMBOARD_DB_PATH=':memory:'` *before* the first `getDb()` call gives an isolated in-memory DB for that process — see [[testing]].
- Seed data (`server/src/db.ts:37-44`) is only inserted when the `members` table is empty, and only on `data/team.db` (gitignored, see `.gitignore`) — deleting that file resets to the 8 sample members on next run.
