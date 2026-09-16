---
name: overview
description: What TeamBoard is, its stack, and how to run it — read first for orientation
type: knowledge
scope: global
updated: 2026-09-16 (IONE-959)
captured_sha: 515477ad05c7788f020fac514c42e6ce60492008
sources:
  - package.json
  - README.md
  - server/src/index.ts
  - client/vite.config.ts
sources_sha256:
  README.md: 3d21bbec3cdd5901a9448358c7af568506285536850ff6d875c57a6e9c38cb23
  client/vite.config.ts: 8ce4f4d02ae0440e227419fbeca975395f8a11f6939d20e40f207deb3b6667e6
  package.json: 18a1323a5738fdea35d5d336cb3b3cdf79a1b76ae97ca8886052d844d2e63551
  server/src/index.ts: 6c2c286cd087d1bbf54d47cbab8b0ee3aa1e86795a2a1a615588e18f9541762b
---

TeamBoard is an internal team-directory app: Express + `node:sqlite` server, React + Vite client. See ../../README.md for the full API table, project structure, and getting-started commands — it is accurate as of this writing.

## Non-obvious details not in the README

- Server listens on port `4060` (or `process.env.PORT`), client dev server on `5173` and proxies `/api` to it (`client/vite.config.ts:9`). The proxy target is hardcoded to `http://localhost:4060`, not derived from `PORT`, so changing the server port breaks the client dev proxy silently.
- `pnpm test` runs `pnpm build` first, then executes compiled JS test files under `dist/server/**/*.test.js` with Node's built-in test runner — there is no separate "watch" test mode, and tests never run against `.ts` sources directly.
- `pnpm dev:server` runs `node --watch dist/server/index.js`, i.e. it watches the **compiled output**, not the TypeScript source. Run `pnpm build` (or a build-watch) alongside `pnpm dev` if server changes aren't taking effect.
