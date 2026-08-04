---
name: overview
description: What TeamBoard is and where to look first — read before making any change
type: knowledge
scope: global
updated: '2026-08-04'
captured_sha: 954ac8ebcb7dafaa72672682a58e3bc82599f6e3
sources:
  - package.json
  - CLAUDE.md
  - README.md
---

TeamBoard is a small internal team-directory app: Express + `node:sqlite` API in
`server/src/`, a React/Vite client in `client/src/`. Layout, commands, endpoints,
and the core API rules (error shape, parameterized SQL) are already documented
in [`../../CLAUDE.md`](../../CLAUDE.md) and [`../../README.md`](../../README.md) —
read those first; this overlay only adds what they don't cover.

For the real gaps and pitfalls not mentioned in CLAUDE.md/README, see
[[gotchas]]. For the system shape and DB schema, see [[architecture]] and
[[data-model]]. For how tests are written against `node:sqlite`, see
[[testing]].

Single workspace, not a monorepo — `package.json` has one `dependencies`/
`devDependencies` block covering both server and client; there are no
per-package `package.json` files under `server/` or `client/`.
