---
name: overview
description: Where to find the project summary, stack, layout, and commands — start here before anything else
type: knowledge
scope: global
updated: '2026-08-21'
captured_sha: 3829eea37ba432ad6350c950990797e1623c05c5
sources:
  - package.json
  - README.md
  - CLAUDE.md
sources_sha256:
  CLAUDE.md: 4a4c5b4ece44e69fe1e5d6f0849feef9461f2acc275a1c6c8341b62405e118ec
  README.md: 3d21bbec3cdd5901a9448358c7af568506285536850ff6d875c57a6e9c38cb23
  package.json: 18a1323a5738fdea35d5d336cb3b3cdf79a1b76ae97ca8886052d844d2e63551
---

For the project summary, tech stack, layout, commands, and endpoint list, see
`../../CLAUDE.md` and `../../README.md` — both are accurate and current.

## Gap: single package, not a monorepo

There is no `pnpm-workspace.yaml` — despite the `server/` + `client/` split shown
in both docs' tree diagrams, this is one `package.json` at the repo root with
one `node_modules`. `pnpm build` compiles only the server (`tsc -p
server/tsconfig.build.json`); there is no client build script wired into
`pnpm build`, `pnpm start`, or the server itself (Express never serves static
assets — see `../../server/src/index.ts`). Production packaging of the client
is undefined in this repo; only the `pnpm dev` Vite-proxy workflow exists.
