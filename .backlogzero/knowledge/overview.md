---
name: overview
description: What TeamBoard is, tech stack, and where to start reading the code
type: knowledge
scope: global
updated: 2026-09-13 (IONE-959)
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

TeamBoard is a small internal team-directory app: a single Express API
(`server/src/`) backed by SQLite via Node's built-in `node:sqlite` module, and
a React + Vite client (`client/src/`). See ../../README.md for the stack
summary, API table, and project layout — it is accurate and doesn't need
repeating here.

Two things worth knowing that aren't in the README:

- This is a **single-package** repo, not a pnpm workspace — there's one root
  `package.json` with both `server/` and `client/` as plain subdirectories
  compiled by separate `tsconfig.json` files (`server/tsconfig.build.json`
  emits to `dist/server/`; the client is never compiled to disk, Vite serves
  it directly).
- `node:sqlite` requires Node >= 22.5 (enforced by `engines` in
  package.json). There's no ORM and no migrations — the schema lives inline
  in `getDb()` (`server/src/db.ts:18`) as a single `CREATE TABLE IF NOT
  EXISTS`.

See [[architecture]] for how the pieces connect and [[gotchas]] for
non-obvious behavior.
