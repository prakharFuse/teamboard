---
name: overview
description: Repo shape and non-obvious facts not covered by the README — read first for orientation
type: knowledge
scope: global
updated: 2026-09-12 (IONE-959)
captured_sha: 515477ad05c7788f020fac514c42e6ce60492008
sources:
  - package.json
  - README.md
  - client/vite.config.ts
sources_sha256:
  README.md: 3d21bbec3cdd5901a9448358c7af568506285536850ff6d875c57a6e9c38cb23
  client/vite.config.ts: 8ce4f4d02ae0440e227419fbeca975395f8a11f6939d20e40f207deb3b6667e6
  package.json: 18a1323a5738fdea35d5d336cb3b3cdf79a1b76ae97ca8886052d844d2e63551
---

For the tech stack, API table, and directory layout, see [README.md](../../README.md) — it is accurate as of HEAD and there's no need to restate it here.

## Gaps the README doesn't cover

- **Single package, not a workspace.** There is no `pnpm-workspace.yaml`. `client/` and `server/` share the one root `package.json` and lockfile; they are distinguished only by separate `tsconfig.json` files and the Vite `root: 'client'` setting in `client/vite.config.ts`. Don't assume per-package installs or independent versioning.
- **`pnpm build` only compiles the server** (`tsc -p server/tsconfig.build.json`). There is no production build step for the client in `package.json` — `dev:client` runs Vite's dev server only. If you need a production client bundle, you'll need to add a `vite build` script; it doesn't exist today.
- **Runtime dependency:** `server/src/db.ts` uses `node:sqlite` (`DatabaseSync`), which requires Node >= 22.5 as stated in the README engines field — this is a hard requirement, not a suggestion, since the import fails outright on older Node.
