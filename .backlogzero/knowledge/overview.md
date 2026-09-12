---
name: overview
description: What TeamBoard is, tech stack, and scripts — read first for orientation
type: knowledge
scope: global
updated: 2026-09-12 (IONE-959)
captured_sha: 515477ad05c7788f020fac514c42e6ce60492008
sources:
  - package.json
  - README.md
sources_sha256:
  README.md: 3d21bbec3cdd5901a9448358c7af568506285536850ff6d875c57a6e9c38cb23
  package.json: 18a1323a5738fdea35d5d336cb3b3cdf79a1b76ae97ca8886052d844d2e63551
---

Tech stack, scripts, and the API surface are documented accurately in `../../README.md` — cite it rather than restating it here.

## Gaps not covered by the README

- **Not a pnpm workspace.** Despite the `client/` + `server/` split, there is a single root `package.json` with no `workspaces` field — one dependency tree for both, one `pnpm-lock.yaml`. Don't go looking for per-package manifests.
- **`pnpm build` only compiles the server** (`tsc -p server/tsconfig.build.json` → `dist/server`). There is no scripted production build for the client — `vite build` is never invoked anywhere in `package.json`. `dev:client` only runs the Vite dev server. If a task requires shipping the client, a build step needs to be added; don't assume one already exists.
- **Server module system:** `server/tsconfig.json` targets `NodeNext`/`NodeNext`, so server-side relative imports use explicit `.js` extensions (e.g. `from '../db.js'` in `server/src/routes/members.ts`) even though the source files are `.ts`. The client (`client/tsconfig.json`) uses `bundler` resolution instead — don't carry the `.js`-suffix convention over to client imports.
