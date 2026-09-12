---
name: overview
description: What TeamBoard is, stack, and where things live — read first for orientation
type: knowledge
scope: global
updated: 2026-09-12 (IONE-959)
captured_sha: 515477ad05c7788f020fac514c42e6ce60492008
sources:
  - README.md
  - package.json
sources_sha256:
  README.md: 3d21bbec3cdd5901a9448358c7af568506285536850ff6d875c57a6e9c38cb23
  package.json: 18a1323a5738fdea35d5d336cb3b3cdf79a1b76ae97ca8886052d844d2e63551
---

TeamBoard is an internal team directory (members, departments, HR export). Stack and layout are documented accurately in `../../README.md` (Node/Express/TypeScript/SQLite server, React/Vite client) — see that file for the API table and project structure; not repeated here.

## Gaps not covered by README

- **Runtime requirement:** `node:sqlite` (server/src/db.ts:1) requires Node >= 22.5, enforced via `engines` in `package.json:7`. Using an older Node fails at import time, not with a friendly error.
- **`pnpm test` builds first.** The `test` script (`package.json:16`) is `pnpm build && node --test dist/server/**/*.test.js` — it runs against **compiled JS in `dist/`**, not the TypeScript source directly. Editing `server/src/routes/members.test.ts` and running `pnpm test` without noticing a stale `dist/` is a common trap; the build step in the script handles this automatically, but ad-hoc `node --test` invocations on `dist/` after a source edit without rebuilding will run stale tests.
- **No production code for the client build** — `package.json` has no `client build` script; `dev:client` runs Vite dev server only. Vite proxies `/api` to `http://localhost:4060` (`client/vite.config.ts:9`), matching the server's hardcoded default port in `server/src/index.ts:6`.
