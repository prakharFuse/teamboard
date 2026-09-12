---
name: overview
description: What TeamBoard is, its stack, and where the pieces live — read first for repo orientation
type: knowledge
scope: global
updated: 2026-09-12 (IONE-959)
captured_sha: 515477ad05c7788f020fac514c42e6ce60492008
sources:
  - README.md
  - package.json
  - server/src/index.ts
  - server/src/db.ts
  - client/src/App.tsx
sources_sha256:
  README.md: 3d21bbec3cdd5901a9448358c7af568506285536850ff6d875c57a6e9c38cb23
  client/src/App.tsx: 50903abfd99acdd441fab7e3084e6e6f1dc989627e78c4d76c0a4bc911639c14
  package.json: 18a1323a5738fdea35d5d336cb3b3cdf79a1b76ae97ca8886052d844d2e63551
  server/src/db.ts: 242c5f190499d9e88e7f019c245b6a61ad9903357bb5e9a92ebc091ddad894ce
  server/src/index.ts: 6c2c286cd087d1bbf54d47cbab8b0ee3aa1e86795a2a1a615588e18f9541762b
---

TeamBoard is a single-team internal directory app: Express + SQLite (`node:sqlite`) backend, React + Vite frontend. Stack, scripts, and API surface are accurately documented in `../../README.md` — cite that for the API table and getting-started steps rather than duplicating it here.

## Non-obvious structural facts not in the README

- This is a single `package.json` at the root (no workspaces) — server and client are two `tsconfig`s (`server/tsconfig.json`, `client/tsconfig.json`) compiled/typechecked separately, not a monorepo with per-package manifests.
- The server is ESM with `NodeNext` module resolution (`server/tsconfig.build.json` extends `server/tsconfig.json`), so relative imports inside `server/src/` must use explicit `.js` extensions (e.g. `import { getDb } from '../db.js'` in `server/src/routes/members.ts:2`) even though the source files are `.ts`.
- `pnpm dev` runs the compiled server (`node --watch dist/server/index.js`) alongside Vite, not `ts-node` — you must `pnpm build` (or have `dev:server`'s watch pick up a rebuild) before server code changes are live; there's no standalone server-only watch+compile script.
- There is only one route module (`server/src/routes/members.ts`); all `/api/members*` behavior — CRUD, `/export`, `/stats` — lives in that one file. See [[architecture]] for how client, server, and DB connect, and [[data-model]] for the `members` schema.
- See [[gotchas]] for known gaps (department validation, CSV export escaping) verified against the current code.
