---
name: overview
description: Where to start — TeamBoard is a small single-repo Express+SQLite API with a React client, no workspaces
type: knowledge
scope: global
updated: '2026-08-14'
captured_sha: 3829eea37ba432ad6350c950990797e1623c05c5
sources:
  - package.json
  - CLAUDE.md
  - README.md
---

For project layout, endpoint list, and dev commands, see `../../CLAUDE.md` and
`../../README.md` — both are accurate and up to date with the code. Don't
duplicate those here; this page only adds what they don't say.

## Not a real monorepo

Despite the `pnpm-lock.yaml` and separate `server/` and `client/` source
trees, there is a single top-level `package.json` (`package.json:1`) with one
merged `dependencies`/`devDependencies` list — no `pnpm-workspace.yaml`, no
per-package `package.json`. `server/` and `client/` are just source
directories with their own `tsconfig.json`, compiled/bundled independently
(`tsc` for server, Vite for client), not independent packages. Don't add a
`server/package.json` or `client/package.json` expecting workspace-style
isolation — there isn't one.

## Where the real work is

- `server/src/routes/members.ts` — all API logic lives in this one router file (no service/controller split).
- `server/src/db.ts` — schema + seed data, singleton `DatabaseSync` connection.
- `client/src/App.tsx` — the entire UI is one component, no routing, no state library.

See `gotchas.md` before touching member CRUD or CSV export — there are a few
sharp edges the docs don't mention. See `data-model.md` for the `members`
table shape.
