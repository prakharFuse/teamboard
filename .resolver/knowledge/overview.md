---
name: overview
description: What TeamBoard is, the tech stack, and how to run it — read first for orientation
type: knowledge
scope: global
updated: 2026-08-26 (IONE-959)
captured_sha: 515477ad05c7788f020fac514c42e6ce60492008
sources:
  - package.json
  - README.md
  - server/src/index.ts
  - server/src/db.ts
sources_sha256:
  README.md: 3d21bbec3cdd5901a9448358c7af568506285536850ff6d875c57a6e9c38cb23
  package.json: 18a1323a5738fdea35d5d336cb3b3cdf79a1b76ae97ca8886052d844d2e63551
  server/src/db.ts: 242c5f190499d9e88e7f019c245b6a61ad9903357bb5e9a92ebc091ddad894ce
  server/src/index.ts: 6c2c286cd087d1bbf54d47cbab8b0ee3aa1e86795a2a1a615588e18f9541762b
---

TeamBoard is a small internal team-directory app (Express + SQLite server, React + Vite client). Stack, run commands, API surface, and project layout are accurately documented in [README.md](../../README.md) — see that file for the command table and API route list rather than duplicating it here.

## Facts not in the README

- The server listens via `process.env.PORT || 4060` (`server/src/index.ts:6`) — the README's "port 4060" is the default, not a hard-coded value.
- `pnpm build` only compiles the server (`tsc -p server/tsconfig.build.json`); the client is served by Vite directly in dev and has no separate production build script in `package.json`.
- The single npm workspace is not a monorepo with pnpm workspaces — there's one `package.json` at the root covering both `client/` and `server/`, so there's no per-package install/build.
- `getDb()` in `server/src/db.ts:11` is a lazy singleton: the first call creates the file (or `:memory:`), creates the table, and seeds 8 rows if the table is empty. Any code path that imports `db.ts` before setting `TEAMBOARD_DB_PATH` will bind to the on-disk `data/team.db`, so env vars for tests must be set before the first `getDb()` call — see [[testing-conventions]].
