---
name: overview
description: TeamBoard repo shape, stack, and scripts — read first for orientation
type: knowledge
scope: global
updated: '2026-09-01'
captured_sha: 515477ad05c7788f020fac514c42e6ce60492008
sources:
  - package.json
  - README.md
sources_sha256:
  README.md: 3d21bbec3cdd5901a9448358c7af568506285536850ff6d875c57a6e9c38cb23
  package.json: 18a1323a5738fdea35d5d336cb3b3cdf79a1b76ae97ca8886052d844d2e63551
---

Stack, ports, API surface, and project layout are documented accurately in
[../../README.md](../../README.md) — see it for the endpoint table and the
`server/`/`client`/`data/` layout. This page only adds what the README omits.

## Gaps not covered by the README

- **Single `package.json`, no workspace tool.** Despite `server/` and
  `client/` looking like separate packages, there is one root `package.json`
  with no `pnpm-workspace.yaml` (`pnpm-lock.yaml` exists but is a plain
  single-package lockfile). Both apps share one `node_modules` and one set of
  `devDependencies`. Don't assume `pnpm --filter` works — it doesn't.
- **No `CLAUDE.md` or `AGENTS.md` exists in this repo.** This
  `.backlogzero/` overlay is the only agent-facing guidance layer.
- **`node:sqlite` is a Node built-in, not a package.** There's no `sqlite3`
  or `better-sqlite3` dependency — `server/src/db.ts` imports `DatabaseSync`
  from `node:sqlite`, which is why `engines.node` is pinned to `>=22.5.0`.
  It's synchronous (no promises/callbacks).
- **Server and client have separate `tsconfig.json`s with different module
  resolution**: server uses `NodeNext` (requires explicit `.js` extensions
  on relative imports, e.g. `from '../db.js'` even though the source file is
  `db.ts`); client uses `bundler` resolution via Vite (also uses `.js`
  extensions on imports for consistency, e.g. `App.tsx` importing itself as
  `./App.js` from `main.tsx` — that's Vite-compatible, not a typo).
- **Build only compiles the server.** `pnpm build` runs
  `tsc -p server/tsconfig.build.json` — there is no client build script;
  the client is dev-only (served by Vite) in this repo as it stands.
