---
name: overview
description: Entry point for TeamBoard — points to README/CLAUDE.md for stack, layout, and endpoints; only covers what those files don't
type: knowledge
scope: global
updated: '2026-08-14'
captured_sha: 3829eea37ba432ad6350c950990797e1623c05c5
sources:
  - README.md
  - CLAUDE.md
  - package.json
---

TeamBoard's stack, directory layout, and full endpoint list are already documented accurately — see [README.md](../../README.md) and [CLAUDE.md](../../CLAUDE.md). Don't duplicate those here; read them first.

Facts neither doc covers:

- Single `pnpm` package (no workspaces), `"type": "module"` — server and client are plain ESM under one `package.json`, not a monorepo with per-app manifests.
- `server/tsconfig.json` targets `NodeNext`/ES2022 and emits to `dist/server`. `client/tsconfig.json` uses `bundler` resolution and is only used for `--noEmit` type-checking — Vite (not `tsc`) does the actual client build/dev, and there's no client `tsconfig.build.json`.
- `.gitignore` only ignores `data/*.db`, not the whole `data/` directory — `data/.gitkeep` is tracked so the directory exists before `getDb()`'s `fs.mkdirSync` runs.
- `pnpm start` (`node dist/server/index.js`) runs the API only — `server/src/index.ts` never calls `express.static(...)`, so nothing serves the built React UI in that mode. Only `pnpm dev` (server + Vite dev server via `concurrently`) serves both.

See [[architecture]] for how client/server/DB fit together, [[data-model]] for the schema, and [[gotchas]] for the intentionally-failing test and the validation/error-handling gaps in `members.ts`.
