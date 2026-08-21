---
name: overview
description: What TeamBoard is and how the repo is laid out — read first for orientation
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

TeamBoard's stack, layout, commands, and API surface are accurately documented in
`../../CLAUDE.md` and `../../README.md` — see those for the endpoint list and
`pnpm` scripts.

One structural fact neither doc states: despite the `pnpm-lock.yaml`, this is
**not** a pnpm workspace — there is a single root `package.json` with no
`pnpm-workspace.yaml`. Server and client dependencies (`express`, `react`,
`vite`, etc.) all live in one `dependencies`/`devDependencies` block. Don't
assume per-package installs or workspace filters (`pnpm --filter`) work here.

See [[architecture]] for how the two halves talk to each other, and
[[data-model]] for the one table backing everything.
