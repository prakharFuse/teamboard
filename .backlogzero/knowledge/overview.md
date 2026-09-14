---
name: overview
description: What TeamBoard is, tech stack, and where to find setup/API docs
type: knowledge
scope: global
updated: 2026-09-14 (IONE-959)
captured_sha: 515477ad05c7788f020fac514c42e6ce60492008
sources:
  - package.json
  - README.md
sources_sha256:
  README.md: 3d21bbec3cdd5901a9448358c7af568506285536850ff6d875c57a6e9c38cb23
  package.json: 18a1323a5738fdea35d5d336cb3b3cdf79a1b76ae97ca8886052d844d2e63551
---

TeamBoard is an internal team-directory app: a single Express + SQLite API (`server/`) backing a React + Vite client (`client/`) in one npm-workspace-free package (`package.json` has no `workspaces` field — client and server share one `package.json`, differentiated only by separate `tsconfig*.json` files and build scripts).

For tech stack, setup commands, the API table, and project layout, see ../../README.md — it's accurate as of this writing. This page only adds what the README doesn't cover.

## Non-obvious facts

- `pnpm test` runs `pnpm build && node --test "dist/server/**/*.test.js"` — tests are compiled TypeScript run with Node's built-in test runner, not a separate test framework (no Jest/Vitest dependency exists in package.json).
- The server requires Node >= 22.5 specifically for `node:sqlite` (`server/src/db.ts:1`), a still-experimental built-in module — do not suggest swapping in `better-sqlite3` or similar without checking this constraint.
- `server/tsconfig.build.json` extends `server/tsconfig.json` and is what `pnpm build` actually compiles (`server/tsconfig.build.json:1`); it includes everything under `server/src/**/*`, so `*.test.ts` files get compiled into `dist/server/` too — that's how `pnpm test` finds `dist/server/**/*.test.js`.
- The client and server are two separate TypeScript projects (`client/tsconfig.json` targets DOM/bundler resolution, `server/tsconfig.json` targets NodeNext) — there's no shared types package, so `MemberRow` (`server/src/routes/members.ts:4`) and `Member` (`client/src/App.tsx:3`) are duplicated, hand-kept-in-sync interfaces, not imports from a common source.
