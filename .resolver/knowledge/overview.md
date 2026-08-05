---
name: overview
description: What TeamBoard is and where to find the canonical project docs
type: knowledge
scope: global
updated: 2026-08-05 (IONE-959)
captured_sha: 954ac8ebcb7dafaa72672682a58e3bc82599f6e3
sources:
  - package.json
  - CLAUDE.md
  - README.md
---

TeamBoard's stack, layout, commands, and API surface are already documented in
`../../CLAUDE.md` and `../../README.md` — read those first; this page only adds
what they don't cover.

## Not covered by CLAUDE.md / README

- **Ports:** server hard-codes `4060` (`server/src/index.ts`), overridable via
  `PORT` env var. Vite dev server proxies `/api` to `http://localhost:4060`
  (`client/vite.config.ts`) — the client has no `VITE_API_URL` or similar, so
  the proxy target and the server port must be kept in sync manually if either
  changes.
- **Module systems differ between the two halves:** `server/tsconfig.json` uses
  `NodeNext`/`NodeNext` (server is real ESM, hence the `.js` import extensions
  in `server/src/*.ts`), while `client/tsconfig.json` uses `ESNext`/`bundler`
  (Vite handles resolution, no `.js` suffixes on imports). Don't copy import
  style across the boundary.
- **Single-package repo, not a workspace:** there's one root `package.json`
  covering both `server/` and `client/` — no `pnpm-workspace.yaml`, no per-package
  `package.json`. `pnpm build` only compiles the server; the client is served
  by Vite directly in dev and has no production build script wired up yet.

See also [[architecture]], [[data-model]], [[gotchas]].
