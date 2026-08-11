---
name: overview
description: What TeamBoard is, its stack, and where to start reading — read first for any task
type: knowledge
scope: global
updated: 2026-08-11 (IONE-959)
captured_sha: 3829eea37ba432ad6350c950990797e1623c05c5
sources:
  - package.json
  - CLAUDE.md
  - README.md
---

TeamBoard is a small internal team-directory app: Express API + React (Vite) client + SQLite
(`node:sqlite`). Layout, commands, and the endpoint list are already documented accurately in
`../../CLAUDE.md` and `../../README.md` — see those for the day-to-day command reference.

Not a pnpm workspace: despite using `pnpm`, there's a single root `package.json` (no
`pnpm-workspace.yaml`); `server/` and `client/` are plain subdirectories, not packages. Server
TS compiles to `dist/server/` (see `server/tsconfig.build.json`), and `pnpm dev:server` runs
that compiled output with `--watch`, not `ts-node`/`tsx` — so a server-side change requires a
rebuild (or `pnpm build` once, then rely on `--watch` on `dist/`) to show up under `pnpm dev`.

For the currently-failing CI check and why, see [[ci-red-tm-105]]. For the department-value
inconsistency relevant to that fix, see [[department-values]].
