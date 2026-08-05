---
name: overview
description: Where to start — project purpose, stack, and layout for TeamBoard
type: knowledge
scope: global
updated: '2026-08-05'
captured_sha: 954ac8ebcb7dafaa72672682a58e3bc82599f6e3
sources:
  - CLAUDE.md
  - README.md
  - package.json
---

TeamBoard's purpose, stack, layout, commands, endpoints, and API rules are already
documented accurately in [CLAUDE.md](../../CLAUDE.md) and [README.md](../../README.md) —
read those first.

This page only adds what those docs don't cover. See [[architecture]] for the
request-flow diagram, [[data-model]] for the SQLite schema, and [[gotchas]] for
behavior that diverges from what the docs/tests imply.

One structural fact worth knowing up front: this is a pnpm-workspaces-free single
`package.json` monorepo (`server/` and `client/` are plain directories, not pnpm
workspace packages) — `pnpm build`/`typecheck`/`test` all run from the repo root
against `server/tsconfig*.json` / `client/tsconfig.json` directly.
