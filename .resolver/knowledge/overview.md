---
name: overview
description: What TeamBoard is, its stack, and where things live — read first for orientation
type: knowledge
scope: global
updated: 2026-08-26 (IONE-959)
captured_sha: 515477ad05c7788f020fac514c42e6ce60492008
sources:
  - package.json
  - README.md
  - server/src/index.ts
sources_sha256:
  README.md: 3d21bbec3cdd5901a9448358c7af568506285536850ff6d875c57a6e9c38cb23
  package.json: 18a1323a5738fdea35d5d336cb3b3cdf79a1b76ae97ca8886052d844d2e63551
  server/src/index.ts: 6c2c286cd087d1bbf54d47cbab8b0ee3aa1e86795a2a1a615588e18f9541762b
---

TeamBoard is a small internal team-directory app: Express + TypeScript + SQLite
(`node:sqlite`) server, React + Vite client. Stack, ports, and the full API
table are documented accurately in [../../README.md](../../README.md) — read
that first; this page only adds what it doesn't cover.

## Gaps not covered by the README

- **`node:sqlite` requires Node >= 22.5** (`package.json` `engines`). There is
  no fallback driver — running on an older Node fails at `getDb()`'s first
  call, not at install time.
- **`pnpm test` builds first**: the `test` script is `pnpm build && node
  --test "dist/server/**/*.test.js"`. Tests run against compiled `dist/`
  output, not `src/` directly — a stale `dist/` from a half-finished build
  can make tests pass/fail against old code. `pnpm typecheck` (tsc
  `--noEmit`) is the fast path for type errors without touching `dist/`.
- **No ORM/migration tool** — the schema lives as one inline `CREATE TABLE IF
  NOT EXISTS` in `server/src/db.ts`, and seed rows are inserted only when the
  table is empty. See [data-model.md](data-model.md).
- Server and client are two separate TypeScript projects (`server/tsconfig.json`
  targets NodeNext modules, `client/tsconfig.json` targets bundler-mode ESM)
  with no shared workspace/tsconfig — there's no shared-types package, so the
  `Member`/`Stats` shapes in `client/src/App.tsx` and `MemberRow` in
  `server/src/routes/members.ts` are duplicated by hand.
