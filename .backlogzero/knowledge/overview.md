---
name: overview
description: What TeamBoard is, how the repo is packaged, and where to start reading
type: knowledge
scope: global
updated: 2026-09-16 (IONE-959)
captured_sha: 515477ad05c7788f020fac514c42e6ce60492008
sources:
  - package.json
  - README.md
sources_sha256:
  README.md: 3d21bbec3cdd5901a9448358c7af568506285536850ff6d875c57a6e9c38cb23
  package.json: 18a1323a5738fdea35d5d336cb3b3cdf79a1b76ae97ca8886052d844d2e63551
---

TeamBoard is a small internal team-directory app: Express + `node:sqlite` API, React/Vite client. See ../../README.md for the tech stack, API table, and project layout — it is accurate and doesn't need restating here.

## Gaps not covered by README

- This is a **single npm package**, not a workspace/monorepo: one root `package.json`, one `pnpm-lock.yaml`. `server/` and `client/` are plain source folders, not separate packages — there's no per-folder `package.json`.
- `pnpm build` only compiles the **server** (`tsc -p server/tsconfig.build.json`). There is no client production build script; `dev:client` runs Vite in dev mode only. If a production client bundle is ever needed, a `vite build` script would need to be added.
- Requires Node **>= 22.5** specifically for `node:sqlite` (still experimental in that Node line) — not just "Node 22".
