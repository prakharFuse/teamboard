---
name: overview
description: What TeamBoard is, tech stack, and how to run it — read first for repo orientation
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

TeamBoard is an internal team directory: Express + TypeScript + SQLite (`node:sqlite`) API, React + Vite client. See `../../README.md` for the tech stack, getting-started commands, and the full API table — those are accurate and don't need repeating here.

## Layout

- `server/src/index.ts` — Express app entrypoint, mounts `membersRouter` at `/api/members`
- `server/src/db.ts` — lazy-singleton `getDb()`, creates `data/team.db`, seeds 8 members on first run
- `server/src/routes/members.ts` — all member CRUD + `/export` (CSV) + `/stats`
- `client/src/App.tsx` — single-component UI (list, add form, stats sidebar, CSV export link)

## Notable gap vs. README

The README's project-structure block doesn't mention `server/src/routes/members.test.ts`, which exists and is run by `pnpm test` (`pnpm build && node --test "dist/server/**/*.test.js"` — tests run against **compiled JS**, not source, so a stale `dist/` can make tests pass/fail against old code).

See [[gotchas]] for behavior that isn't obvious from the API table, and [[architecture]] / [[data-model]] for the system shape.
