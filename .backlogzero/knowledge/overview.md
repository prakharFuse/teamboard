---
name: overview
description: What TeamBoard is, tech stack, and where to find setup/API docs
type: knowledge
scope: global
updated: 2026-09-04 (IONE-959)
captured_sha: 515477ad05c7788f020fac514c42e6ce60492008
sources:
  - package.json
  - README.md
sources_sha256:
  README.md: 3d21bbec3cdd5901a9448358c7af568506285536850ff6d875c57a6e9c38cb23
  package.json: 18a1323a5738fdea35d5d336cb3b3cdf79a1b76ae97ca8886052d844d2e63551
---

TeamBoard is an internal team-directory app: Express + SQLite (`node:sqlite`) API, React + Vite client. See `../../README.md` for setup commands, the full API table, and the `data/` directory note — that table is accurate against the current routes.

The whole app is two workspaces under one `package.json` (no pnpm workspaces / monorepo tooling — just `server/` and `client/` as sibling source trees compiled independently):
- `server/src/` — Express API, compiled by `pnpm build` (`tsc -p server/tsconfig.build.json`) to `dist/server/`. Only the server is compiled to `dist/`; the client is never `tsc`-built standalone, it's served by Vite directly from TS/TSX source (see `client/vite.config.ts`).
- `client/src/` — React UI, run via `vite --config client/vite.config.ts` in dev. No production client build script exists in `package.json` today.

For real gaps and derived facts not in the README, see [[gotchas]], [[architecture]], and [[data-model]].
