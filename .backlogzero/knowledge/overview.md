---
name: overview
description: What TeamBoard is and where to find stack/API/structure docs — read first for orientation
type: knowledge
scope: global
updated: '2026-09-13'
captured_sha: 515477ad05c7788f020fac514c42e6ce60492008
sources:
  - README.md
  - package.json
  - server/src/index.ts
  - server/src/db.ts
sources_sha256:
  README.md: 3d21bbec3cdd5901a9448358c7af568506285536850ff6d875c57a6e9c38cb23
  package.json: 18a1323a5738fdea35d5d336cb3b3cdf79a1b76ae97ca8886052d844d2e63551
  server/src/db.ts: 242c5f190499d9e88e7f019c245b6a61ad9903357bb5e9a92ebc091ddad894ce
  server/src/index.ts: 6c2c286cd087d1bbf54d47cbab8b0ee3aa1e86795a2a1a615588e18f9541762b
---

TeamBoard is an internal team-directory app: Express + TypeScript + SQLite (`node:sqlite`) server, React + Vite client. For tech stack, the API table, and project layout, see [README.md](../../README.md) — it's accurate and up to date.

Gaps not covered by the README:

- **No client build script.** `package.json` only defines `build` for the server (`tsc -p server/tsconfig.build.json`). There is no `pnpm build:client` or equivalent — `dev:client` runs Vite in dev mode only. If production client bundling is ever needed, that script doesn't exist yet.
- **`node:sqlite` is a built-in Node module** (no `better-sqlite3` or similar dependency) — this is why `engines.node >= 22.5.0` is required in `package.json`. Don't suggest adding a SQLite driver dependency; the built-in one is intentional.
- **Single DB instance, lazily created.** `getDb()` in `server/src/db.ts:11` memoizes the `DatabaseSync` connection in a module-level `db` variable. Tests override the file path via `TEAMBOARD_DB_PATH=':memory:'` set *before* the first call — see [[testing-conventions]].

For the runtime shape, see [[architecture]]. For the schema, see [[data-model]]. For known sharp edges, see [[gotchas]].
