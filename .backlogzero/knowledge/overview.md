---
name: overview
description: What TeamBoard is, tech stack, and where to find API/project-structure docs
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

TeamBoard is an internal team-directory app: server-rendered CRUD over a `members`
table (name, email, role, department, start date), with department stats and a CSV
export for HR. See [README.md](../../README.md) for the tech stack, API route table,
and top-level project layout — those are accurate and don't need restating here.

Single `package.json` at repo root drives both `server/` and `client/` (no
workspaces/monorepo tooling — just two `tsconfig`s and a shared `pnpm-lock.yaml`).
Key scripts: `pnpm dev` (server via `--watch` on compiled `dist/`, client via Vite),
`pnpm build` (server only — client is dev-only, never built for prod in this repo),
`pnpm test` (builds server, then runs `node --test` against compiled `dist/server/**/*.test.js`).

For the gap in department validation that CI currently expects, see [gotchas](gotchas.md).
