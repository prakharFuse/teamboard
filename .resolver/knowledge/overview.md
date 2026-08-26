---
name: overview
description: What TeamBoard is, tech stack, and where things live — read first for orientation
type: knowledge
scope: global
updated: 2026-08-26 (IONE-959)
captured_sha: 40c1af055214b8aac31e85217138b2f00e468ff5
sources:
  - README.md
  - server/src/config.ts
  - server/src/index.ts
  - client/vite.config.ts
sources_sha256:
  README.md: f60863cc0216fd6e9060b316d8cda82830bebc27a9697c646296f6121983259a
  client/vite.config.ts: 2635b1b0c25f00bcd01ee312a924b22372c08b7e5812f3cf7afa10621acea14b
  server/src/config.ts: 361319784de0ec3fc5b293e6c42a05ed698a2d9f00a1856350b755ca385218be
  server/src/index.ts: 8bf1866cdb94244360f9786673869c67dedf3b93aa2c05dbe8aa6b908cb871b5
---

TeamBoard is an internal team directory (members, departments, HR export). Stack and
project layout are accurately described in `../../README.md` — see that file for the
tech stack table, API route list, config table, and directory tree; no need to
duplicate it here.

## Runtime shape not spelled out in the README

- Single pnpm workspace, not a monorepo with separate `package.json` files per app —
  `client/` and `server/` share the one root `package.json` (`package.json`). There is
  no `build:client` script; only the server is compiled by `pnpm build`
  (`tsc -p server/tsconfig.build.json`). The client only ever runs through Vite's dev
  server (`vite --config client/vite.config.ts`) — there is no production client build
  step in this repo yet.
- Server listens on port 4060 by default via `config.port` from `server/src/config.ts`
  (`server/src/index.ts:13`); override with `TEAMBOARD_PORT` (falls back to legacy
  `PORT`). Vite's dev server proxies `/api/*` to the same host/port, read from the same
  env vars in `client/vite.config.ts:7-8` — see `[[architecture]]` for how the two
  sides stay in sync.
- `server/tsconfig.json` targets `NodeNext` module resolution (server is real ESM,
  `.js` extensions in relative imports); `client/tsconfig.json` uses `bundler`
  resolution — the two halves of the repo are type-checked as separate projects via
  `pnpm typecheck` (two `tsc --noEmit` invocations, no shared tsconfig).
