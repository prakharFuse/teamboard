---
name: overview
description: What TeamBoard is, tech stack, and where things live — read first for orientation
type: knowledge
scope: global
updated: 2026-08-26 (IONE-959)
captured_sha: 515477ad05c7788f020fac514c42e6ce60492008
sources:
  - README.md
  - package.json
sources_sha256:
  README.md: 3d21bbec3cdd5901a9448358c7af568506285536850ff6d875c57a6e9c38cb23
  package.json: 18a1323a5738fdea35d5d336cb3b3cdf79a1b76ae97ca8886052d844d2e63551
---

TeamBoard is an internal team directory (members, departments, HR export). Stack and
project layout are accurately described in `../../README.md` — see that file for the
tech stack table, API route list, and directory tree; no need to duplicate it here.

## Runtime shape not spelled out in the README

- Single pnpm workspace, not a monorepo with separate `package.json` files per app —
  `client/` and `server/` share the one root `package.json` (`package.json`). There is
  no `build:client` script; only the server is compiled by `pnpm build`
  (`tsc -p server/tsconfig.build.json`). The client only ever runs through Vite's dev
  server (`vite --config client/vite.config.ts`) — there is no production client build
  step in this repo yet.
- Server listens on port 4060 (`server/src/index.ts:6`); Vite dev server proxies
  `/api/*` to it (`client/vite.config.ts:9`).
- `server/tsconfig.json` targets `NodeNext` module resolution (server is real ESM,
  `.js` extensions in relative imports); `client/tsconfig.json` uses `bundler`
  resolution — the two halves of the repo are type-checked as separate projects via
  `pnpm typecheck` (two `tsc --noEmit` invocations, no shared tsconfig).
