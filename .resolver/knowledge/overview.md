---
name: overview
description: Project purpose, layout, and commands — start here; see CLAUDE.md/README.md for the base facts
type: knowledge
scope: global
updated: 2026-08-14 (IONE-959)
captured_sha: 3829eea37ba432ad6350c950990797e1623c05c5
sources:
  - package.json
  - server/src/index.ts
  - client/vite.config.ts
---

TeamBoard is an internal team directory (Express + SQLite server, React/Vite client). For project description, directory layout, endpoint list, and available `pnpm` scripts, see ../../CLAUDE.md and ../../README.md — both are accurate and current, don't duplicate them here.

## Gaps not covered by CLAUDE.md/README

- **Module system:** the whole repo is ESM (`"type": "module"` in `package.json`). Server TS compiles with `module`/`moduleResolution: NodeNext` (`server/src/tsconfig.json`), so relative imports in `server/src/**` must use explicit `.js` extensions (e.g. `import { getDb } from '../db.js'`) even though the source files are `.ts`.
- **Ports:** server listens on `4060` (`server/src/index.ts:6`, overridable via `PORT` env var); Vite dev server runs on the default `5173` and proxies `/api` to `http://localhost:4060` (`client/vite.config.ts:8-10`).
- **Build output:** `pnpm build` compiles only the server (`server/tsconfig.build.json`) to `dist/server/`; there is no client build script in `package.json` — `client/` is only ever run through Vite dev, never bundled for production by an existing script.
- **Test execution:** `pnpm test` runs `pnpm build` first, then `node --test` against the **compiled** `dist/server/**/*.test.js`, not the TS sources directly — see [[testing]].
