---
name: overview
description: What TeamBoard is, tech stack, and where to start reading
type: knowledge
scope: global
updated: 2026-09-12 (IONE-959)
captured_sha: 515477ad05c7788f020fac514c42e6ce60492008
sources:
  - README.md
  - package.json
sources_sha256:
  README.md: 3d21bbec3cdd5901a9448358c7af568506285536850ff6d875c57a6e9c38cb23
  package.json: 18a1323a5738fdea35d5d336cb3b3cdf79a1b76ae97ca8886052d844d2e63551
---

TeamBoard is an internal team-directory app: member profiles, department stats, CSV export for HR. Tech stack, getting-started steps, and the full API table are already documented in [README.md](../../README.md) — read that first.

Two things not in the README worth knowing up front:

- The server requires Node >= 22.5 specifically because it uses the built-in `node:sqlite` module (`server/src/db.ts`) — there is no `better-sqlite3` or other driver dependency in `package.json`.
- `pnpm test` runs `pnpm build` first (compiles server TS to `dist/`) and then runs the compiled `.test.js` files with `node --test`. There is no client test suite.

See [[architecture]] for how the pieces connect, [[data-model]] for the schema, and [[gotchas]] for behavior that surprises people coming from the README/tests alone.
