---
name: overview
description: Where to start — project shape, stack, and commands (mostly lives in the repo's own docs)
type: knowledge
scope: global
updated: '2026-08-21'
captured_sha: 3829eea37ba432ad6350c950990797e1623c05c5
sources:
  - package.json
  - CLAUDE.md
  - README.md
sources_sha256:
  CLAUDE.md: 4a4c5b4ece44e69fe1e5d6f0849feef9461f2acc275a1c6c8341b62405e118ec
  README.md: 3d21bbec3cdd5901a9448358c7af568506285536850ff6d875c57a6e9c38cb23
  package.json: 18a1323a5738fdea35d5d336cb3b3cdf79a1b76ae97ca8886052d844d2e63551
---

Stack, layout, npm scripts, and the full API surface are already documented accurately in
[../../CLAUDE.md](../../CLAUDE.md) and [../../README.md](../../README.md) — read those first.

Not stated there: this is a single-package repo (no workspaces) — `package.json` has no
`workspaces` field, and server + client are just two source trees (`server/src`, `client/src`)
built by separate `tsc`/`vite` invocations, not a monorepo tool. `pnpm-lock.yaml` exists but
there's only one `package.json` at the root.

For the real system shape and known gaps, see [[architecture]], [[data-model]], and [[gotchas]].
