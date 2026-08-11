---
name: overview
description: What TeamBoard is, tech stack, and where to find layout/commands/endpoints docs
type: knowledge
scope: global
updated: '2026-08-11'
captured_sha: 3829eea37ba432ad6350c950990797e1623c05c5
sources:
  - package.json
  - CLAUDE.md
  - README.md
---

TeamBoard is a small internal team-directory app: Express + `node:sqlite` API, React/Vite client. For layout, install/build/test commands, the endpoint list, and API rules, see [CLAUDE.md](../../CLAUDE.md) and [README.md](../../README.md) — both are accurate and current, no divergence found.

## Gap not covered by CLAUDE.md/README

Despite the `server/src/` + `client/src/` split reading like a monorepo, there is only **one** `package.json` (at repo root). There are no `server/package.json` or `client/package.json` manifests — server and client share one dependency tree and one `pnpm-lock.yaml`. `server/tsconfig.json` builds only `server/src` to `dist/server` (via `server/tsconfig.build.json`, which turns off declaration/sourcemap emit for the `pnpm build`/`pnpm start` path); the client is never compiled ahead-of-time, it's served by Vite directly from `client/src`.

See [[architecture]] for how the two halves talk at runtime, [[data-model]] for the one SQLite table, and [[gotchas]] for the department-validation TODO (TM-105) and a couple of undocumented rough edges.
